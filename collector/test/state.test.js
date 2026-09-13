const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')

test('수집 상태 파일 경로를 환경변수로 지정할 수 있다', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'itrend-state-'))
  const stateFile = path.join(tempDirectory, 'state.json')
  const modulePath = require.resolve('../src/services/state')
  const previousStateFile = process.env.COLLECTOR_STATE_FILE

  try {
    process.env.COLLECTOR_STATE_FILE = stateFile
    delete require.cache[modulePath]
    const state = require(modulePath)

    state.update('yozm', { lastFetched: '2026-09-13T00:00:00.000Z' })

    assert.deepEqual(state.get('yozm'), {
      lastFetched: '2026-09-13T00:00:00.000Z',
    })
  } finally {
    delete require.cache[modulePath]
    if (previousStateFile === undefined) {
      delete process.env.COLLECTOR_STATE_FILE
    } else {
      process.env.COLLECTOR_STATE_FILE = previousStateFile
    }
    fs.rmSync(tempDirectory, { recursive: true, force: true })
  }
})
