package com.itrend.server;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ArticleSourceIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void savesAndReturnsArticleSource() throws Exception {
        String request = """
                [{
                  "title": "Source contract test",
                  "url": "https://example.com/source-contract-test",
                  "publishedAt": "2099-01-01T00:00:00Z",
                  "sourceCode": "kakao-tech"
                }]
                """;

        mockMvc.perform(post("/api/articles/batch")
                        .header("X-API-Key", "dev-secret-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.saved").value(1));

        mockMvc.perform(get("/api/articles").param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].sourceCode").value("kakao-tech"))
                .andExpect(jsonPath("$.content[0].sourceName").value("카카오 기술 블로그"));
    }

    @Test
    void rejectsUnknownSourceCode() throws Exception {
        String request = """
                [{
                  "title": "Unknown source",
                  "url": "https://example.com/unknown-source",
                  "sourceCode": "does-not-exist"
                }]
                """;

        mockMvc.perform(post("/api/articles/batch")
                        .header("X-API-Key", "dev-secret-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isBadRequest());
    }
}
