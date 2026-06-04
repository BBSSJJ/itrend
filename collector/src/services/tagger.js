/**
 * LLM 기반 태거 (Groq - llama-3.1-8b-instant).
 *
 * 소스 단위로 기사를 묶어 한 번의 API 호출로 처리(배치)해서 속도와 비용을 최적화한다.
 * GROQ_API_KEY 미설정 시 keywordTagger로 폴백한다.
 */
const Groq = require('groq-sdk')
const { tag: keywordTag } = require('./keywordTagger')
const { CANONICAL_TAGS, SYNONYMS } = require('../config/keywords')

const CANONICAL_TAG_LIST = CANONICAL_TAGS.join(', ')
const CANONICAL_SET = new Set(CANONICAL_TAGS)

let client = null

function getClient() {
  if (!client) client = new Groq({ apiKey: process.env.GROQ_API_KEY })
  return client
}

const CHUNK_SIZE = 10
const CHUNK_DELAY_MS = 500  // TPM 한도 초과 방지용 청크 간 딜레이

function sanitize(str) {
  return (str ?? '').replace(/["\\\n\r\t]/g, ' ').slice(0, 150).trim()
}

// 동의어를 canonical 형태로 정규화하고, allowlist에 없는 태그 제거
function normalizeTags(tags) {
  return [...new Set(
    tags
      .map(t => SYNONYMS[t.toLowerCase()] ?? t.toLowerCase())
      .filter(t => CANONICAL_SET.has(t))
  )]
}

async function tagChunk(chunk, offset) {
  const input = chunk.map((a, i) => ({
    index: offset + i,
    title: sanitize(a.title),
    description: sanitize(a.description),
  }))

  const systemPrompt = `You are a tech article tagger. You must:
1. Extract specific technology names as tags
2. PREFER tags from the canonical list provided — use the exact canonical form when the technology matches
3. Tags must be English, lowercase, hyphenated (e.g. "spring-boot", "machine-learning")
4. Return 0 tags if the article is NOT IT/tech related
5. Return 2-5 tags per article
6. Respond only with valid JSON matching the exact format requested`

  const prompt = `Tag these articles with specific technology names.

Canonical tag list (prefer these exact forms):
${CANONICAL_TAG_LIST}

Articles:
${JSON.stringify(input)}

Rules:
- Use canonical form when available: "node.js" not "nodejs", "postgresql" not "postgres", "llm" not "llms"
- For unlisted technologies, use lowercase-hyphenated form
- Non-IT articles → return empty tags array

Respond with this exact JSON:
{"results": [{"index": 0, "tags": ["spring-boot", "jpa", "postgresql"]}]}`

  const response = await getClient().chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    max_tokens: 1024,
    response_format: { type: 'json_object' },
  })

  const parsed = JSON.parse(response.choices[0].message.content)
  const results = parsed.results ?? parsed
  if (!Array.isArray(results)) throw new Error('results가 배열이 아님')
  return results
}

async function tagBatch(articles) {
  if (articles.length === 0) return []

  if (!process.env.GROQ_API_KEY) {
    console.warn('[TAGGER] GROQ_API_KEY 없음 → 키워드 방식으로 폴백')
    return articles.map(a => keywordTag(a))
  }

  const allResults = []

  for (let i = 0; i < articles.length; i += CHUNK_SIZE) {
    const chunk = articles.slice(i, i + CHUNK_SIZE)
    if (i > 0) await new Promise(r => setTimeout(r, CHUNK_DELAY_MS))
    try {
      const results = await tagChunk(chunk, i)
      allResults.push(...results)
    } catch (err) {
      console.warn(`[TAGGER] 청크 ${i}~${i + chunk.length - 1} 실패 (${err.message}) → 키워드 방식`)
      chunk.forEach((a, j) => {
        const kw = keywordTag(a)
        allResults.push({ index: i + j, tags: kw.tags })
      })
    }
  }

  return articles.map((article, i) => {
    const r = allResults.find(r => r.index === i)
    if (!r) return { ...keywordTag(article) }
    return {
      ...article,
      tags: normalizeTags(Array.isArray(r.tags) ? r.tags : []),
    }
  })
}

module.exports = { tagBatch }
