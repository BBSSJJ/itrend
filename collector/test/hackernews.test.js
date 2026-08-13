const test = require('node:test')
const assert = require('node:assert/strict')
const HackerNewsAdapter = require('../src/adapters/hackernews')

test('Hacker News는 마지막 ID 이후 링크 기사만 정규화한다', async () => {
  const httpClient = {
    async get(url) {
      if (url.endsWith('/topstories.json')) return { data: [13, 12, 10] }
      if (url.endsWith('/item/13.json')) {
        return { data: { id: 13, title: ' Story ', url: 'https://example.com/story', by: 'author', time: 1 } }
      }
      if (url.endsWith('/item/12.json')) return { data: { id: 12, title: 'Ask HN', time: 1 } }
      throw new Error(`unexpected URL: ${url}`)
    },
  }
  const adapter = new HackerNewsAdapter(
    { id: 'hackernews', config: { limit: 10 } },
    { lastItemId: 10 },
    httpClient,
  )

  const articles = await adapter.fetch()

  assert.equal(articles.length, 1)
  assert.equal(articles[0].title, 'Story')
  assert.equal(articles[0].sourceCode, 'hackernews')
  assert.equal(articles[0]._hnId, 13)
})

test('Hacker News 최대 ID 추출은 빈 내부 ID를 무시한다', () => {
  assert.equal(HackerNewsAdapter.extractMaxId([{ _hnId: 7 }, {}, { _hnId: 9 }]), 9)
})
