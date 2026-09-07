package com.itrend.server.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class ArticleSummaryFailureRequest {

    private List<Long> ids;
    private String error;
}
