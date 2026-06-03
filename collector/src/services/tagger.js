/**
 * LLM 기반 태거 (Groq - llama-3.1-8b-instant).
 *
 * 소스 단위로 기사를 묶어 한 번의 API 호출로 처리(배치)해서 속도와 비용을 최적화한다.
 * GROQ_API_KEY 미설정 시 keywordTagger로 폴백한다.
 */
const Groq = require('groq-sdk')
const { tag: keywordTag } = require('./keywordTagger')

const CATEGORIES = {
  frontend:     'React, Vue, Angular, CSS, HTML, JavaScript, TypeScript, 웹 UI/UX',
  backend:      'Spring, Java, Node.js, Python, Go, Rust, API 설계, 서버, DB, ORM',
  cloud:        'AWS, GCP, Azure, Kubernetes, Docker, 컨테이너, 서버리스, 클라우드 인프라',
  devops:       'CI/CD, 모니터링, 인프라, Linux, GitOps, Ansible, Grafana, 배포 자동화',
  ai:           'AI, ML, LLM, GPT, Claude, 딥러닝, 머신러닝, 자연어처리, 생성형 AI',
  architecture: '소프트웨어 설계, DDD, MSA, 이벤트 드리븐, 클린 아키텍처, 리팩토링, SOLID',
  general:      'IT 관련이지만 위 카테고리에 해당하지 않는 내용',
}

const CATEGORY_LIST = Object.entries(CATEGORIES)
  .map(([slug, desc]) => `- ${slug}: ${desc}`)
  .join('\n')

let client = null

function getClient() {
  if (!client) client = new Groq({ apiKey: process.env.GROQ_API_KEY })
  return client
}

const CHUNK_SIZE = 10
const CHUNK_DELAY_MS = 500  // TPM 한도 초과 방지용 청크 간 딜레이

// JSON에 들어갈 문자열에서 따옴표/역슬래시 등 파싱을 깨뜨리는 문자 제거
function sanitize(str) {
  return (str ?? '').replace(/["\\\n\r\t]/g, ' ').slice(0, 150).trim()
}

async function tagChunk(chunk, offset) {
  const input = chunk.map((a, i) => ({
    index: offset + i,
    title: sanitize(a.title),
    description: sanitize(a.description),
  }))

  const systemPrompt = `You are an IT article classifier. You must:
1. Choose exactly one category per article
2. Generate 2-5 tags per article
3. Tags MUST always be in English lowercase with hyphens (NEVER Korean or other languages)
4. Respond only with valid JSON matching the exact format requested`

  const prompt = `Classify these IT articles into categories and tags.

Categories:
- frontend: React, Vue, Angular, CSS, HTML, JavaScript, TypeScript, web UI/UX, browser
- backend: Spring Boot, Java, Node.js, Python, Go, Rust, REST API, GraphQL, database, ORM, server
- cloud: AWS, GCP, Azure, Kubernetes, Docker, container, serverless, cloud infrastructure
- devops: CI/CD, monitoring, Linux, infrastructure, GitOps, Ansible, Grafana, deployment
- ai: AI, ML, LLM, GPT, deep learning, machine learning, NLP, generative AI, neural network
- architecture: software design, DDD, MSA, microservice, event-driven, clean architecture, SOLID, refactoring
- general: IT-related but doesn't fit the above (business, career, trends, non-technical)

Articles:
${JSON.stringify(input)}

Rules for tags:
- ALWAYS English, lowercase, hyphenated: "spring-boot" not "스프링부트"
- Specific technical terms: "kubernetes" not "cloud"
- Good: ["spring-boot", "jpa", "rest-api"] / Bad: ["서버", "백엔드", "기술"]

Respond with this exact JSON:
{"results": [{"index": 0, "categorySlug": "backend", "tags": ["spring-boot", "jpa", "rest-api"]}]}`

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
  const results = parsed.results ?? parsed  // 모델이 배열로 직접 반환하는 경우 대비
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
        allResults.push({ index: i + j, categorySlug: kw.categorySlug, tags: kw.tags })
      })
    }
  }

  return articles.map((article, i) => {
    const r = allResults.find(r => r.index === i)
    if (!r) return { ...keywordTag(article), categorySlug: undefined }
    return {
      ...article,
      tags: Array.isArray(r.tags) ? r.tags : [],
    }
  })
}

module.exports = { tagBatch }
