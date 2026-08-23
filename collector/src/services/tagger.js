/**
 * LLM 기반 태거 (Groq - GPT-OSS 20B).
 *
 * 기사를 작은 청크로 묶어 한 번의 API 호출로 처리해서 속도와 비용을 최적화한다.
 * GROQ_API_KEY 미설정 시 keywordTagger로 폴백한다.
 */
const Groq = require('groq-sdk')
const { tag: keywordTag } = require('./keywordTagger')
const { prepareTaggingInput } = require('./taggingText')
const { CANONICAL_TAGS, SYNONYMS } = require('../config/keywords')

const CANONICAL_SET = new Set(CANONICAL_TAGS)
const MODEL_ID = 'openai/gpt-oss-20b'

let client = null

function getClient() {
  if (!client) client = new Groq({ apiKey: process.env.GROQ_API_KEY })
  return client
}

function readIntegerSetting(name, fallback, minimum) {
  const parsed = Number.parseInt(process.env[name] ?? '', 10)
  return Number.isInteger(parsed) && parsed >= minimum ? parsed : fallback
}

const CHUNK_SIZE = readIntegerSetting('TAGGER_CHUNK_SIZE', 5, 1)
const CHUNK_DELAY_MS = readIntegerSetting('TAGGER_CHUNK_DELAY_MS', 20000, 0)

// 동의어를 canonical 형태로 정규화하고, allowlist에 없는 태그 제거
function normalizeTags(tags) {
  return [...new Set(
    tags
      .map(t => SYNONYMS[t.toLowerCase()] ?? t.toLowerCase())
      .filter(t => CANONICAL_SET.has(t))
  )]
}

const RESPONSE_FORMAT = {
  type: 'json_schema',
  json_schema: {
    name: 'article_tagging_results',
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
              tags: {
                type: 'array',
                items: { type: 'string', enum: CANONICAL_TAGS },
              },
            },
            required: ['index', 'tags'],
            additionalProperties: false,
          },
        },
      },
      required: ['results'],
      additionalProperties: false,
    },
  },
}

async function tagChunk(chunk, offset, groqClient = getClient()) {
  const input = chunk.map((article, i) => ({
    index: offset + i,
    ...prepareTaggingInput(article),
  }))

  const systemPrompt = `You are a tech article tagger. You must:
1. Select tags that represent the article's central subject, including named technologies, engineering methods, architecture, operations, and organizational topics
2. Select only exact values allowed by the response schema
3. Never invent, translate, or alter a tag
4. Return 0 tags if the article is NOT IT/tech related
5. Return 0-5 tags per article
6. Do not tag technologies that are only mentioned incidentally
7. Respond only with valid JSON matching the exact format requested`

  const prompt = `Tag these articles with their central technologies and engineering topics.

Articles:
${JSON.stringify(input)}

Rules:
- Use canonical form when available: "node.js" not "nodejs", "postgresql" not "postgres", "llm" not "llms"
- Include engineering-method and operations tags when they are central, such as "testing", "observability", or "ai-strategy"
- Treat Korean names and common aliases as their canonical tag: "Golang" → "go", "쿠버네티스" → "kubernetes", "AI 에이전트" → "ai-agent"
- Select tags only from the canonical list; never invent a new tag
- Non-IT articles → return empty tags array

Respond with this exact JSON:
{"results": [{"index": 0, "tags": ["spring-boot", "jpa", "postgresql"]}]}`

  const response = await groqClient.chat.completions.create({
    model: MODEL_ID,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    max_completion_tokens: 1024,
    reasoning_effort: 'low',
    include_reasoning: false,
    temperature: 0,
    response_format: RESPONSE_FORMAT,
  })

  const parsed = JSON.parse(response.choices[0].message.content)
  const results = parsed.results ?? parsed
  if (!Array.isArray(results)) throw new Error('results가 배열이 아님')
  return results
}

async function tagBatch(articles, {
  apiKey = process.env.GROQ_API_KEY,
  groqClient,
  keywordTagger = keywordTag,
  sleep = ms => new Promise(resolve => setTimeout(resolve, ms)),
} = {}) {
  if (articles.length === 0) return []

  if (!apiKey) {
    console.warn('[TAGGER] GROQ_API_KEY 없음 → 키워드 방식으로 폴백')
    return articles.map(a => ({
      ...keywordTagger(a),
      taggingMethod: 'KEYWORD',
      taggingError: null,
    }))
  }

  const clientForRequest = groqClient ?? getClient()

  const allResults = []

  for (let i = 0; i < articles.length; i += CHUNK_SIZE) {
    const chunk = articles.slice(i, i + CHUNK_SIZE)
    if (i > 0) await sleep(CHUNK_DELAY_MS)
    try {
      const results = await tagChunk(chunk, i, clientForRequest)
      allResults.push(...results.map(result => ({
        ...result,
        taggingMethod: 'AI',
        taggingError: null,
      })))
    } catch (err) {
      console.warn(`[TAGGER] 청크 ${i}~${i + chunk.length - 1} 실패 (${err.message}) → 키워드 방식`)
      chunk.forEach((a, j) => {
        const kw = keywordTagger(a)
        allResults.push({
          index: i + j,
          tags: kw.tags,
          taggingMethod: 'KEYWORD_FALLBACK',
          taggingError: err.message,
        })
      })
    }
  }

  return articles.map((article, i) => {
    const r = allResults.find(r => r.index === i)
    if (!r) return {
      ...keywordTagger(article),
      taggingMethod: 'KEYWORD_FALLBACK',
      taggingError: 'AI response omitted article index',
    }
    return {
      ...article,
      tags: normalizeTags(Array.isArray(r.tags) ? r.tags : []).slice(0, 5),
      taggingMethod: r.taggingMethod,
      taggingError: r.taggingError,
    }
  })
}

module.exports = { MODEL_ID, RESPONSE_FORMAT, normalizeTags, tagBatch }
