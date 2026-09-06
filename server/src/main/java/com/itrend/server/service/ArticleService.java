package com.itrend.server.service;

import com.itrend.server.domain.Article;
import com.itrend.server.domain.Tag;
import com.itrend.server.domain.TaggingMethod;
import com.itrend.server.domain.TaggingStatus;
import com.itrend.server.domain.SummaryStatus;
import com.itrend.server.dto.ArticleResponse;
import com.itrend.server.dto.ArticleSaveRequest;
import com.itrend.server.dto.ArticleSummaryTaskResponse;
import com.itrend.server.dto.ArticleSummaryUpdateRequest;
import com.itrend.server.dto.ArticleTagUpdateRequest;
import com.itrend.server.dto.ArticleTaggingTaskResponse;
import com.itrend.server.repository.ArticleRepository;
import com.itrend.server.repository.SourceRepository;
import com.itrend.server.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
@RequiredArgsConstructor
public class ArticleService {

    private final ArticleRepository articleRepository;
    private final SourceRepository sourceRepository;
    private final TagRepository tagRepository;
    private final CanonicalTagPolicy canonicalTagPolicy;

    @Transactional
    public int saveAll(List<ArticleSaveRequest> requests) {
        int saved = 0;
        for (ArticleSaveRequest req : requests) {
            if (articleRepository.existsByUrl(req.getUrl())) continue;

            var source = sourceRepository.findByCode(req.getSourceCode())
                    .orElseThrow(() -> new ResponseStatusException(
                            BAD_REQUEST,
                            "Unknown sourceCode: " + req.getSourceCode()
                    ));

            Article article = Article.builder()
                    .title(req.getTitle())
                    .url(req.getUrl())
                    .description(req.getDescription())
                    .author(req.getAuthor())
                    .publishedAt(parsePublishedAt(req.getPublishedAt()))
                    .source(source)
                    .build();

            Article savedArticle = articleRepository.save(article);

            if (req.getTags() != null) {
                Set<Tag> tags = resolveTags(req.getTags());
                savedArticle.completeTagging(tags, TaggingMethod.PROVIDED, null);
            }

            saved++;
        }
        return saved;
    }

    @Transactional(readOnly = true)
    public Page<ArticleResponse> getArticles(int page, int size, String tag) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("publishedAt").descending());
        Page<Article> articles = (tag != null)
                ? articleRepository.findByTags_Name(tag, pageable)
                : articleRepository.findAll(pageable);
        return articles.map(ArticleResponse::from);
    }

    @Transactional(readOnly = true)
    public List<String> getPopularTags(int limit) {
        return tagRepository.findPopularTags(limit);
    }

    @Transactional
    public List<ArticleTaggingTaskResponse> claimTaggingTasks(int limit) {
        if (limit < 1 || limit > 100) {
            throw new ResponseStatusException(BAD_REQUEST, "Tagging limit must be between 1 and 100");
        }

        List<Article> articles = articleRepository.findTaggingCandidatesForUpdate(limit);
        articles.forEach(Article::claimTagging);
        return articles.stream().map(ArticleTaggingTaskResponse::from).toList();
    }

    @Transactional
    public int updateTagsBatch(List<ArticleTagUpdateRequest> requests) {
        int updated = 0;
        for (ArticleTagUpdateRequest req : requests) {
            Article article = articleRepository.findById(req.getId()).orElse(null);
            if (article == null || article.getTaggingStatus() != TaggingStatus.PROCESSING) continue;
            if (req.getMethod() == null) {
                throw new ResponseStatusException(BAD_REQUEST, "Tagging method is required");
            }

            Set<Tag> tags = resolveTags(req.getTags());
            article.completeTagging(tags, req.getMethod(), req.getError());
            updated++;
        }
        return updated;
    }

    @Transactional
    public int failTaggingBatch(List<Long> ids, String error) {
        if (ids == null) return 0;

        int failed = 0;
        for (Long id : ids) {
            Article article = articleRepository.findById(id).orElse(null);
            if (article == null || article.getTaggingStatus() != TaggingStatus.PROCESSING) continue;
            article.failTagging(error);
            failed++;
        }
        return failed;
    }

    @Transactional
    public List<ArticleSummaryTaskResponse> claimSummaryTasks(int limit) {
        if (limit < 1 || limit > 100) {
            throw new ResponseStatusException(BAD_REQUEST, "Summary limit must be between 1 and 100");
        }

        List<Article> articles = articleRepository.findSummaryCandidatesForUpdate(limit);
        articles.forEach(Article::claimSummary);
        return articles.stream().map(ArticleSummaryTaskResponse::from).toList();
    }

    @Transactional
    public int updateSummariesBatch(List<ArticleSummaryUpdateRequest> requests) {
        int updated = 0;
        for (ArticleSummaryUpdateRequest req : requests) {
            Article article = articleRepository.findById(req.getId()).orElse(null);
            if (article == null || article.getSummaryStatus() != SummaryStatus.PROCESSING) continue;

            String summary = req.getSummary() == null ? "" : req.getSummary().trim();
            String model = req.getModel() == null ? "" : req.getModel().trim();
            if (summary.isEmpty() || summary.length() > 500) {
                throw new ResponseStatusException(BAD_REQUEST, "Summary must be between 1 and 500 characters");
            }
            if (model.isEmpty() || model.length() > 100) {
                throw new ResponseStatusException(BAD_REQUEST, "Summary model is required and must be at most 100 characters");
            }

            article.completeSummary(summary, model);
            updated++;
        }
        return updated;
    }

    @Transactional
    public int failSummaryBatch(List<Long> ids, String error) {
        if (ids == null) return 0;

        int failed = 0;
        for (Long id : ids) {
            Article article = articleRepository.findById(id).orElse(null);
            if (article == null || article.getSummaryStatus() != SummaryStatus.PROCESSING) continue;
            article.failSummary(error);
            failed++;
        }
        return failed;
    }

    private Set<Tag> resolveTags(List<String> tagNames) {
        Set<String> validatedNames = canonicalTagPolicy.validate(tagNames);
        Set<Tag> tags = new HashSet<>();
        for (String tagName : validatedNames) {
            Tag tag = tagRepository.findByName(tagName)
                    .orElseGet(() -> tagRepository.save(Tag.builder().name(tagName).build()));
            tags.add(tag);
        }
        return tags;
    }

    private LocalDateTime parsePublishedAt(String publishedAt) {
        if (publishedAt == null) return null;
        try {
            return OffsetDateTime.parse(publishedAt).toLocalDateTime();
        } catch (Exception e) {
            return LocalDateTime.parse(publishedAt);
        }
    }
}
