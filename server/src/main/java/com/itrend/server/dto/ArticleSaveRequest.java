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
    private String publishedAt;
    private List<String> tags;
    private String sourceId;
}
