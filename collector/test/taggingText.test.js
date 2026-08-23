const test = require('node:test')
const assert = require('node:assert/strict')
const {
  DESCRIPTION_MAX_LENGTH,
  cleanTaggingText,
  prepareTaggingInput,
} = require('../src/services/taggingText')

test('태깅 텍스트는 HTML, Markdown 이미지, URL과 반복 공백을 제거한다', () => {
  const raw = `
    [![banner](https://cdn.example.com/banner.png)](https://example.com)
    \\r\\n
    <p><strong>Kafka</strong>를 운영하는 방법</p>
    [공식 문서](https://kafka.apache.org/docs)를 참고합니다.
  `

  assert.equal(
    cleanTaggingText(raw),
    'Kafka를 운영하는 방법 공식 문서를 참고합니다.',
  )
})

test('태깅 입력은 공백 정리 후 길이를 제한하고 원본 기사를 변경하지 않는다', () => {
  const article = {
    title: '  FE News  ',
    description: `${' '.repeat(800)}State of CSS ${'내용 '.repeat(300)}`,
  }
  const original = { ...article }

  const input = prepareTaggingInput(article)

  assert.equal(input.title, 'FE News')
  assert.ok(input.description.startsWith('State of CSS'))
  assert.ok(input.description.length <= DESCRIPTION_MAX_LENGTH)
  assert.deepEqual(article, original)
})
