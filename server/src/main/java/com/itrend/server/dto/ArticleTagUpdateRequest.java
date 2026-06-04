package com.itrend.server.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class ArticleTagUpdateRequest {

    private Long id;
    private List<String> tags;
}
