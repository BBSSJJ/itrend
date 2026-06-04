package com.itrend.server.service;

import com.itrend.server.domain.Article;
import com.itrend.server.domain.Tag;
import com.itrend.server.dto.ArticleResponse;
import com.itrend.server.dto.ArticleSaveRequest;
import com.itrend.server.dto.ArticleTagUpdateRequest;
import com.itrend.server.dto.ArticleUntaggedResponse;
import com.itrend.server.repository.ArticleRepository;
import com.itrend.server.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ArticleService {

    private final ArticleRepository articleRepository;
    private final TagRepository tagRepository;

    @Transactional
    public int saveAll(List<ArticleSaveRequest> requests) {
        int saved = 0;
        for (ArticleSaveRequest req : requests) {
            if (articleRepository.existsByUrl(req.getUrl())) continue;

            Article article = Article.builder()
                    .title(req.getTitle())
                    .url(req.getUrl())
                    .description(req.getDescription())
                    .author(req.getAuthor())
                    .publishedAt(parsePublishedAt(req.getPublishedAt()))
                    .build();

            Article savedArticle = articleRepository.save(article);

            if (req.getTags() != null) {
                for (String tagName : req.getTags()) {
                    Tag tag = tagRepository.findByName(tagName)
                            .orElseGet(() -> tagRepository.save(Tag.builder().name(tagName).build()));
                    savedArticle.addTag(tag);
                }
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

    @Transactional(readOnly = true)
    public List<ArticleUntaggedResponse> getUntaggedArticles(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return articleRepository.findByTaggedAtIsNullOrderByIdAsc(pageable)
                .stream().map(ArticleUntaggedResponse::from).toList();
    }

    @Transactional
    public int updateTagsBatch(List<ArticleTagUpdateRequest> requests) {
        int updated = 0;
        for (ArticleTagUpdateRequest req : requests) {
            Article article = articleRepository.findById(req.getId()).orElse(null);
            if (article == null) continue;

            Set<Tag> tags = new HashSet<>();
            if (req.getTags() != null) {
                for (String tagName : req.getTags()) {
                    Tag tag = tagRepository.findByName(tagName)
                            .orElseGet(() -> tagRepository.save(Tag.builder().name(tagName).build()));
                    tags.add(tag);
                }
            }
            article.updateTags(tags);
            updated++;
        }
        return updated;
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
