package com.itrend.server.service;

import com.itrend.server.domain.Article;
import com.itrend.server.domain.Tag;
import com.itrend.server.dto.ArticleResponse;
import com.itrend.server.dto.ArticleSaveRequest;
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
import java.util.List;

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

    private LocalDateTime parsePublishedAt(String publishedAt) {
        if (publishedAt == null) return null;
        try {
            return OffsetDateTime.parse(publishedAt).toLocalDateTime();
        } catch (Exception e) {
            return LocalDateTime.parse(publishedAt);
        }
    }
}
