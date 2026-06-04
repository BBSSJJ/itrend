package com.itrend.server.repository;

import com.itrend.server.domain.Article;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ArticleRepository extends JpaRepository<Article, Long> {

    boolean existsByUrl(String url);

    Optional<Article> findByUrl(String url);

    Page<Article> findByTags_Name(String tagName, Pageable pageable);

    List<Article> findByTaggedAtIsNullOrderByIdAsc(Pageable pageable);
}
