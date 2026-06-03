# ITrend Collector

IT 뉴스, 기술 블로그, 인사이트를 자동으로 수집하는 Node.js 수집기.
하루 2회(08:00, 18:00 KST) 실행되며, 수집된 데이터는 Spring Boot API로 전송된다.

---

## 프로젝트 구조

```
collector/
│
├── index.js                  진입점. node index.js로 실행
├── state.json                자동 생성. 소스별 마지막 수집 시점 저장
├── .env                      환경변수 (git 미포함, .env.example 참고)
│
└── src/
    ├── collector.js          핵심 로직. 소스 순회 → 수집 → 태깅 → 전송
    ├── scheduler.js          cron 등록. 정해진 시간에 collector 실행
    │
    ├── adapters/             소스별 데이터 수집 담당
    │   ├── base.js           추상 클래스 (fetch, normalize 인터페이스 정의)
    │   ├── rss.js            RSS 피드 파싱 (요즘IT, 카카오, 토스 등 공통)
    │   ├── hackernews.js     HN API (ID 기반 중복 방지)
    │   ├── devto.js          Dev.to API
    │   └── crawlers/         향후 크롤링 필요한 사이트용
    │
    ├── config/               설정 파일
    │   ├── sources.js        수집 소스 목록 (URL, 어댑터 종류, 활성화 여부)
    │   └── categories.js     카테고리별 키워드 매핑 (자동 태깅 기준)
    │
    └── services/
        ├── state.js          state.json 읽기/쓰기 (중복 수집 방지)
        ├── tagger.js         제목/설명 분석 → 태그 + 카테고리 자동 부여
        └── sender.js         Spring Boot API로 전송
```

---

## 데이터 흐름

```
index.js
  └→ collector.js
       └→ 소스마다:
            1. state.json에서 마지막 수집 시점 읽기
            2. Adapter 생성 (rss / hn_api / devto_api)
            3. adapter.fetch() → 새 아티클만 가져옴
            4. tagger.js → 태그 + 카테고리 자동 부여
            5. sender.js → Spring Boot로 전송
            6. state.json 업데이트
```

---

## 실행

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일에서 BE_API_URL, COLLECTOR_API_KEY 입력

# 개발 모드 실행 (Spring Boot 없이 콘솔 출력만)
NODE_ENV=dev node index.js

# 프로덕션 실행 (Spring Boot로 실제 전송)
node index.js

# 스케줄러 없이 즉시 1회만 수집
node -e "require('./src/collector').collect()"
```

---

## 수집 소스 현황

| 소스 | 종류 | 상태 |
|------|------|------|
| 요즘IT | RSS | 활성 |
| 카카오 기술 블로그 | RSS | 활성 |
| 토스 기술 블로그 | RSS | 활성 |
| LINE Engineering | RSS | 활성 |
| NAVER D2 | RSS | 활성 |
| AWS Blog | RSS | 활성 |
| Spring Blog | RSS | 활성 |
| The New Stack | RSS | 활성 |
| InfoQ | RSS | 활성 |
| Hacker News | API | 활성 |
| Dev.to | API | 활성 |
| 우아한형제들 기술 블로그 | RSS | 비활성 (Cloudflare 차단) |

---

## 소스 추가하는 법

### RSS 소스 추가 (코드 변경 없음)

`src/config/sources.js`에 항목만 추가하면 된다.

```js
{
  id: 'new-source',           // 고유 ID (state.json 키로 사용됨)
  name: '새 소스 이름',
  url: 'https://example.com/feed/',
  adapterType: 'rss',
  isActive: true,
  config: {},
}
```

### 새 API / 크롤러 소스 추가

1. `src/adapters/`에 어댑터 파일 생성 (`base.js` 상속, `fetch()`와 `normalize()` 구현)
2. `src/collector.js`의 `ADAPTERS` 맵에 한 줄 추가
3. `src/config/sources.js`에 소스 등록

### 카테고리 / 키워드 추가

`src/config/categories.js`에서 카테고리 항목을 추가하거나 `keywords` 배열에 키워드를 추가한다.

```js
{
  name: 'Security',
  slug: 'security',
  keywords: ['security', 'vulnerability', 'cve', 'oauth', 'zero trust'],
}
```

---

## 중복 수집 방지 전략

- **1차 (Node.js)**: `state.json`에 소스별 마지막 수집 시점 저장 → 그 이후 발행된 것만 fetch
- **2차 (Spring Boot)**: `articles.url` unique 제약으로 중복 insert 차단
