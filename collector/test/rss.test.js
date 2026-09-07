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

test('RSS 설명은 일반 필드를 우선하고 Medium의 encoded snippet도 지원한다', () => {
  const adapter = new RssAdapter({ id: 'test-rss' })

  assert.equal(adapter.normalize({
    contentSnippet: '일반 설명',
    summary: '요약 필드',
    'content:encodedSnippet': '인코딩 설명',
  }).description, '일반 설명')

  assert.equal(adapter.normalize({
    'content:encodedSnippet': 'Medium 본문 설명',
  }).description, 'Medium 본문 설명')
})
