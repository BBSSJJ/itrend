# ITrend Collector

외부 RSS와 공개 API에서 기사를 수집하고, 서버에 저장된 태깅 작업을 처리하는
Node.js 애플리케이션이다. 수집과 태깅은 서로 독립적으로 실행한다.

## 역할과 데이터 흐름

### 기사 수집

1. `src/config/sources.js`에서 활성 소스를 읽는다.
2. RSS, Hacker News 또는 Dev.to 어댑터가 새 기사를 공통 형태로 정규화한다.
3. `POST /api/articles/batch`로 원본 메타데이터를 서버에 저장한다.
4. 전송이 성공하면 `state.json`의 소스별 수집 시점을 갱신한다.

### 기사 태깅

1. 서버의 `POST /api/articles/tagging/claim`에서 처리할 기사를 선점한다.
2. 제목과 설명을 코드로 정제한 뒤 Groq 또는 키워드 태거로 분석한다.
3. 저장소의 `config/canonical-tags.json`에 있는 태그만 0~5개 선택한다.
4. 완료 또는 실패 결과와 처리 메타데이터를 서버에 보고한다.

원본 `description`은 태깅 입력을 만들 때 변경하지 않는다. Groq 키가 없거나
호출이 실패하면 키워드 태거를 사용한다. 자세한 서버 계약과 재시도 정책은
[`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md)를 참고한다.

## 주요 구조

```text
collector/
├── index.js                  /collect, /tag 제어 API
├── src/
│   ├── collector.js          소스 순회와 기사 전송
│   ├── tagger-job.js         태깅 작업 선점·완료·실패 보고
│   ├── adapters/             RSS 및 공개 API 어댑터
│   ├── config/
│   │   ├── sources.js        수집 소스와 활성 상태
│   │   └── keywords.js       canonical 태그와 별칭 연결
│   └── services/             전송, 상태, 태깅, 입력 정제
├── test/                     Node 내장 테스트
└── state.json                로컬 수집 상태(자동 생성, Git 제외)
```

현재 소스 목록과 활성 상태는 중복 문서화하지 않고
`src/config/sources.js`를 단일 기준으로 삼는다. `src/scheduler.js`는 아직 실행
진입점에 연결되지 않았으므로 수집과 태깅은 수동으로 시작해야 한다.

## 실행

루트에서 `./scripts/setup`을 실행한 뒤 환경변수를 준비한다.

```bash
cp collector/.env.example collector/.env

# 제어 API 실행 (기본 포트 3001)
npm --prefix collector start

# API 없이 수집만 1회 실행
npm --prefix collector run collect

# 테스트
npm --prefix collector test
```

제어 API가 실행 중이면 다음 요청으로 작업을 시작한다.

```bash
curl -X POST http://localhost:3001/collect
curl -X POST http://localhost:3001/tag
```

`NODE_ENV=dev`이거나 `BE_API_URL`이 비어 있으면 수집 결과를 서버로 보내지 않고
콘솔에 출력한다. `/collect`와 `/tag` 자체의 인증은 아직 없으므로 외부에 그대로
노출하지 않는다.

## 소스 추가

RSS 소스는 `src/config/sources.js`에 고유 `id`, 표시 이름, URL,
`adapterType: 'rss'`, 활성 상태를 추가한다. 새 API 형식은 `src/adapters/`에
어댑터를 구현하고 `src/collector.js`의 `ADAPTERS`에 연결한 뒤 소스를 등록한다.

수집 소스 코드는 서버 DB의 출처 코드와 일치해야 한다. URL 중복은 Collector의
수집 상태와 서버의 `articles.url` 고유 제약으로 이중 방지한다.
