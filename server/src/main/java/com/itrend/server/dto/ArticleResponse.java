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
    private String sourceCode;
    private String sourceName;
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
                .sourceCode(article.getSource().getCode())
                .sourceName(article.getSource().getName())
                .tags(article.getTags().stream().map(tag -> tag.getName()).toList())
                .build();
    }
}
