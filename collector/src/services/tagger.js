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

async function tagBatch(articles) {
  if (articles.length === 0) return []

  if (!process.env.GROQ_API_KEY) {
    console.warn('[TAGGER] GROQ_API_KEY 없음 → 키워드 방식으로 폴백')
    return articles.map(a => keywordTag(a))
  }

  const input = articles.map((a, i) => ({
    index: i,
    title: a.title ?? '',
    description: a.description ?? '',
  }))

  const prompt = `IT 기사 목록을 분류해주세요.

카테고리:
${CATEGORY_LIST}

기사 목록:
${JSON.stringify(input)}

각 기사에 대해 아래 JSON 배열 형식으로만 응답하세요. 다른 텍스트 없이 JSON만:
[{"index": 0, "categorySlug": "backend", "tags": ["spring", "jpa", "java"]}]

태그 규칙:
- 기사의 핵심 기술/개념 키워드 2~5개
- 영어 소문자, 띄어쓰기는 하이픈으로 (예: "spring-boot", "machine-learning")`

  try {
    const response = await getClient().chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
    })

    const text = response.choices[0].message.content.trim()
    const json = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    const results = JSON.parse(json)

    return articles.map((article, i) => {
      const r = results.find(r => r.index === i)
      if (!r) return keywordTag(article)
      return {
        ...article,
        categorySlug: r.categorySlug ?? 'general',
        tags: Array.isArray(r.tags) ? r.tags : [],
      }
    })
  } catch (err) {
    console.warn(`[TAGGER] LLM 호출 실패 (${err.message}) → 키워드 방식으로 폴백`)
    return articles.map(a => keywordTag(a))
  }
}

module.exports = { tagBatch }
