const test = require('node:test')
const assert = require('node:assert/strict')
const { createSender } = require('../src/services/sender')

test('서버 전송은 sourceCode를 보존하고 내부 필드를 제거한다', async () => {
  let request
  const httpClient = {
    async post(...args) {
      request = args
      return { data: { saved: 1 } }
    },
  }
  const send = createSender({
    httpClient,
    apiUrl: 'http://server',
    apiKey: 'secret',
  })

  await send([{ title: 'Article', sourceCode: 'kakao-tech', _hnId: 42 }])

  assert.equal(request[0], 'http://server/api/articles/batch')
  assert.deepEqual(request[1], [{ title: 'Article', sourceCode: 'kakao-tech' }])
  assert.equal(request[2].headers['X-API-Key'], 'secret')
})

test('개발 출력은 tags가 없는 기사도 처리한다', async () => {
  const send = createSender({ isDev: true })
  await assert.doesNotReject(() => send([{ title: 'Article', url: 'https://example.com' }]))
})
