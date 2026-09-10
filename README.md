# ITrend

ITrend는 여러 곳에 흩어진 국내 IT 기사와 기술 블로그 글을 모아 보여주는 웹
서비스입니다. AI가 기사 제목과 설명을 바탕으로 태그와 한국어 요약을 생성해,
관심 있는 기술 소식의 핵심을 빠르게 찾을 수 있도록 돕습니다.

## 주요 기능

- 한국어 콘텐츠를 제공하는 국내 RSS 출처 수집
- 원문 링크와 출처를 포함한 최신 기사 목록
- AI 기반 기술 태그와 한국어 요약
- 인기 태그 필터와 페이지 탐색

## 프로젝트 구성

| 디렉터리 | 역할 |
|---|---|
| `collector/` | 기사 수집, AI 태깅 및 요약 |
| `server/` | 기사 저장과 조회 API |
| `frontend/` | 기사 목록과 태그 탐색 화면 |

## 로컬에서 실행하기

Node.js 22 이상, Java 21, Docker와 Docker Compose가 필요합니다.

먼저 Collector 환경 파일을 만들고 의존성과 PostgreSQL을 준비합니다.

```bash
cp collector/.env.example collector/.env
./scripts/setup
```

`collector/.env`의 `COLLECTOR_API_KEY`는 서버의 같은 환경변수와 일치해야
합니다. 로컬에서 서버 기본 설정을 사용한다면 `dev-secret-key`로 맞출 수
있습니다. AI 태깅과 요약을 사용하려면 `GROQ_API_KEY`도 설정합니다.

각 애플리케이션은 별도 터미널에서 실행합니다.

```bash
# API 서버: http://localhost:8080
cd server && ./gradlew bootRun

# 프런트엔드: http://localhost:5173
cd frontend && npm run dev

# Collector 제어 API: http://localhost:3001
cd collector && npm start
```

## 검증

```bash
./scripts/check
```

이 명령은 Collector 테스트, 서버 테스트, 프런트엔드 린트와 프로덕션 빌드를
포함한 저장소 전체 검증을 실행합니다.

## 문서

- [제품 목적과 범위](docs/PRODUCT.md)
- [시스템 구조와 데이터 흐름](docs/ARCHITECTURE.md)
- [검증 현황과 알려진 한계](docs/QUALITY.md)
- [Git 작업 방식](docs/WORKFLOW.md)
- [계획과 기술 부채](docs/plans/README.md)

구성요소별 자세한 실행 방법은
[Collector README](collector/README.md)와
[Frontend README](frontend/README.md)를 참고하세요.
