package com.itrend.server.repository;

import com.itrend.server.domain.Article;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ArticleRepository extends JpaRepository<Article, Long> {

    boolean existsByUrl(String url);

    Optional<Article> findByUrl(String url);

    Page<Article> findByTags_Name(String tagName, Pageable pageable);

    @Query(value = """
            SELECT * FROM articles
            WHERE tagging_status = 'PENDING'
               OR (tagging_status = 'FAILED' AND tagging_attempts < 3)
               OR (tagging_status = 'PROCESSING'
                   AND tagging_started_at < CURRENT_TIMESTAMP - INTERVAL '15 minutes')
            ORDER BY id
            FOR UPDATE SKIP LOCKED
            LIMIT :limit
            """, nativeQuery = true)
    List<Article> findTaggingCandidatesForUpdate(@Param("limit") int limit);

    @Query(value = """
            SELECT * FROM articles
            WHERE summary_status = 'PENDING'
               OR (summary_status = 'FAILED' AND summary_attempts < 3)
               OR (summary_status = 'PROCESSING'
                   AND summary_started_at < CURRENT_TIMESTAMP - INTERVAL '15 minutes')
            ORDER BY id
            FOR UPDATE SKIP LOCKED
            LIMIT :limit
            """, nativeQuery = true)
    List<Article> findSummaryCandidatesForUpdate(@Param("limit") int limit);
}
