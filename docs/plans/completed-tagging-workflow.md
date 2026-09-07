# 태깅 워크플로 고도화 (완료)

## 사용자 문제와 범위

기사 태깅은 수집과 분리되어 있지만 현재는 `tagged_at`의 null 여부만으로 작업
상태를 표현한다. 이 때문에 처리 중 작업의 중복 실행, 실패와 키워드 대체 처리의
구분, 중단된 작업의 회수가 어렵다. 또한 현재 Groq 모델은 종료되었고 JSON 형식만
요청할 뿐 폐쇄형 태그 계약을 응답 스키마로 강제하지 않는다.

이번 변경은 다음 범위로 제한한다.

- 태깅 상태를 `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`로 관리한다.
- Server가 태깅 작업을 원자적으로 선점하고 중단된 작업을 다시 회수한다.
- 태깅 시도 횟수, 시작 시각, 완료 시각, 방법과 오류를 기록한다.
- Groq `openai/gpt-oss-20b`와 strict JSON Schema를 사용한다.
- AI 응답은 canonical 태그 목록으로 제한하고 기사당 최대 5개를 검증한다.
- AI 미설정 및 호출 실패 시 키워드 대체 처리 여부를 기록한다.
- RSS 설명은 원본을 유지하면서 태깅 직전에 코드로 정제하고 길이를 제한한다.
- 기술명뿐 아니라 방법론·아키텍처·운영 주제를 선택하도록 AI 계약을 보완한다.

관리자 UI, 메시지 큐, 후보 태그, 자동 스케줄 연결은 이번 범위에 포함하지 않는다.

## 현재 동작 근거

- `collector/src/tagger-job.js`가 `tagged_at IS NULL`인 기사를 조회한 뒤 결과를
  일괄 PATCH한다.
- `Article.updateTags`가 태그 저장과 동시에 `tagged_at`을 기록한다.
- `collector/src/services/tagger.js`는 `json_object` 응답을 파싱하고 canonical
  목록 밖의 태그를 제거한다.
- AI 호출 실패는 키워드 방식으로 대체되지만 그 사실은 저장되지 않는다.

## 구현 및 검증

1. DB와 Article 모델에 태깅 상태·시도·방법·오류 필드를 추가한다.
2. `FOR UPDATE SKIP LOCKED` 기반 작업 선점 API와 실패 보고 API를 추가한다.
3. 완료 API가 태그와 처리 메타데이터를 함께 저장하도록 계약을 변경한다.
4. Collector를 새 API와 Groq strict JSON Schema에 연결한다.
5. Server HTTP 통합 테스트와 Collector 단위 테스트로 상태 전이와 폐쇄형 계약을
   검증한다.
6. 아키텍처와 품질 기준 문서를 실제 동작에 맞게 갱신하고 `scripts/check`를
   실행한다.
7. HTML, Markdown 이미지, URL과 반복 공백을 제거하는 공용 태깅 입력 정제기를
   Groq와 키워드 태거에 적용한다.

## 완료 조건

- 동시에 실행된 Worker가 같은 대기 기사를 선점하지 않는다.
- 성공, 키워드 대체 처리, 실패를 DB에서 구분할 수 있다.
- 모델 응답 스키마가 canonical 태그를 강제하고 Collector와 Server가 0~5개 제한을 검증한다.
- AI 또는 태깅 작업 실패가 기사 저장과 조회를 막지 않는다.
- `./scripts/check`가 통과한다.

## 결과

- 태깅 작업 선점과 상태 전이 API를 구현했다.
- canonical 태그 단일 원본과 Server 검증을 도입했다.
- Groq GPT-OSS 20B strict schema와 처리 방법 기록을 적용했다.
- 원본 설명을 변경하지 않는 태깅 전용 입력 정제와 설정 가능한 Groq 청크 크기·
  간격을 적용했다.
- 고정밀 한국어·영문 별칭 선태깅과 AI 결과 병합을 적용하고 `HYBRID` 처리 방법을
  추가했다. 실제 누락에서 확인한 모노리포, 낙관적 잠금, 부하 분산과 Btrfs도
  canonical taxonomy에 추가했다.
- Collector 20개 테스트, Server 6개 테스트와 저장소 전체 검사가 통과했다.
- 실제 Groq로 전체 기사 50개를 재처리해 총 72개 태그가 생성됐고 빈 태그는
  16개에서 5개로 줄었다. 오류나 키워드 폴백은 없었다.

의미가 겹치는 canonical 태그 정리, 별칭 목록 보강과 짧은 RSS 설명 보강은
`tech-debt.md`의 후속 작업으로 남겼다.
