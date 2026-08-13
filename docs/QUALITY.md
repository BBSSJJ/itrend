# Quality baseline

마지막 점검: 2026-08-13

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

- `scripts/check` 전체 검증은 2026-08-13에 로컬 통과했다.
- 서버 JUnit 테스트는 PostgreSQL 16 컨테이너를 사용해 통과했다.
- 프런트엔드 ESLint, TypeScript 검사와 프로덕션 빌드가 통과했다.
- Collector의 JavaScript 구문 검사와 7개 동작 테스트가 통과했다.
- 서버는 출처 저장·조회와 미등록 출처 거부를 통합 테스트한다.
- 엔드투엔드 수집 및 태깅 테스트가 없다.

## 품질 원칙

- 동작 변경은 가장 가까운 계층에서 자동 검증한다.
- 외부 API 테스트는 고정된 fixture 또는 명시적인 수동 테스트로 분리한다.
- 데이터베이스 및 HTTP 경계의 입력 형태를 검증한다.
- 실패를 삼키지 말고 운영자가 원인을 찾을 수 있는 로그를 남긴다.
- 문서에 적은 명령은 CI에서도 실행 가능해야 한다.

우선순위와 구체적인 결함은 `docs/plans/tech-debt.md`를 참조한다.
