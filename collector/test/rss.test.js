const test = require('node:test')
const assert = require('node:assert/strict')
const RssAdapter = require('../src/adapters/rss')

test('RSS는 마지막 수집 이후 항목과 발행일 없는 항목만 반환한다', async () => {
  const source = { id: 'test-rss', url: 'https://example.com/feed' }
  const feedParser = {
    async parseURL(url) {
      assert.equal(url, source.url)
      return {
        items: [
          { title: ' old ', link: 'https://example.com/old', pubDate: '2026-01-01T00:00:00Z' },
          { title: ' new ', link: 'https://example.com/new', pubDate: '2026-01-03T00:00:00Z' },
          { title: ' no date ', link: 'https://example.com/no-date' },
        ],
      }
    },
  }

  const adapter = new RssAdapter(
    source,
    { lastFetched: '2026-01-02T00:00:00Z' },
    feedParser,
  )
  const articles = await adapter.fetch()

  assert.deepEqual(articles.map(article => article.title), ['new', 'no date'])
  assert.ok(articles.every(article => article.sourceCode === 'test-rss'))
  assert.ok(articles.every(article => !('sourceId' in article)))
})
