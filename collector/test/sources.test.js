const test = require('node:test')
const assert = require('node:assert/strict')
const sources = require('../src/config/sources')

const FOREIGN_SOURCE_IDS = [
  'aws-blog',
  'spring-blog',
  'thenewstack',
  'infoq',
  'cloudflare-blog',
  'github-engineering',
  'hackernews',
  'devto',
]

test('초기 배포에서는 해외 출처를 수집 대상에서 제외한다', () => {
  for (const sourceId of FOREIGN_SOURCE_IDS) {
    const source = sources.find(item => item.id === sourceId)

    assert.ok(source, `출처 설정 누락: ${sourceId}`)
    assert.equal(source.isActive, false, `해외 출처 활성화됨: ${sourceId}`)
  }
})
