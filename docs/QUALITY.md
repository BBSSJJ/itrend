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
- Collector는 폐쇄형 strict schema, canonical 정규화와 키워드 대체 처리 메타데이터를 테스트한다.
- Collector는 태깅 전용 입력의 HTML·Markdown·URL·공백 정제, 길이 제한,
  원본 불변성과 키워드 오탐 방지를 테스트한다.
- 서버는 출처 계약과 태깅 작업의 선점·완료·실패·canonical 태그 거부를 통합 테스트한다.
- 엔드투엔드 수집 및 태깅 테스트가 없다.

## 최근 수동 검증에서 확인한 한계

- 실제 Groq와 로컬 서버로 빈 태그 기사 29개를 재태깅했을 때 모두
  `COMPLETED / AI`로 저장됐고 오류나 키워드 폴백은 없었다.
- 13개 기사에 총 21개 태그가 생성됐으며 16개는 여전히 빈 태그였다.
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
