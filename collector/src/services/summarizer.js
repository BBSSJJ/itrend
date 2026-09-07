/**
 * 수집된 제목과 설명만을 근거로 짧은 한국어 요약을 생성한다.
 */
const Groq = require('groq-sdk')
const { prepareSummaryInput } = require('./summaryText')

const MODEL_ID = 'openai/gpt-oss-20b'
const SUMMARY_MAX_LENGTH = 500
const DETAILED_SUMMARY_MIN_LENGTH = 80
const DETAILED_DESCRIPTION_MIN_LENGTH = 120

let client = null

function getClient() {
  if (!client) client = new Groq({ apiKey: process.env.GROQ_API_KEY })
  return client
}

function readIntegerSetting(name, fallback, minimum) {
  const parsed = Number.parseInt(process.env[name] ?? '', 10)
  return Number.isInteger(parsed) && parsed >= minimum ? parsed : fallback
}

const CHUNK_SIZE = readIntegerSetting('SUMMARY_CHUNK_SIZE', 5, 1)
const CHUNK_DELAY_MS = readIntegerSetting('SUMMARY_CHUNK_DELAY_MS', 20000, 0)

const RESPONSE_FORMAT = {
  type: 'json_schema',
  json_schema: {
    name: 'article_summary_results',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              index: { type: 'integer' },
              summary: { type: 'string' },
            },
            required: ['index', 'summary'],
            additionalProperties: false,
          },
        },
      },
      required: ['results'],
      additionalProperties: false,
    },
  },
}

function countSentences(value) {
  return value.split(/[.!?]+(?:\s+|$)/).filter(Boolean).length
}

function truncateSummaryAtSentenceBoundary(value) {
  if (value.length <= SUMMARY_MAX_LENGTH) return value

  const candidate = value.slice(0, SUMMARY_MAX_LENGTH + 1)
  const boundaries = [...candidate.matchAll(/[.!?](?=\s|$)/g)]
  const lastBoundary = boundaries.at(-1)?.index
  if (lastBoundary == null || lastBoundary + 1 < DETAILED_SUMMARY_MIN_LENGTH) {
    return value
  }
  return candidate.slice(0, lastBoundary + 1).trim()
}

function normalizeSummary(value, mode = 'limited_source') {
  if (typeof value !== 'string') throw new Error('summary가 문자열이 아님')

  const summary = truncateSummaryAtSentenceBoundary(value.replace(/\s+/g, ' ').trim())
  if (summary.length === 0) throw new Error('summary가 비어 있음')
  if (summary.length > SUMMARY_MAX_LENGTH) {
    throw new Error(`summary가 ${SUMMARY_MAX_LENGTH}자를 초과함`)
  }
  if (mode === 'detailed' && summary.length < DETAILED_SUMMARY_MIN_LENGTH) {
    throw new Error('상세 요약이 품질 하한을 충족하지 않음')
  }
  if (mode === 'limited_source'
      && /(정보|내용|본문|설명).{0,10}(제공되지|부족|없)|알 수 없/.test(summary)) {
    throw new Error('제한 입력 요약이 입력 부족을 노출함')
  }
  if (/(?:니다|요)[.!?](?:\s|$)/.test(summary)) {
    throw new Error('요약 문체가 ~다체가 아님')
  }
  return summary
}

async function summarizeChunk(chunk, offset, groqClient) {
  const input = chunk.map((article, index) => {
    const prepared = prepareSummaryInput(article)
    return {
      index: offset + index,
      ...prepared,
      summaryMode: prepared.description.length >= DETAILED_DESCRIPTION_MIN_LENGTH
        ? 'detailed'
        : 'limited_source',
    }
  })

  const response = await groqClient.chat.completions.create({
    model: MODEL_ID,
    messages: [
      {
        role: 'system',
        content: `You summarize technology articles in Korean. Follow these rules:
1. Use only facts explicitly present in the supplied title and description
2. Never add names, numbers, causes, outcomes, or technical details not in the input
3. For summaryMode "detailed", write two to four natural Korean sentences, aiming for about three only when the source has enough substance; include the background or problem, the main approach or content, and any explicitly stated result, example, operational fact, or significance that helps a reader understand the article
4. Prefer concrete technologies, methods, numbers, and outcomes that appear in the description; do not merely paraphrase the title
5. Every sentence must be traceable to a specific phrase in the input. If no result is stated, use another explicit background detail, example, or operational fact instead of filling the third sentence with an inferred benefit
6. Never claim improved efficiency, effectiveness, performance, quality, or productivity unless that outcome is explicitly stated in the input
7. For summaryMode "limited_source", write one conservative sentence describing only the topic stated by the title and available text; never say that information, content, body, or description is missing or insufficient
8. Preserve product names, technology names, and acronyms when useful
9. Keep each detailed summary between ${DETAILED_SUMMARY_MIN_LENGTH} and ${SUMMARY_MAX_LENGTH} Korean characters, and each limited-source summary at most ${SUMMARY_MAX_LENGTH} characters
10. Use consistent Korean plain declarative style ending sentences with forms such as "~한다", "~했다", "~이다", or "~다"; never use polite endings such as "~습니다", "~합니다", "~입니다", or "~됩니다"
11. Do not mention the summaryMode, and do not use labels or bullet points
12. Return only valid JSON matching the requested schema`,
      },
      {
        role: 'user',
        content: `Summarize each article independently according to its summaryMode.\n\nArticles:\n${JSON.stringify(input)}`,
      },
    ],
    max_completion_tokens: 3072,
    reasoning_effort: 'low',
    include_reasoning: false,
    temperature: 0,
    response_format: RESPONSE_FORMAT,
  })

  const parsed = JSON.parse(response.choices[0].message.content)
  if (!Array.isArray(parsed.results)) throw new Error('results가 배열이 아님')
  return parsed.results
}

async function summarizeBatch(articles, {
  apiKey = process.env.GROQ_API_KEY,
  groqClient,
  sleep = ms => new Promise(resolve => setTimeout(resolve, ms)),
} = {}) {
  if (articles.length === 0) return []
  if (!apiKey) throw new Error('GROQ_API_KEY 미설정')

  const clientForRequest = groqClient ?? getClient()
  const allResults = []

  for (let i = 0; i < articles.length; i += CHUNK_SIZE) {
    const chunk = articles.slice(i, i + CHUNK_SIZE)
    if (i > 0) await sleep(CHUNK_DELAY_MS)
    allResults.push(...await summarizeChunk(chunk, i, clientForRequest))
  }

  const resultsByIndex = new Map()
  const addResult = result => {
    if (!Number.isInteger(result.index)
        || result.index < 0
        || result.index >= articles.length
        || resultsByIndex.has(result.index)) {
      throw new Error('AI 응답의 article index가 잘못됨')
    }
    const prepared = prepareSummaryInput(articles[result.index])
    const mode = prepared.description.length >= DETAILED_DESCRIPTION_MIN_LENGTH
      ? 'detailed'
      : 'limited_source'
    resultsByIndex.set(result.index, normalizeSummary(result.summary, mode))
  }

  for (const result of allResults) addResult(result)

  for (let index = 0; index < articles.length; index++) {
    if (resultsByIndex.has(index)) continue

    console.warn(`[SUMMARIZER] AI 응답에서 기사 ${index} 누락 → 개별 재요청`)
    const retryResults = await summarizeChunk([articles[index]], index, clientForRequest)
    for (const result of retryResults) addResult(result)
  }

  return articles.map((article, index) => {
    const summary = resultsByIndex.get(index)
    if (!summary) throw new Error(`AI response omitted article index ${index}`)
    return { ...article, summary, summaryModel: MODEL_ID }
  })
}

module.exports = {
  MODEL_ID,
  SUMMARY_MAX_LENGTH,
  DETAILED_SUMMARY_MIN_LENGTH,
  DETAILED_DESCRIPTION_MIN_LENGTH,
  CHUNK_SIZE,
  CHUNK_DELAY_MS,
  RESPONSE_FORMAT,
  countSentences,
  truncateSummaryAtSentenceBoundary,
  normalizeSummary,
  summarizeBatch,
}
