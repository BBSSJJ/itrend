# Git workflow

This document defines how Codex organizes and records work in ITrend. The
short authorization boundaries remain in `AGENTS.md`; consult this document
when creating branches, commits, pushes, or pull requests.

## Branches and task scope

- Keep `main` in a working, releasable state.
- Before editing for a new request, inspect `git status` and confirm that the
  current branch matches the task. Preserve unrelated user changes.
- If the current branch is `main`, create a task branch before editing.
- Keep one branch focused on one coherent outcome and normally one pull
  request.
- Treat a follow-up as the same task only when it supports the same acceptance
  criteria. Continue those follow-ups on the existing task branch.
- Do not mix an unrelated request or newly discovered issue into the current
  branch. Record it as technical debt or handle it on a separate branch.
- If unrelated changes are already mixed, separate them before pushing or
  opening a pull request.

A task can span Collector, Server, and Frontend when every change is required
for the same user-visible outcome. Independently releasable or reversible work
belongs on another branch.

## Branch names

Use `<type>/<english-kebab-case-topic>` with lowercase English words and
hyphens. Do not use spaces or Korean characters.

Allowed branch types:

- `feat/`: user-facing features
- `fix/`: bug fixes
- `test/`: test-only improvements
- `docs/`: documentation-only changes
- `chore/`: maintenance, tooling, and harness changes

Examples:

```text
feat/article-summary
fix/rss-date-filter
test/collector-state
docs/deployment-guide
chore/agent-harness
```

## Commit preparation

Before committing:

1. Run `./scripts/check`.
2. Inspect `git status` and the complete `git diff`.
3. Confirm that the staged files form one logical change.
4. Confirm that no secrets, local environment files, generated runtime data,
   or unrelated user changes are staged.

Do not commit unless the user explicitly requests it.

## Commit messages

Use Conventional Commits with this form:

```text
<type>(<scope>): <Korean summary>
```

Omit the scope when it adds no useful context. Use one of these types:
`feat`, `fix`, `test`, `refactor`, `docs`, `chore`, `ci`, `build`, or `perf`.

Preferred scopes are `collector`, `server`, `frontend`, `db`, `docs`, and
`ci`. Keep each commit focused on one logical change. Do not end the subject
with a period or use vague summaries such as `update`, `수정`, or `작업 완료`.

Examples:

```text
feat(collector): RSS 출처 수집 기능 추가
fix(server): 기사 출처 저장 오류 수정
test(collector): 상태 갱신 회귀 테스트 추가
docs: 배포 절차 문서화
ci: 저장소 검증 워크플로 추가
```

## Pushes and pull requests

- Do not push unless the user explicitly requests it.
- Do not push directly to `main` or merge into `main` unless the user
  explicitly requests the exact operation.
- Do not force-push, rewrite history, or delete branches unless the user
  explicitly requests the exact operation.
- Before pushing, confirm that the working tree is clean and the branch tracks
  the intended remote.
- A pull request should describe one outcome and include its changes,
  verification evidence, and known follow-up work.
