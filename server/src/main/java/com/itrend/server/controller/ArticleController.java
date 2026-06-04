package com.itrend.server.controller;

import com.itrend.server.dto.ArticleResponse;
import com.itrend.server.dto.ArticleSaveRequest;
import com.itrend.server.dto.ArticleTagUpdateRequest;
import com.itrend.server.dto.ArticleUntaggedResponse;
import com.itrend.server.service.ArticleService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ArticleController {

    private final ArticleService articleService;

    @Value("${collector.api-key}")
    private String collectorApiKey;

    @PostMapping("/api/articles/batch")
    public ResponseEntity<Map<String, Integer>> saveBatch(
            @RequestHeader(value = "X-API-Key", required = false) String apiKey,
            @RequestBody List<ArticleSaveRequest> requests) {

        if (!collectorApiKey.equals(apiKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        int saved = articleService.saveAll(requests);
        int skipped = requests.size() - saved;
        return ResponseEntity.ok(Map.of("saved", saved, "skipped", skipped));
    }

    @GetMapping("/api/articles")
    public Page<ArticleResponse> getArticles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String tag) {

        return articleService.getArticles(page, size, tag);
    }

    @GetMapping("/api/tags/popular")
    public List<String> getPopularTags(
            @RequestParam(defaultValue = "15") int limit) {

        return articleService.getPopularTags(limit);
    }

    @GetMapping("/api/articles/untagged")
    public List<ArticleUntaggedResponse> getUntaggedArticles(
            @RequestParam(defaultValue = "50") int limit) {

        return articleService.getUntaggedArticles(limit);
    }

    @PatchMapping("/api/articles/tags/batch")
    public ResponseEntity<Map<String, Integer>> updateTagsBatch(
            @RequestHeader(value = "X-API-Key", required = false) String apiKey,
            @RequestBody List<ArticleTagUpdateRequest> requests) {

        if (!collectorApiKey.equals(apiKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        int updated = articleService.updateTagsBatch(requests);
        return ResponseEntity.ok(Map.of("updated", updated));
    }
}
