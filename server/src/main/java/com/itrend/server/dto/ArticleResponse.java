package com.itrend.server.dto;

import com.itrend.server.domain.Article;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class ArticleResponse {

    private Long id;
    private String title;
    private String url;
    private String description;
    private String author;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
    private String categoryName;
    private String categorySlug;
    private List<String> tags;

    public static ArticleResponse from(Article article) {
        return ArticleResponse.builder()
                .id(article.getId())
                .title(article.getTitle())
                .url(article.getUrl())
                .description(article.getDescription())
                .author(article.getAuthor())
                .publishedAt(article.getPublishedAt())
                .createdAt(article.getCreatedAt())
                .categoryName(article.getCategory() != null ? article.getCategory().getName() : null)
                .categorySlug(article.getCategory() != null ? article.getCategory().getSlug() : null)
                .tags(article.getTags().stream().map(tag -> tag.getName()).toList())
                .build();
    }
}
