package com.itrend.server.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "articles")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Article {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, unique = true)
    private String url;

    @Column(columnDefinition = "text")
    private String description;

    private String author;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "tagged_at")
    private LocalDateTime taggedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "tagging_status", nullable = false)
    private TaggingStatus taggingStatus = TaggingStatus.PENDING;

    @Column(name = "tagging_attempts", nullable = false)
    private int taggingAttempts;

    @Column(name = "tagging_started_at")
    private LocalDateTime taggingStartedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "tagging_method")
    private TaggingMethod taggingMethod;

    @Column(name = "tagging_error", columnDefinition = "text")
    private String taggingError;

    @Column(columnDefinition = "text")
    private String summary;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_id", nullable = false)
    private Source source;

    @ManyToMany
    @JoinTable(
            name = "article_tags",
            joinColumns = @JoinColumn(name = "article_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private Set<Tag> tags = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.taggingStatus == null) this.taggingStatus = TaggingStatus.PENDING;
    }

    @Builder
    public Article(String title, String url, String description, String author,
                   LocalDateTime publishedAt, String summary, Source source) {
        this.title = title;
        this.url = url;
        this.description = description;
        this.author = author;
        this.publishedAt = publishedAt;
        this.summary = summary;
        this.source = source;
    }

    public void addTag(Tag tag) {
        this.tags.add(tag);
    }

    public void claimTagging() {
        this.taggingStatus = TaggingStatus.PROCESSING;
        this.taggingStartedAt = LocalDateTime.now();
        this.taggingAttempts++;
        this.taggingError = null;
    }

    public void completeTagging(Set<Tag> newTags, TaggingMethod method, String error) {
        this.tags.clear();
        this.tags.addAll(newTags);
        this.taggingStatus = TaggingStatus.COMPLETED;
        this.taggingMethod = method;
        this.taggingError = error;
        this.taggedAt = LocalDateTime.now();
    }

    public void failTagging(String error) {
        this.taggingStatus = TaggingStatus.FAILED;
        this.taggingMethod = null;
        this.taggingError = error;
        this.taggedAt = null;
    }
}
