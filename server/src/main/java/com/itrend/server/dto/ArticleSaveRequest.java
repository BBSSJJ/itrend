package com.itrend.server.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class ArticleSaveRequest {

    private String title;
    private String url;
    private String description;
    private String author;
    private String publishedAt;   // ISO 8601 문자열 (JS Date.toISOString() 형식)
    private String categorySlug;
    private List<String> tags;
    private String sourceId;      // collector sources.js의 id값, 현재는 무시 (추후 DB 소스 연동 시 활용)
}
