package com.itrend.server.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "sources")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Source {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String url;

    @Column(nullable = false)
    private String type;

    @Column(name = "adapter_type", nullable = false)
    private String adapterType;

    @Column(columnDefinition = "jsonb")
    private String config;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "last_fetched_at")
    private LocalDateTime lastFetchedAt;

    @Column(name = "last_success_at")
    private LocalDateTime lastSuccessAt;

    @Column(name = "failure_count", nullable = false)
    private int failureCount = 0;

    @Column(nullable = false)
    private String status;

    @Builder
    public Source(String name, String url, String type, String adapterType,
                  String config, boolean isActive, String status) {
        this.name = name;
        this.url = url;
        this.type = type;
        this.adapterType = adapterType;
        this.config = config;
        this.isActive = isActive;
        this.status = status;
    }

    public void recordFetchSuccess() {
        this.lastFetchedAt = LocalDateTime.now();
        this.lastSuccessAt = LocalDateTime.now();
        this.failureCount = 0;
        this.status = "active";
    }

    public void recordFetchFailure() {
        this.lastFetchedAt = LocalDateTime.now();
        this.failureCount++;
        if (this.failureCount >= 5) {
            this.status = "error";
        }
    }
}
