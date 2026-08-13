# ITrend agent guide

ITrend collects IT articles, enriches them with AI-generated tags and, later,
summaries, and presents them in a searchable web interface.

## Read first

- Product intent and scope: `docs/PRODUCT.md`
- Runtime components and data flow: `docs/ARCHITECTURE.md`
- Current verification status and known gaps: `docs/QUALITY.md`
- Planned work and technical debt: `docs/plans/README.md`

Treat repository code and these documents as the source of truth. When they
disagree, verify the behavior and update the stale document in the same change.

## Repository map

- `collector/`: Node.js source adapters, collection jobs, and AI tagging
- `server/`: Java 21 / Spring Boot API and PostgreSQL persistence
- `frontend/`: React / TypeScript / Vite web UI
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

## Commands

```bash
./scripts/setup   # install dependencies and start local PostgreSQL
./scripts/check   # run the same repository checks used by CI
```

Component development commands are documented in the root `README.md`.

## Git workflow

- Do not commit or push unless the user explicitly requests it.
- Keep `main` in a working, releasable state. Develop each coherent feature,
  fix, test improvement, documentation change, or maintenance task on one
  short-lived branch.
- Name task branches with `feat/`, `fix/`, `test/`, `docs/`, or `chore/`.
- Continue small follow-up changes for the same task on its existing branch;
  do not create a branch for every conversation turn.
- Before creating or switching branches, inspect `git status` and preserve
  unrelated user changes.
- Before committing, run `./scripts/check` and inspect `git status` and
  `git diff` for unintended changes, secrets, and generated files.
- Never commit secrets, local environment files, or generated runtime data.
- Do not force-push, rewrite history, or delete branches unless the user
  explicitly requests the exact operation.
- Do not merge into `main` or push directly to `main` unless the user
  explicitly requests it.

## Naming conventions

- Write commit messages as `<type>(<scope>): <Korean summary>` using
  Conventional Commits. Omit the scope when it adds no useful context.
- Use one of these commit types: `feat`, `fix`, `test`, `refactor`, `docs`,
  `chore`, `ci`, `build`, or `perf`.
- Prefer these scopes: `collector`, `server`, `frontend`, `db`, `docs`, or
  `ci`.
- Keep each commit focused on one logical change. Do not use vague summaries
  such as `update`, `수정`, or `작업 완료`, and do not end the subject with a
  period.
- Name branches as `<type>/<english-kebab-case-topic>`. Use lowercase English
  words and hyphens; do not use spaces or Korean characters.

## Definition of done

- The requested behavior is implemented without unrelated changes.
- `./scripts/check` passes, or the exact environmental blocker is reported.
- Public API or database changes are reflected in `docs/ARCHITECTURE.md`.
- Product scope changes are reflected in `docs/PRODUCT.md`.
- No secret or generated runtime artifact is added to Git.
