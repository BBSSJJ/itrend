package com.itrend.server.dto;

import com.itrend.server.domain.Article;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ArticleSummaryTaskResponse {

    private Long id;
    private String title;
    private String description;

    public static ArticleSummaryTaskResponse from(Article article) {
        return ArticleSummaryTaskResponse.builder()
                .id(article.getId())
                .title(article.getTitle())
                .description(article.getDescription())
                .build();
    }
}
