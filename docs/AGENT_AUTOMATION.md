# Local Issue agent monitor

GitHub Issue의 구현 작업을 로컬에 로그인된 Codex 또는 Claude Code에
명시적으로 위임한다. GitHub Actions와 `OPENAI_API_KEY`,
`ANTHROPIC_API_KEY`는 사용하지 않는다.

모니터는 `main`을 수정하지 않고 Issue마다 격리된 Git worktree와
브랜치를 만든다. 검증을 통과한 변경만 commit·push하고 Draft PR로
제출하며 자동 병합하지 않는다.

## 사전 준비

- `gh auth login`으로 GitHub CLI에 로그인한다.
- Codex를 쓸 때는 `codex` CLI, Claude Code를 쓸 때는 `claude` CLI에
  각각 로컬 로그인한다.
- Docker가 실행 중이고 `./scripts/check`에 필요한 로컬 도구가 설치돼
  있어야 한다.

```bash
gh auth status
codex --version
claude --version
```

## 실행

대기 중인 Issue 한 건만 확인하려면:

```bash
./scripts/issue-agent-monitor --once
```

로컬 터미널에서 계속 모니터링하려면 다음을 실행한다. 기본 간격은
60초이며 초 단위로 바꿀 수 있다.

```bash
./scripts/issue-agent-monitor --watch
./scripts/issue-agent-monitor --watch 120
```

로그인 후 백그라운드에서 감시하려면 macOS 사용자 `launchd`
서비스를 설치한다. 인자로 감시 간격을 초 단위로 지정할 수 있다.
설치 직후에는 안전하게 OFF 상태다.

```bash
./scripts/issue-agent-launchd install
./scripts/issue-agent-launchd install 120
./scripts/issue-agent-launchd start
./scripts/issue-agent-launchd stop
./scripts/issue-agent-launchd status
```

`start`는 모니터를 ON으로 바꾸고 재로그인 후에도 자동 실행하게 한다.
`stop`은 서비스 설정과 로그를 보존하면서 재로그인 후에도 OFF 상태를
유지한다.

제거할 때는 다음을 실행한다. 이 명령은 서비스와 plist만 제거하고
작업 worktree와 로그는 보존한다.

```bash
./scripts/issue-agent-launchd uninstall
```

컴퓨터가 꺼져 있거나 macOS 사용자가 로그인하지 않아 로컬 인증
세션을 쓸 수 없으면 작업은 시작되지 않는다.

## Issue 사용법

1. 작업 범위와 완료 조건이 분명한 Issue를 작성한다. Issue
   제목은 자동 커밋 요약으로 사용하므로 한국어를 포함해야 한다.
2. `agent:codex` 또는 `agent:claude` 중 하나만 붙인다.
3. 커밋 유형 라벨 `type:feat`, `type:fix`, `type:test`, `type:docs`,
   `type:chore` 중 하나만 붙인다.
4. 마지막으로 `agent:ready`를 붙여 로컬 실행을 승인한다.
5. `agent:running`이 붙으면 Issue 댓글과 로컬 로그를 확인한다.
6. 완료 후 `agent:review`가 붙은 Draft PR의 diff와 CI를 검토한다.

`agent:ready`만 새 실행을 시작하는 신호다. 모니터가 Issue를 가져가면
`agent:ready`를 제거하고 `agent:running`을 붙인다. 실행기 라벨이 없거나
두 개 모두 있으면 `agent:failed`로 표시한다.
커밋 유형 라벨이 없거나 두 개 이상이어도 같은 방식으로 중단한다.

## 라벨

| 라벨 | 의미 |
|---|---|
| `agent:ready` | 사람이 요구사항을 검토하고 새 실행을 승인함 |
| `agent:codex` | 로컬 Codex CLI를 실행기로 선택함 |
| `agent:claude` | 로컬 Claude Code CLI를 실행기로 선택함 |
| `agent:running` | 에이전트 또는 검증이 로컬에서 실행 중임 |
| `agent:review` | Draft PR이 생성돼 사람의 검토를 기다림 |
| `agent:failed` | 라우팅, 에이전트, 검증 또는 전달 단계가 실패함 |
| `type:feat` | 사용자 기능 추가 또는 변경 |
| `type:fix` | 결함 수정 |
| `type:test` | 테스트 전용 변경 |
| `type:docs` | 문서 전용 변경 |
| `type:chore` | 도구, 하네스, 유지보수 변경 |

## 산출물과 실패 복구

- worktree: `${TMPDIR:-/tmp}/itrend-issue-agents/<repo>/`
- 로그: `.git/issue-agent-logs/issue-<number>-<runner>-<timestamp>.log`
- 서비스 로그: `~/Library/Logs/ITrend/issue-agent-monitor*.log`
- 브랜치: `<type>/issue-<number>-<timestamp>`
- 커밋: `<type>: #<number> <한국어 Issue 제목>`

실행기 종류는 Issue 댓글과 Draft PR에 기록한다. 브랜치명이나 Conventional
Commit scope에는 넣지 않는다.

성공하면 worktree를 제거하고 브랜치와 Draft PR을 남긴다. 실패하면
조사할 수 있게 worktree와 로그를 남긴다. 원인을 해결한 뒤
`agent:failed`를 제거하고 `agent:ready`를 다시 붙이면 재시도한다.
`ITREND_AGENT_WORKTREE_ROOT`와 `ITREND_AGENT_LOG_ROOT`로 기본 경로를 바꿀 수
있다.

## 안전 경계

- Issue 제목과 본문은 신뢰하지 않는 입력으로 취급한다. 에이전트 명령의
  실제 권한은 각 CLI의 샌드박스와 권한 설정에 따른다.
- 에이전트에게 commit, push, PR 생성, merge를 위임하지 않는다. 이 작업은
  모니터의 고정된 명령이 검증 성공 후에만 수행한다.
- `.env`와 `.env.*`는 `.env.example`을 제외하고 commit하지 않는다.
- `collector/state.json`과 비밀이 포함될 수 있는 파일이 발견되면 중단한다.
- `./scripts/check`가 통과해야 commit·push·Draft PR 생성을 수행한다.
- merge는 항상 사람이 검토한 뒤 직접 수행한다.
