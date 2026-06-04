CREATE TABLE IF NOT EXISTS sources (
    id              BIGSERIAL    PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    url             VARCHAR(500) NOT NULL,
    type            VARCHAR(50)  NOT NULL,
    adapter_type    VARCHAR(50)  NOT NULL,
    config          JSONB,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    last_fetched_at TIMESTAMP,
    last_success_at TIMESTAMP,
    failure_count   INT          NOT NULL DEFAULT 0,
    status          VARCHAR(20)  NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS articles (
    id           BIGSERIAL     PRIMARY KEY,
    title        VARCHAR(500)  NOT NULL,
    url          VARCHAR(1000) NOT NULL UNIQUE,
    description  TEXT,
    author       VARCHAR(200),
    published_at TIMESTAMP,
    created_at   TIMESTAMP     NOT NULL DEFAULT NOW(),
    tagged_at    TIMESTAMP,
    summary      TEXT,
    source_id    BIGINT        REFERENCES sources(id)
);

CREATE TABLE IF NOT EXISTS tags (
    id   BIGSERIAL    PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS article_tags (
    article_id BIGINT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    tag_id     BIGINT NOT NULL REFERENCES tags(id)     ON DELETE CASCADE,
    PRIMARY KEY (article_id, tag_id)
);

-- 자주 쓰는 쿼리 최적화용 인덱스
CREATE INDEX IF NOT EXISTS idx_articles_source_id    ON articles(source_id);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_tags_name             ON tags(name);
