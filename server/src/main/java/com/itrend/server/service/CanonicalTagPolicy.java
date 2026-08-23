package com.itrend.server.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Component
public class CanonicalTagPolicy {

    private final Set<String> allowedTags;

    public CanonicalTagPolicy(ObjectMapper objectMapper) throws IOException {
        var resource = new ClassPathResource("taxonomy/canonical-tags.json");
        List<String> tags;
        try (var inputStream = resource.getInputStream()) {
            tags = objectMapper.readValue(inputStream, new TypeReference<>() {});
        }
        if (new HashSet<>(tags).size() != tags.size()) {
            throw new IllegalStateException("Canonical taxonomy contains duplicate tags");
        }
        this.allowedTags = Set.copyOf(tags);
    }

    public Set<String> validate(List<String> tags) {
        if (tags == null) return Set.of();
        if (tags.size() > 5) {
            throw new ResponseStatusException(BAD_REQUEST, "An article can have at most 5 tags");
        }

        Set<String> normalized = new HashSet<>(tags);
        var invalidTags = normalized.stream().filter(tag -> !allowedTags.contains(tag)).toList();
        if (!invalidTags.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "Unknown canonical tags: " + invalidTags);
        }
        return normalized;
    }
}
