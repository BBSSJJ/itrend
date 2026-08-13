# ITrend

ITrend는 국내외 IT 기사와 기술 블로그 글을 수집하고, AI로 태그와 요약을
생성해 탐색할 수 있게 만드는 웹 서비스입니다.

현재 저장소는 세 애플리케이션으로 구성됩니다.

- `collector`: RSS, Hacker News, Dev.to에서 기사를 수집하고 태깅 작업 수행
- `server`: 기사와 태그를 저장하고 조회 API 제공
- `frontend`: 출처가 표시된 기사 목록, 인기 태그 필터, 페이지네이션 제공

자세한 제품 범위와 데이터 흐름은 [제품 문서](docs/PRODUCT.md)와
[아키텍처 문서](docs/ARCHITECTURE.md)를 참고하세요.

## 요구 사항

- Node.js 22 이상과 npm
- Java 21
- Docker와 Docker Compose

## 처음 실행

```bash
cp collector/.env.example collector/.env
./scripts/setup
```

`collector/.env`의 `COLLECTOR_API_KEY`는 서버의 같은 환경변수 값과 맞춰야
합니다. AI 태깅에 Groq를 사용하려면 `GROQ_API_KEY`도 설정합니다. 키가
없으면 수집기는 키워드 태깅으로 대체합니다.

각 애플리케이션은 별도 터미널에서 실행합니다.

```bash
# API 서버: http://localhost:8080
cd server && ./gradlew bootRun

# 프런트엔드: http://localhost:5173
cd frontend && npm run dev

# 수집기 제어 API: http://localhost:3001
cd collector && npm start
```

기본 개발 DB는 `docker compose up -d postgres`로 실행합니다. 수집은
`POST http://localhost:3001/collect`, 태깅은 `POST http://localhost:3001/tag`로
수동 실행할 수 있습니다. 이 요청은 실제 외부 API와 구성된 LLM을 호출할 수
있으므로 전체 검증 명령에는 포함되지 않습니다.

## 검증

```bash
./scripts/check
```

이 명령은 로컬 PostgreSQL을 준비하고 Collector 문법 검사, 서버 테스트,
프런트엔드 린트와 프로덕션 빌드를 실행합니다. GitHub Actions도 같은 명령을
사용합니다.

## 개발과 배포의 경계

개발과 배포는 실행 환경으로 구분합니다. 애플리케이션 코드와 검증 절차는
공유하고, 데이터베이스 주소, API 키, 공개 URL 같은 값은 환경변수로
주입합니다. 실제 배포 플랫폼, 컨테이너 이미지, 도메인과 비밀 관리 방식은
배포 대상을 정할 때 추가합니다.
