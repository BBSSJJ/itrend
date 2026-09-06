package com.itrend.server;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class TaggingWorkflowIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @PersistenceContext
    private EntityManager entityManager;

    @Test
    void claimsAndCompletesHybridTaggingTaskWithMetadata() throws Exception {
        completeExistingTaggingTasks();
        saveArticle("https://example.com/tagging-workflow-complete");

        JsonNode tasks = claimTasks();
        long articleId = tasks.get(0).get("id").asLong();
        entityManager.flush();

        assertThat(jdbcTemplate.queryForObject(
                "SELECT tagging_status FROM articles WHERE id = ?", String.class, articleId))
                .isEqualTo("PROCESSING");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT tagging_attempts FROM articles WHERE id = ?", Integer.class, articleId))
                .isEqualTo(1);

        String completion = """
                [{
                  "id": %d,
                  "tags": ["monorepo", "optimistic-locking", "load-balancing", "btrfs"],
                  "method": "HYBRID",
                  "error": null
                }]
                """.formatted(articleId);

        mockMvc.perform(patch("/api/articles/tagging/complete")
                        .header("X-API-Key", "dev-secret-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(completion))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.updated").value(1));
        entityManager.flush();

        assertThat(jdbcTemplate.queryForObject(
                "SELECT tagging_status FROM articles WHERE id = ?", String.class, articleId))
                .isEqualTo("COMPLETED");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT tagging_method FROM articles WHERE id = ?", String.class, articleId))
                .isEqualTo("HYBRID");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT tagged_at IS NOT NULL FROM articles WHERE id = ?", Boolean.class, articleId))
                .isTrue();
    }

    @Test
    void rejectsTagsOutsideCanonicalTaxonomy() throws Exception {
        completeExistingTaggingTasks();
        saveArticle("https://example.com/tagging-workflow-invalid-tag");
        long articleId = claimTasks().get(0).get("id").asLong();

        String completion = """
                [{
                  "id": %d,
                  "tags": ["invented-tag"],
                  "method": "AI"
                }]
                """.formatted(articleId);

        mockMvc.perform(patch("/api/articles/tagging/complete")
                        .header("X-API-Key", "dev-secret-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(completion))
                .andExpect(status().isBadRequest());
    }

    @Test
    void recordsFailedTaggingTaskForRetry() throws Exception {
        completeExistingTaggingTasks();
        saveArticle("https://example.com/tagging-workflow-failure");
        long articleId = claimTasks().get(0).get("id").asLong();

        String failure = """
                {
                  "ids": [%d],
                  "error": "provider unavailable"
                }
                """.formatted(articleId);

        mockMvc.perform(patch("/api/articles/tagging/fail")
                        .header("X-API-Key", "dev-secret-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(failure))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.failed").value(1));
        entityManager.flush();

        assertThat(jdbcTemplate.queryForObject(
                "SELECT tagging_status FROM articles WHERE id = ?", String.class, articleId))
                .isEqualTo("FAILED");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT tagging_error FROM articles WHERE id = ?", String.class, articleId))
                .isEqualTo("provider unavailable");
    }

    private void completeExistingTaggingTasks() {
        jdbcTemplate.update("""
                UPDATE articles
                SET tagging_status = 'COMPLETED', tagged_at = COALESCE(tagged_at, NOW())
                """);
    }

    private void saveArticle(String url) throws Exception {
        String request = """
                [{
                  "title": "Tagging workflow test",
                  "url": "%s",
                  "description": "React and TypeScript",
                  "sourceCode": "kakao-tech"
                }]
                """.formatted(url);

        mockMvc.perform(post("/api/articles/batch")
                        .header("X-API-Key", "dev-secret-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.saved").value(1));
    }

    private JsonNode claimTasks() throws Exception {
        String response = mockMvc.perform(post("/api/articles/tagging/claim")
                        .header("X-API-Key", "dev-secret-key")
                        .param("limit", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response);
    }
}
