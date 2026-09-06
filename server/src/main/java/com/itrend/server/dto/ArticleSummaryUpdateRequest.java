package com.itrend.server.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ArticleSummaryUpdateRequest {

    private Long id;
    private String summary;
    private String model;
}
