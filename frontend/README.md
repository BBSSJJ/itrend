# ITrend Frontend

수집된 IT 기사를 탐색하는 React, TypeScript, Vite 애플리케이션이다. 기사 목록과
출처를 표시하고, 인기 태그 필터와 페이지네이션을 제공한다.

## 실행

루트에서 `./scripts/setup`을 실행한 뒤 개발 서버를 시작한다.

```bash
npm --prefix frontend run dev
```

기본 주소는 `http://localhost:5173`이다. 개발 서버는 `/api` 요청을
`http://localhost:8080`의 Spring Boot 서버로 프록시하므로 API 서버도 실행되어
있어야 한다.

## 검증

```bash
npm --prefix frontend run lint
npm --prefix frontend run build
```

저장소 전체 검증에는 루트의 `./scripts/check`를 사용한다.

## 주요 구조

```text
src/
├── api/articles.ts          기사와 인기 태그 API 호출
├── components/              기사 카드와 태그 필터
├── types/article.ts         API 응답 타입
└── App.tsx                  로딩·오류·목록·페이지 상태 관리
```

프로덕션 API 라우팅과 배포 방식은 아직 정하지 않았다. 현재 경계와 후속 작업은
[`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md)와
[`docs/plans/tech-debt.md`](../docs/plans/tech-debt.md)를 참고한다.
