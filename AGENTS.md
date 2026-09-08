# ITrend agent guide

ITrend collects IT articles, enriches them with AI-generated tags and summaries,
and presents them in a searchable web interface.

## Read first

- Product intent and scope: `docs/PRODUCT.md`
- Runtime components and data flow: `docs/ARCHITECTURE.md`
- Current verification status and known gaps: `docs/QUALITY.md`
- Git branches, commits, and pull requests: `docs/WORKFLOW.md`
- Planned work and technical debt: `docs/plans/README.md`

Treat repository code and these documents as the source of truth. When they
disagree, verify the behavior and update the stale document in the same change.

## Repository map

- `collector/`: Node.js source adapters, collection jobs, and AI tagging
- `server/`: Java 21 / Spring Boot API and PostgreSQL persistence
- `frontend/`: React / TypeScript / Vite web UI
- `config/`: Collector와 Server가 공유하는 버전 관리 설정
- `docker-compose.yml`: local PostgreSQL
- `scripts/`: repository-wide setup and verification commands

## Working rules

1. Inspect the relevant code and docs before editing.
2. Keep changes scoped; do not fix unrelated debt silently.
3. Preserve the collector-to-server API contract when changing either side.
4. Never commit secrets, local `.env` files, or collector runtime state.
5. Prefer executable checks over prose-only rules.
6. Add or update tests for behavior changes when a test layer exists.
7. Record meaningful follow-up work in `docs/plans/tech-debt.md`.
8. Treat documentation as current truth, not an append-only changelog: replace
   stale status, remove resolved debt, and use Git or pull requests for history.

## Requirement discovery

- For a proposed feature or behavior change, identify the problem, intended
  outcome, and acceptance criteria before editing.
- If an unresolved choice would materially change the user experience, public
  API, data model, security, cost, or task scope, ask a focused clarification
  question before editing.
- Ask only questions whose answers would change the implementation. Do not
  block progress on minor, reversible details.
- For low-risk gaps, state the assumption and proceed with the most reversible
  option that remains within the requested scope.
- Once the request is sufficiently clear, briefly restate the objective and
  completion criteria, then begin implementation.
- Treat requests to explore, explain, or compare as read-only unless the user
  also asks to implement a change.

## Issue-driven work

- When the user asks to inspect, review, analyze, prioritize, or plan GitHub
  Issues, use `.agents/skills/issue-triage/SKILL.md`.
- Treat Issue review as read-only and report in the current conversation. Do
  not change the repository or GitHub state unless the user explicitly asks.
- Do not begin implementation until the user identifies an Issue and approves
  its direction after reviewing the analysis and any material open questions.
- A request to implement an approved Issue and create a Draft PR authorizes the
  task branch, scoped edits, verification, commit, push, and Draft PR for that
  Issue. It never authorizes merging the pull request.

## Context7 MCP

- When a task depends on current documentation for a library, framework, SDK,
  API, CLI tool, or cloud service, use Context7 MCP before implementing or
  advising, even if the technology is familiar.
- Do not use Context7 for repository-local business logic, general programming
  concepts, simple refactoring, or tasks that do not need external documentation.
- The user does not need to name Context7 explicitly; select it automatically
  when these conditions apply.

## Commands

```bash
./scripts/setup   # install dependencies and start local PostgreSQL
./scripts/check   # run the same repository checks used by CI
```

Component development commands are documented in the root `README.md`.

## Git workflow

- Before editing, ensure the current branch matches the task and keep one
  branch focused on one coherent outcome.
- Do not commit, push, merge, rewrite history, or delete branches unless the
  user explicitly requests the relevant operation.
- Follow `docs/WORKFLOW.md` for branch, commit, push, and pull request rules.

## Definition of done

- The requested behavior is implemented without unrelated changes.
- `./scripts/check` passes, or the exact environmental blocker is reported.
- Public API or database changes are reflected in `docs/ARCHITECTURE.md`.
- Product scope changes are reflected in `docs/PRODUCT.md`.
- No secret or generated runtime artifact is added to Git.
