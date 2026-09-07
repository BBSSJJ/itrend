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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SummarizationWorkflowIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @PersistenceContext
    private EntityManager entityManager;

    @Test
    void claimsCompletesAndReturnsSummaryWithMetadata() throws Exception {
        completeExistingSummaryTasks();
        saveArticle("https://example.com/summary-workflow-complete", "2099-02-01T00:00:00Z");

        JsonNode tasks = claimTasks();
        long articleId = tasks.get(0).get("id").asLong();
        entityManager.flush();

        assertThat(jdbcTemplate.queryForObject(
                "SELECT summary_status FROM articles WHERE id = ?", String.class, articleId))
                .isEqualTo("PROCESSING");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT summary_attempts FROM articles WHERE id = ?", Integer.class, articleId))
                .isEqualTo(1);

        String completion = """
                [{
                  "id": %d,
                  "summary": "React와 TypeScript를 활용한 프런트엔드 개발을 설명한다.",
                  "model": "openai/gpt-oss-20b"
                }]
                """.formatted(articleId);

        mockMvc.perform(patch("/api/articles/summarization/complete")
                        .header("X-API-Key", "dev-secret-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(completion))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.updated").value(1));
        entityManager.flush();

        assertThat(jdbcTemplate.queryForObject(
                "SELECT summary_status FROM articles WHERE id = ?", String.class, articleId))
                .isEqualTo("COMPLETED");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT summary_model FROM articles WHERE id = ?", String.class, articleId))
                .isEqualTo("openai/gpt-oss-20b");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT summarized_at IS NOT NULL FROM articles WHERE id = ?", Boolean.class, articleId))
                .isTrue();

        mockMvc.perform(get("/api/articles").param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].summary")
                        .value("React와 TypeScript를 활용한 프런트엔드 개발을 설명한다."));
    }

    @Test
    void rejectsSummaryLongerThanContractLimit() throws Exception {
        completeExistingSummaryTasks();
        saveArticle("https://example.com/summary-workflow-too-long", null);
        long articleId = claimTasks().get(0).get("id").asLong();

        String completion = objectMapper.writeValueAsString(new Object[]{
                new SummaryCompletion(articleId, "가".repeat(501), "openai/gpt-oss-20b")
        });

        mockMvc.perform(patch("/api/articles/summarization/complete")
                        .header("X-API-Key", "dev-secret-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(completion))
                .andExpect(status().isBadRequest());
    }

    @Test
    void recordsFailedSummaryTaskForRetry() throws Exception {
        completeExistingSummaryTasks();
        saveArticle("https://example.com/summary-workflow-failure", null);
        long articleId = claimTasks().get(0).get("id").asLong();

        String failure = """
                {
                  "ids": [%d],
                  "error": "provider unavailable"
                }
                """.formatted(articleId);

        mockMvc.perform(patch("/api/articles/summarization/fail")
                        .header("X-API-Key", "dev-secret-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(failure))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.failed").value(1));
        entityManager.flush();

        assertThat(jdbcTemplate.queryForObject(
                "SELECT summary_status FROM articles WHERE id = ?", String.class, articleId))
                .isEqualTo("FAILED");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT summary_error FROM articles WHERE id = ?", String.class, articleId))
                .isEqualTo("provider unavailable");
    }

    private void completeExistingSummaryTasks() {
        jdbcTemplate.update("""
                UPDATE articles
                SET summary_status = 'COMPLETED', summarized_at = COALESCE(summarized_at, NOW())
                """);
    }

    private void saveArticle(String url, String publishedAt) throws Exception {
        String publishedAtProperty = publishedAt == null
                ? ""
                : "\"publishedAt\": \"" + publishedAt + "\",";
        String request = """
                [{
                  "title": "Summary workflow test",
                  "url": "%s",
                  %s
                  "description": "React and TypeScript frontend development",
                  "sourceCode": "kakao-tech"
                }]
                """.formatted(url, publishedAtProperty);

        mockMvc.perform(post("/api/articles/batch")
                        .header("X-API-Key", "dev-secret-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.saved").value(1));
    }

    private JsonNode claimTasks() throws Exception {
        String response = mockMvc.perform(post("/api/articles/summarization/claim")
                        .header("X-API-Key", "dev-secret-key")
                        .param("limit", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response);
    }

    private record SummaryCompletion(long id, String summary, String model) {
    }
}
