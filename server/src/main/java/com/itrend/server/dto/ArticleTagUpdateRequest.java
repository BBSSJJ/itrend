package com.itrend.server.dto;

import com.itrend.server.domain.TaggingMethod;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class ArticleTagUpdateRequest {

    private Long id;
    private List<String> tags;
    private TaggingMethod method;
    private String error;
}
