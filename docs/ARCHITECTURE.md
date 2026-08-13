# Architecture

## 시스템 개요

```text
RSS / Hacker News / Dev.to
            |
            v
  Node.js collector :3001
       | collect          | tag
       v                  v
 POST /api/articles/batch  GET/PATCH untagged articles
            \            /
             Spring Boot :8080
                    |
                PostgreSQL
                    ^
                    |
             React/Vite :5173
```

## 구성요소

### Collector

`collector/src/adapters/`가 서로 다른 외부 소스를 공통 기사 형태로 정규화한다.
`collector/src/collector.js`가 활성 소스를 순회하고 서버로 배치를 전송한다.
각 기사는 Collector 설정의 `id`를 안정적인 `sourceCode`로 전송한다.
마지막 수집 상태는 개발 환경의 `collector/state.json`에 저장되며 Git에서
제외된다.

태깅은 수집과 분리되어 있다. `collector/src/tagger-job.js`가 서버에서
`tagged_at`이 없는 기사를 조회하고 Groq 또는 키워드 태거를 실행한 뒤 결과를
서버에 다시 보낸다. `collector/index.js`는 `/collect`와 `/tag` 제어 API를
제공한다.

### Server

Spring Boot API가 기사, 태그, 출처 엔티티를 PostgreSQL에 저장한다. Collector의
쓰기 API는 `X-API-Key`로 보호된다. 기사 목록과 인기 태그는 읽기 API로
공개된다. JPA는 스키마를 생성하지 않고 `schema.sql`과의 일치 여부를 검증한다.
서버는 `sourceCode`로 등록된 출처를 찾아 기사와 연결하며 알 수 없는 코드는
거부한다. 기사 응답은 `sourceCode`와 `sourceName`을 포함한다.

주요 API:

- `POST /api/articles/batch`: 수집 기사 저장
- `GET /api/articles`: 최신 기사 페이지 조회 및 태그 필터
- `GET /api/tags/popular`: 사용 빈도 기준 인기 태그
- `GET /api/articles/untagged`: 태깅 대기 기사 조회
- `PATCH /api/articles/tags/batch`: 태그 결과 저장

### Frontend

React 애플리케이션이 기사와 인기 태그 API를 호출한다. 로컬 개발에서는 Vite가
`/api` 요청을 `localhost:8080`으로 프록시한다. 프로덕션에서는 동일 출처
라우팅 또는 별도 API 기본 URL 전략이 필요하다.

## 데이터 모델

- `sources`: 숫자 PK와 외부 계약용 고유 `code`를 가진 수집 출처 및 상태
- `articles`: 원문 메타데이터, 태깅 시각, 향후 요약
- `tags`: 정규화된 태그 이름
- `article_tags`: 기사와 태그의 다대다 관계

기사 URL과 태그 이름은 각각 유일해야 한다. 데이터베이스 정의의 원본은
`server/src/main/resources/db/schema.sql`이다.

## 환경 분리

- 로컬: Docker Compose PostgreSQL, Vite 개발 서버, 각 런타임 직접 실행
- CI: 임시 PostgreSQL과 `scripts/check`를 사용한 재현 가능한 검증
- 배포: 동일한 빌드 결과를 사용하되 DB, 비밀, URL, 실행 프로세스는 환경변수와
  배포 인프라에서 제공

배포 대상이 결정되기 전에는 플랫폼별 설정을 추가하지 않는다.

## 현재 확인된 불일치

아래 항목은 현재 구조를 설명하기 위한 기록이며 이 문서 작성 시 수정하지 않았다.

- `scheduler.js`의 cron 등록은 현재 `index.js`에서 로드되지 않는다.
- `summary` 컬럼은 존재하지만 생성·조회·표시 흐름은 아직 없다.
- Collector 제어 API 자체에는 인증이 없다.

구체적인 후속 작업은 `docs/plans/tech-debt.md`에서 관리한다.
