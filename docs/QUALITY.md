# Quality baseline

## 자동 검증

저장소의 표준 검증 진입점은 루트의 `scripts/check`다.

| 영역 | 현재 검증 |
|---|---|
| Collector | 구문 검사와 Node 내장 테스트 |
| Server | Gradle/JUnit 단위·HTTP 통합 테스트, PostgreSQL 스키마 검증 포함 |
| Frontend | ESLint, TypeScript 검사, Vite 프로덕션 빌드 |
| Repository | 필수 하네스 문서와 예제 환경 파일 존재 여부 |

GitHub Actions는 pull request와 `main` 브랜치 push에서 같은 명령을 실행한다.
외부 뉴스 소스와 LLM API는 안정성과 비용 문제 때문에 기본 검증에서 호출하지
않는다.

## 검증 범위

- 셸 스크립트 구문과 canonical 태그 파일의 형태·중복을 검사한다.
- 서버 JUnit 테스트는 PostgreSQL 16 컨테이너를 사용한다.
- 프런트엔드는 ESLint, TypeScript 검사와 프로덕션 빌드를 실행한다.
- Collector는 JavaScript 구문 검사와 Node 내장 테스트를 실행한다.
- Collector는 폐쇄형 strict schema, canonical 정규화, 고정밀 별칭 선태깅과
  AI 결과 병합, 키워드 대체 처리 메타데이터를 테스트한다.
- Collector는 태깅 전용 입력의 HTML·Markdown·URL·공백 정제, 길이 제한,
  원본 불변성과 키워드 오탐 방지를 테스트한다.
- Collector는 요약 입력 정제, 근거 제한 프롬프트, strict schema, 출력 길이와
  상세 요약의 최소 정보량, `~다`체 검증, 누락 응답의 개별 재요청을 테스트한다.
- 서버는 출처 계약과 태깅 작업의 선점·완료·실패·canonical 태그 거부를 통합 테스트한다.
- 서버는 요약 작업의 선점·완료·실패, 길이 제한과 공개 조회 응답을 통합 테스트한다.
- 엔드투엔드 수집, 태깅 및 요약 테스트가 없다.

## 최근 수동 검증에서 확인한 한계

- 실제 Groq와 로컬 서버로 전체 기사 50개를 재태깅했을 때 모두 `COMPLETED`로
  저장됐고 오류나 키워드 폴백은 없었다. 22개는 `AI`, 28개는 `HYBRID` 방식이었다.
- 총 72개 태그가 생성됐으며 빈 태그 기사는 기존 16개에서 5개로 줄었다.
- `kafka`, `grafana`, `ai-agent`, `cli`와 새 taxonomy인 `monorepo`,
  `optimistic-locking`, `load-balancing`, `btrfs`가 실제 누락 기사에 저장됐다.
- 태깅을 완료한 기사 중 설명이 없거나 짧은 기사와 의미 기반 분류가 필요한 기사
  5개는 여전히 빈 태그다. 새로 수집한 446건은 태깅 대기 상태다.
  소스 메타데이터 보강과 고정 평가 fixture가 추가로 필요하다.
- 실제 Groq strict schema와 요약 작업 API로 설명이 충분한 기사 1건을 생성·저장하고
  공개 기사 응답에 포함되는 것까지 확인했다. 입력 대비 사실도 일치했다.
- 정보량 기반 2~4문장 정책으로 Airflow와 vLLM 기사를 추가 생성했을 때
  배경·접근·결과 구조와 구체적인 모델 수, 토큰 절감 수치가 반영됐다. 설명이 없는
  기사는 추측 없이 제목의 주제만 1문장으로 정리됐다. 이 표본 결과는 DB에는 저장하지
  않았다.
- 기존 기사 50건의 요약 저장을 완료했다. 존댓말 종결이 있던 19건은 내용과 수치를
  유지한 채 `~다`체로 변환했으며 `니다.` 종결이 남은 요약은 없다. 새 출처 수집 후
  현재 로컬 DB의 전체 496건 중 이 50건은 요약 완료, 446건은 요약 대기 상태다.
- 올리브영, 당근, Cloudflare, GitHub Engineering 피드를 실제 RSS 어댑터로 검증하고
  242건을 저장했다. 모두 설명이 있으며 Medium의 `content:encodedSnippet`도 정상적으로
  요약 입력에 반영된다.

## 품질 원칙

- 동작 변경은 가장 가까운 계층에서 자동 검증한다.
- 외부 API 테스트는 고정된 fixture 또는 명시적인 수동 테스트로 분리한다.
- 데이터베이스 및 HTTP 경계의 입력 형태를 검증한다.
- 실패를 삼키지 말고 운영자가 원인을 찾을 수 있는 로그를 남긴다.
- 문서에 적은 명령은 CI에서도 실행 가능해야 한다.

우선순위와 구체적인 결함은 `docs/plans/tech-debt.md`를 참조한다.
