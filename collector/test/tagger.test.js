const test = require('node:test')
const assert = require('node:assert/strict')
const {
  MODEL_ID,
  RESPONSE_FORMAT,
  tagBatch,
} = require('../src/services/tagger')

test('Groq 태거는 GPT-OSS 20B와 canonical enum strict schema를 사용한다', () => {
  assert.equal(MODEL_ID, 'openai/gpt-oss-20b')
  assert.equal(RESPONSE_FORMAT.type, 'json_schema')
  assert.equal(RESPONSE_FORMAT.json_schema.strict, true)

  const tagsSchema = RESPONSE_FORMAT.json_schema.schema
    .properties.results.items.properties.tags
  assert.ok(tagsSchema.items.enum.includes('react'))
})

test('API 키가 없으면 키워드 태깅 방법을 기록한다', async () => {
  const [article] = await tagBatch(
    [{ id: 1, title: 'React and TypeScript' }],
    { apiKey: '' },
  )

  assert.equal(article.taggingMethod, 'KEYWORD')
  assert.equal(article.taggingError, null)
  assert.deepEqual(article.tags, ['react', 'typescript'])
})

test('AI 결과는 canonical 태그만 최대 5개까지 저장한다', async () => {
  const groqClient = {
    chat: {
      completions: {
        async create() {
          return {
            choices: [{
              message: {
                content: JSON.stringify({
                  results: [{
                    index: 0,
                    tags: ['reactjs', 'typescript', 'invented-tag', 'vite', 'css', 'html', 'javascript'],
                  }],
                }),
              },
            }],
          }
        },
      },
    },
  }

  const [article] = await tagBatch(
    [{ id: 1, title: 'Frontend' }],
    { apiKey: 'test', groqClient },
  )

  assert.equal(article.taggingMethod, 'AI')
  assert.deepEqual(article.tags, ['react', 'typescript', 'vite', 'css', 'html'])
})

test('AI 태거는 정제되고 길이가 제한된 기사 입력을 전송한다', async () => {
  let request
  const groqClient = {
    chat: {
      completions: {
        async create(value) {
          request = value
          return {
            choices: [{
              message: {
                content: JSON.stringify({
                  results: [{ index: 0, tags: ['kafka', 'observability'] }],
                }),
              },
            }],
          }
        },
      },
    },
  }

  await tagBatch([{
    id: 1,
    title: '<strong>Kafka 운영</strong>',
    description: `![banner](https://example.com/react.png) \\r\\n ${'관측 '.repeat(300)}`,
  }], { apiKey: 'test', groqClient })

  const userPrompt = request.messages.find(message => message.role === 'user').content
  const serializedArticles = userPrompt.match(/Articles:\n([\s\S]+?)\n\nRules:/)[1]
  const [input] = JSON.parse(serializedArticles)

  assert.equal(input.title, 'Kafka 운영')
  assert.ok(!input.description.includes('example.com'))
  assert.ok(input.description.length <= 600)
  assert.match(request.messages[0].content, /engineering methods, architecture, operations/)
  assert.ok(!userPrompt.includes('Respond with this exact JSON'))
  assert.ok(!userPrompt.includes('["spring-boot", "jpa", "postgresql"]'))
})

test('고정밀 선태그는 AI가 놓쳐도 결과에 병합한다', async () => {
  const groqClient = {
    chat: {
      completions: {
        async create() {
          return {
            choices: [{
              message: {
                content: JSON.stringify({
                  results: [{ index: 0, tags: [] }],
                }),
              },
            }],
          }
        },
      },
    },
  }

  const [article] = await tagBatch([{
    id: 1,
    title: 'AI 에이전트를 위한 Android CLI',
    description: 'Golang으로 쿠버네티스 운영 도구를 개발합니다.',
  }], { apiKey: 'test', groqClient })

  assert.equal(article.taggingMethod, 'HYBRID')
  assert.deepEqual(article.tags, ['ai-agent', 'android', 'cli', 'go', 'kubernetes'])
})

test('병합 결과는 선태그를 우선 보존하며 최대 5개로 제한한다', async () => {
  const groqClient = {
    chat: {
      completions: {
        async create() {
          return {
            choices: [{
              message: {
                content: JSON.stringify({
                  results: [{
                    index: 0,
                    tags: ['react', 'typescript', 'vite', 'css', 'html'],
                  }],
                }),
              },
            }],
          }
        },
      },
    },
  }

  const [article] = await tagBatch([{
    id: 1,
    title: 'Kafka on Kubernetes',
  }], { apiKey: 'test', groqClient })

  assert.deepEqual(article.tags, ['kafka', 'kubernetes', 'react', 'typescript', 'vite'])
})

test('AI 호출 실패는 키워드 대체 처리와 원인을 기록한다', async () => {
  const groqClient = {
    chat: {
      completions: {
        async create() {
          throw new Error('rate limited')
        },
      },
    },
  }

  const [article] = await tagBatch(
    [{ id: 1, title: 'PostgreSQL indexing' }],
    { apiKey: 'test', groqClient },
  )

  assert.equal(article.taggingMethod, 'KEYWORD_FALLBACK')
  assert.equal(article.taggingError, 'rate limited')
  assert.deepEqual(article.tags, ['postgresql'])
})
