# Architecture

## 시스템 개요

```text
한국어 중심 RSS 출처
            |
            v
  Node.js collector :3001
       | collect       | tag / summarize
       v               v
 POST /api/articles/batch  claim/complete/fail AI jobs
            \         /
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
초기 배포에서는 한국어 콘텐츠를 제공하는 국내 출처만 활성화한다. 해외 RSS와
Hacker News, Dev.to 어댑터는 향후 범위 확장에 대비해 유지하되 수집하지 않는다.
이 정책은 기사별 언어 판별이 아니라 출처의 활성 상태를 기준으로 적용한다.
RSS 설명은 일반 description 필드뿐 아니라 Medium 계열 피드의
`content:encodedSnippet`도 정규화하여 태깅과 요약 입력으로 사용한다.
마지막 수집 상태는 개발 환경의 `collector/state.json`에 저장되며 Git에서
제외된다.

태깅은 수집과 분리되어 있다. `collector/src/tagger-job.js`가 서버에서 대기 또는
재시도 가능한 기사를 선점하고 Groq 또는 키워드 태거를 실행한 뒤 완료나 실패를
서버에 보고한다. Groq 태거는 `openai/gpt-oss-20b`의 strict JSON Schema를
사용하며 폐쇄형 canonical 태그만 반환한다. 고정밀 한국어·영문 별칭으로 먼저
찾은 태그는 AI 결과와 병합하고 `HYBRID` 처리로 기록한다. Collector와 Server가
기사당 태그를 0~5개로 제한한다. AI 키가 없거나 호출이 실패하면 키워드 태거를
사용하고 그 처리 방법과 원인을 함께 기록한다.
태깅 직전에는 원본 `description`을 변경하지 않고 HTML, Markdown 이미지, URL,
제어 문자와 반복 공백을 제거한 전용 입력을 만든다. 정제된 제목은 최대 200자,
설명은 최대 600자로 제한하며 Groq와 키워드 태거가 같은 입력을 사용한다. Groq
요청 청크 크기와 간격은 `TAGGER_CHUNK_SIZE`, `TAGGER_CHUNK_DELAY_MS`로 조정할
수 있다.
`collector/index.js`는 `/collect`, `/tag`, `/summarize` 제어 API를 제공한다.

요약도 수집과 태깅에서 분리되어 있다. `collector/src/summarizer-job.js`가 요약
대상 기사를 선점하고, 제목과 설명에서 마크업과 URL을 제거한 뒤 설명을 최대
2,000자로 제한해 Groq에 전달한다. `openai/gpt-oss-20b`의 strict JSON Schema로
500자 이내의 한국어 요약을 받고 사용 모델과 함께 저장한다. 설명이 120자 이상이면
대체로 2~4문장 안에서 배경·문제, 핵심 접근, 명시된 결과·의미를 필요한 만큼 담고
구체적인 기술, 수치와 성과를 우선한다. 입력에 없는 사실을 추가하지 않도록 프롬프트를
제한한다. 상세 요약은 제목 재진술에 그치지 않도록 문장 수와 관계없이 최소 80자의
정보량 하한을 검증한다. 설명이 짧으면 제목과 제한된 설명만 보수적으로 정리한다.
500자를 넘긴 응답은 완결된 마지막 문장 경계까지만 안전하게 줄이며, 경계를 찾을 수
없으면 저장하지 않는다. 모든 요약은 `~한다`, `~했다`, `~이다`와 같은 한국어
`~다`체로 통일하며 `~습니다`, `~해요` 같은 존댓말 종결 응답은 저장하지 않는다.
키가 없거나 호출이 실패하면 요약을 만들지 않고 실패 원인을 기록한다. 요청 청크
크기와 간격은 `SUMMARY_CHUNK_SIZE`, `SUMMARY_CHUNK_DELAY_MS`로 조정한다.
`collector/index.js`의 `/summarize` 제어 API로 작업을 실행한다.
Groq 응답에서 기사가 누락되면 해당 기사만 한 번 재요청한다. Worker는 각 청크를
완료 즉시 저장하므로 이후 청크가 실패해도 앞서 만든 요약은 유지된다. 청크 검증이
실패하면 기사를 개별 처리해 문제가 있는 한 건이 같은 청크의 정상 요약을 막지 않는다.

Canonical 태그 목록의 단일 원본은 `config/canonical-tags.json`이다. Collector는
이 파일을 직접 읽고 Server 빌드는 같은 파일을 classpath resource로 복사하여 태그
저장 전에 다시 검증한다. 현재 기사 집합에서 확인된 모노리포, 낙관적 잠금, 부하
분산과 Btrfs도 각각 canonical 태그로 관리한다.

### Server

Spring Boot API가 기사, 태그, 출처 엔티티를 PostgreSQL에 저장한다. Collector의
쓰기 API는 `X-API-Key`로 보호된다. 기사 목록과 인기 태그는 읽기 API로
공개된다. JPA는 스키마를 생성하지 않고 `schema.sql`과의 일치 여부를 검증한다.
서버는 `sourceCode`로 등록된 출처를 찾아 기사와 연결하며 알 수 없는 코드는
거부한다. 기사 응답은 `sourceCode`와 `sourceName`을 포함한다.

태깅 상태는 `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`로 관리한다. 작업
선점은 PostgreSQL의 `FOR UPDATE SKIP LOCKED`를 사용하여 여러 Worker가 같은
기사를 처리하지 않게 한다. 실패 작업은 다음 실행에서 최대 3회까지 재시도하며,
15분 넘게 `PROCESSING`인 작업은 중단된 것으로 보고 다시 선점할 수 있다.
요약도 독립된 동일 상태 모델과 선점 규칙을 사용하며 최대 3회 재시도한다. 따라서
요약 제공자 장애가 태깅이나 공개 기사 조회를 막지 않는다.

주요 API:

- `POST /api/articles/batch`: 수집 기사 저장
- `GET /api/articles`: 최신 기사 페이지 조회 및 태그 필터
- `GET /api/tags/popular`: 사용 빈도 기준 인기 태그
- `POST /api/articles/tagging/claim`: 태깅 작업 선점
- `PATCH /api/articles/tagging/complete`: 태그와 처리 메타데이터 저장
- `PATCH /api/articles/tagging/fail`: 태깅 실패 기록
- `POST /api/articles/summarization/claim`: 요약 작업 선점
- `PATCH /api/articles/summarization/complete`: 요약과 사용 모델 저장
- `PATCH /api/articles/summarization/fail`: 요약 실패 기록

Collector가 호출하는 쓰기, 태깅, 요약 작업 API는 모두 `X-API-Key`로 보호된다.

### Frontend

React 애플리케이션이 기사와 인기 태그 API를 호출한다. 로컬 개발에서는 Vite가
`/api` 요청을 `localhost:8080`으로 프록시한다. 프로덕션에서는 동일 출처
라우팅 또는 별도 API 기본 URL 전략이 필요하다. 기사 요약이 있으면 제목 아래에
원본 설명보다 우선 표시하고 `AI 요약` 배지로 생성 콘텐츠임을 구분한다.

## 데이터 모델

- `sources`: 숫자 PK와 외부 계약용 고유 `code`를 가진 수집 출처 및 상태
- `articles`: 원문 메타데이터, 태깅 및 요약의 상태·시도·시각·결과·오류
- `tags`: 정규화된 태그 이름
- `article_tags`: 기사와 태그의 다대다 관계

기사 URL과 태그 이름은 각각 유일해야 한다. 데이터베이스 정의의 원본은
`server/src/main/resources/db/schema.sql`이다. `scripts/setup`과 `scripts/check`는
새 DB뿐 아니라 기존 로컬 볼륨에도 이 스키마의 멱등 변경을 적용한다.

## 환경 분리

- 로컬: Docker Compose PostgreSQL, Vite 개발 서버, 각 런타임 직접 실행
- CI: 임시 PostgreSQL과 `scripts/check`를 사용한 재현 가능한 검증
- 배포: 동일한 빌드 결과를 사용하되 DB, 비밀, URL, 실행 프로세스는 환경변수와
  배포 인프라에서 제공

배포 대상이 결정되기 전에는 플랫폼별 설정을 추가하지 않는다.

## 미구현 경계

자동 수집 스케줄, 원문 본문 기반 요약, Collector 제어 API 보호 등 현재 구현되지 않은
작업의 우선순위와 완료 상태는 `docs/plans/tech-debt.md`에서만 관리한다.
