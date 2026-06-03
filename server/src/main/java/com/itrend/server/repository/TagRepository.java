package com.itrend.server.repository;

import com.itrend.server.domain.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, Long> {

    Optional<Tag> findByName(String name);

    @Query(value = """
            SELECT t.name FROM tags t
            JOIN article_tags at ON t.id = at.tag_id
            GROUP BY t.name
            ORDER BY COUNT(*) DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<String> findPopularTags(int limit);
}
