const test = require('node:test')
const assert = require('node:assert/strict')
const {
  MODEL_ID,
  DETAILED_SUMMARY_MIN_LENGTH,
  DETAILED_DESCRIPTION_MIN_LENGTH,
  RESPONSE_FORMAT,
  countSentences,
  truncateSummaryAtSentenceBoundary,
  normalizeSummary,
  summarizeBatch,
} = require('../src/services/summarizer')

test('Groq 요약기는 GPT-OSS 20B와 strict schema를 사용한다', () => {
  assert.equal(MODEL_ID, 'openai/gpt-oss-20b')
  assert.equal(RESPONSE_FORMAT.type, 'json_schema')
  assert.equal(RESPONSE_FORMAT.json_schema.strict, true)
})

test('제목과 설명을 정제해 근거 제한 프롬프트로 전송한다', async () => {
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
                  results: [{
                    index: 0,
                    summary: '카프카 운영 환경에서 여러 서비스의 상태를 파악하기 어려운 배경을 설명한다. 메트릭과 로그를 연결해 관측성을 확보하는 접근 방법을 구체적으로 다룬다. 운영 과정에서 입력에 명시된 결과와 주의 사항을 함께 정리한다.',
                  }],
                }),
              },
            }],
          }
        },
      },
    },
  }

  const [article] = await summarizeBatch([{
    id: 1,
    title: '<strong>Kafka 운영</strong>',
    description: `![banner](https://example.com/image.png) ${'관측성 '.repeat(500)}`,
  }], { apiKey: 'test', groqClient })

  const userPrompt = request.messages.find(message => message.role === 'user').content
  const input = JSON.parse(userPrompt.split('Articles:\n')[1])[0]
  assert.equal(input.title, 'Kafka 운영')
  assert.ok(!input.description.includes('example.com'))
  assert.ok(input.description.length <= 2000)
  assert.equal(input.summaryMode, 'detailed')
  assert.equal(DETAILED_DESCRIPTION_MIN_LENGTH, 120)
  assert.equal(DETAILED_SUMMARY_MIN_LENGTH, 80)
  assert.match(request.messages[0].content, /only facts explicitly present/)
  assert.match(request.messages[0].content, /two to four natural Korean sentences/)
  assert.match(request.messages[0].content, /do not merely paraphrase the title/)
  assert.match(request.messages[0].content, /Every sentence must be traceable/)
  assert.match(request.messages[0].content, /Never claim improved efficiency/)
  assert.equal(
    article.summary,
    '카프카 운영 환경에서 여러 서비스의 상태를 파악하기 어려운 배경을 설명한다. 메트릭과 로그를 연결해 관측성을 확보하는 접근 방법을 구체적으로 다룬다. 운영 과정에서 입력에 명시된 결과와 주의 사항을 함께 정리한다.',
  )
  assert.equal(article.summaryModel, MODEL_ID)
})

test('API 키가 없으면 요약을 생성하지 않고 명확히 실패한다', async () => {
  await assert.rejects(
    summarizeBatch([{ id: 1, title: 'Article' }], { apiKey: '' }),
    /GROQ_API_KEY 미설정/,
  )
})

test('빈 요약과 500자를 초과한 요약을 거부한다', () => {
  assert.throws(() => normalizeSummary('   '), /비어 있음/)
  assert.throws(() => normalizeSummary('가'.repeat(501)), /500자를 초과/)
})

test('500자를 넘는 상세 요약은 마지막 완결 문장까지 안전하게 줄인다', () => {
  const first = `${'가'.repeat(180)}.`
  const second = `${'나'.repeat(180)}.`
  const third = `${'다'.repeat(180)}.`
  const truncated = truncateSummaryAtSentenceBoundary(`${first} ${second} ${third}`)

  assert.equal(truncated, `${first} ${second}`)
  assert.ok(truncated.length <= 500)
  assert.equal(countSentences(truncated), 2)
})

test('상세 요약은 문장 수와 관계없이 80자 이상의 정보를 담아야 한다', () => {
  const valid = '운영 환경에서 반복되는 문제의 배경과 이를 해결하기 위해 적용한 기술 및 절차, 입력에 명시된 구체적인 결과와 운영 시 주의 사항을 독자가 파악할 수 있도록 함께 정리한다.'
  assert.equal(countSentences(valid), 1)
  assert.equal(normalizeSummary(valid, 'detailed'), valid)
  assert.throws(
    () => normalizeSummary('제목만 짧게 다시 설명한다.', 'detailed'),
    /품질 하한/,
  )
})

test('제한 입력은 정보가 없다는 표현을 요약으로 저장하지 않는다', () => {
  assert.throws(
    () => normalizeSummary('해당 기사에 대한 정보가 제공되지 않았다.', 'limited_source'),
    /입력 부족을 노출함/,
  )
})

test('요약은 ~다체만 허용한다', () => {
  assert.equal(normalizeSummary('기술 적용 과정을 설명한다.'), '기술 적용 과정을 설명한다.')
  assert.throws(
    () => normalizeSummary('기술 적용 과정을 설명합니다.'),
    /문체가 ~다체가 아님/,
  )
  assert.throws(
    () => normalizeSummary('기술 적용 과정을 설명해요.'),
    /문체가 ~다체가 아님/,
  )
})

test('설명이 짧으면 추측을 막는 제한 모드로 요청한다', async () => {
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
                  results: [{ index: 0, summary: '제목에서 확인되는 주제를 다룬다.' }],
                }),
              },
            }],
          }
        },
      },
    },
  }

  await summarizeBatch(
    [{ id: 1, title: '제목만 있는 기사', description: '' }],
    { apiKey: 'test', groqClient },
  )

  const userPrompt = request.messages.find(message => message.role === 'user').content
  const input = JSON.parse(userPrompt.split('Articles:\n')[1])[0]
  assert.equal(input.summaryMode, 'limited_source')
})

test('누락된 기사 index를 거부한다', async () => {
  const groqClient = {
    chat: {
      completions: {
        async create() {
          return {
            choices: [{
              message: { content: JSON.stringify({ results: [] }) },
            }],
          }
        },
      },
    },
  }

  await assert.rejects(
    summarizeBatch([{ id: 1, title: 'Article' }], { apiKey: 'test', groqClient }),
    /omitted article index 0/,
  )
})

test('누락된 기사 index는 한 번 개별 재요청한다', async () => {
  let calls = 0
  const groqClient = {
    chat: {
      completions: {
        async create() {
          calls++
          return {
            choices: [{
              message: {
                content: JSON.stringify({
                  results: calls === 1
                    ? []
                    : [{ index: 0, summary: '누락 후 다시 생성된 요약이다.' }],
                }),
              },
            }],
          }
        },
      },
    },
  }

  const [article] = await summarizeBatch(
    [{ id: 1, title: 'Article' }],
    { apiKey: 'test', groqClient },
  )

  assert.equal(calls, 2)
  assert.equal(article.summary, '누락 후 다시 생성된 요약이다.')
})

test('범위를 벗어난 기사 index를 거부한다', async () => {
  const groqClient = {
    chat: {
      completions: {
        async create() {
          return {
            choices: [{
              message: {
                content: JSON.stringify({
                  results: [{ index: 3, summary: '잘못 연결된 요약이다.' }],
                }),
              },
            }],
          }
        },
      },
    },
  }

  await assert.rejects(
    summarizeBatch([{ id: 1, title: 'Article' }], { apiKey: 'test', groqClient }),
    /article index가 잘못됨/,
  )
})
