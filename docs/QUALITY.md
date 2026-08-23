# Quality baseline

마지막 점검: 2026-08-23

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

## 확인된 기준선

- `scripts/check` 전체 검증은 2026-08-23에 로컬 통과했다.
- 서버 JUnit 테스트는 PostgreSQL 16 컨테이너를 사용해 통과했다.
- 프런트엔드 ESLint, TypeScript 검사와 프로덕션 빌드가 통과했다.
- Collector의 JavaScript 구문 검사와 15개 동작 테스트가 통과했다.
- Collector는 폐쇄형 strict schema, canonical 정규화와 키워드 대체 처리 메타데이터를 테스트한다.
- Collector는 태깅 전용 입력의 HTML·Markdown·URL·공백 정제, 길이 제한,
  원본 불변성과 키워드 오탐 방지를 테스트한다.
- 서버는 출처 계약과 태깅 작업의 선점·완료·실패·canonical 태그 거부를 통합 테스트한다.
- 엔드투엔드 수집 및 태깅 테스트가 없다.

## 수동 검증

- 2026-08-23에 실제 Groq와 로컬 서버를 연결하여 기존 빈 태그 기사 29개를 새
  전처리 입력으로 재태깅했다.
- 29개 모두 `COMPLETED / AI`로 저장됐고 오류나 키워드 폴백은 없었다.
- 기존 0개에서 13개 기사에 총 21개 태그가 생성됐으며 16개는 여전히 빈
  태그였다.
- `go`, `testing`, `claude`, `hadoop`, `kubernetes` 등은 복구됐지만 본문에
  명시된 `kafka`를 AI가 놓치는 사례가 남아 있어 고정밀 별칭 선태깅과 AI 결과
  병합이 필요하다.

## 품질 원칙

- 동작 변경은 가장 가까운 계층에서 자동 검증한다.
- 외부 API 테스트는 고정된 fixture 또는 명시적인 수동 테스트로 분리한다.
- 데이터베이스 및 HTTP 경계의 입력 형태를 검증한다.
- 실패를 삼키지 말고 운영자가 원인을 찾을 수 있는 로그를 남긴다.
- 문서에 적은 명령은 CI에서도 실행 가능해야 한다.

우선순위와 구체적인 결함은 `docs/plans/tech-debt.md`를 참조한다.
