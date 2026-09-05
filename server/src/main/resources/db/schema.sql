CREATE TABLE IF NOT EXISTS sources (
    id              BIGSERIAL    PRIMARY KEY,
    code            VARCHAR(100) NOT NULL UNIQUE,
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

INSERT INTO sources (code, name, url, type, adapter_type, config, is_active, status)
VALUES
    ('yozm', '요즘IT', 'https://yozm.wishket.com/magazine/itservice/feed/', 'rss', 'rss', '{}'::jsonb, TRUE, 'active'),
    ('kakao-tech', '카카오 기술 블로그', 'https://tech.kakao.com/feed/', 'rss', 'rss', '{}'::jsonb, TRUE, 'active'),
    ('woowahan', '우아한형제들 기술 블로그', 'https://techblog.woowahan.com/feed/', 'rss', 'rss', '{}'::jsonb, TRUE, 'active'),
    ('toss-tech', '토스 기술 블로그', 'https://toss.tech/rss.xml', 'rss', 'rss', '{}'::jsonb, TRUE, 'active'),
    ('line-engineering', 'LINE Engineering', 'https://engineering.linecorp.com/ko/feed', 'rss', 'rss', '{}'::jsonb, TRUE, 'active'),
    ('naver-d2', 'NAVER D2', 'https://d2.naver.com/d2.atom', 'rss', 'rss', '{}'::jsonb, TRUE, 'active'),
    ('kakaopay-tech', '카카오페이 기술 블로그', 'https://tech.kakaopay.com/rss.xml', 'rss', 'rss', '{}'::jsonb, FALSE, 'inactive'),
    ('socar-tech', '쏘카 기술 블로그', 'https://tech.socarcorp.kr/feed', 'rss', 'rss', '{}'::jsonb, TRUE, 'active'),
    ('banksalad-tech', '뱅크샐러드 기술 블로그', 'https://blog.banksalad.com/rss.xml', 'rss', 'rss', '{}'::jsonb, TRUE, 'active'),
    ('nhn-meetup', 'NHN Cloud Meetup', 'https://meetup.nhncloud.com/rss', 'rss', 'rss', '{}'::jsonb, TRUE, 'active'),
    ('geeknews', 'GeekNews', 'https://news.hada.io/rss/news', 'rss', 'rss', '{}'::jsonb, TRUE, 'active'),
    ('aws-blog', 'AWS Blog', 'https://aws.amazon.com/blogs/aws/feed/', 'rss', 'rss', '{}'::jsonb, TRUE, 'active'),
    ('spring-blog', 'Spring Blog', 'https://spring.io/blog.atom', 'rss', 'rss', '{}'::jsonb, TRUE, 'active'),
    ('thenewstack', 'The New Stack', 'https://thenewstack.io/feed/', 'rss', 'rss', '{}'::jsonb, TRUE, 'active'),
    ('infoq', 'InfoQ', 'https://feed.infoq.com/', 'rss', 'rss', '{}'::jsonb, TRUE, 'active'),
    ('hackernews', 'Hacker News', 'https://hacker-news.firebaseio.com/v0', 'api', 'hn_api', '{"limit": 30}'::jsonb, TRUE, 'active'),
    ('devto', 'Dev.to', 'https://dev.to/api/articles', 'api', 'devto_api', '{"limit": 30}'::jsonb, TRUE, 'active')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS articles (
    id           BIGSERIAL     PRIMARY KEY,
    title        VARCHAR(500)  NOT NULL,
    url          VARCHAR(1000) NOT NULL UNIQUE,
    description  TEXT,
    author       VARCHAR(200),
    published_at TIMESTAMP,
    created_at   TIMESTAMP     NOT NULL DEFAULT NOW(),
    tagging_status VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    tagging_attempts INT        NOT NULL DEFAULT 0,
    tagging_started_at TIMESTAMP,
    tagging_method VARCHAR(30),
    tagging_error TEXT,
    tagged_at    TIMESTAMP,
    summary      TEXT,
    source_id    BIGINT        NOT NULL REFERENCES sources(id)
);

-- 기존 로컬 볼륨에도 태깅 상태 컬럼을 안전하게 추가한다.
ALTER TABLE articles ADD COLUMN IF NOT EXISTS tagging_status VARCHAR(20) NOT NULL DEFAULT 'PENDING';
ALTER TABLE articles ADD COLUMN IF NOT EXISTS tagging_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS tagging_started_at TIMESTAMP;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS tagging_method VARCHAR(30);
ALTER TABLE articles ADD COLUMN IF NOT EXISTS tagging_error TEXT;

UPDATE articles
SET tagging_status = 'COMPLETED'
WHERE tagged_at IS NOT NULL AND tagging_status = 'PENDING';

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
CREATE INDEX IF NOT EXISTS idx_articles_tagging_queue
    ON articles(tagging_status, tagging_started_at, id);
CREATE INDEX IF NOT EXISTS idx_tags_name             ON tags(name);
