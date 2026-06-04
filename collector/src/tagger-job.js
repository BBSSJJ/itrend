const axios = require('axios')
const { tagBatch } = require('./services/tagger')

const BE_API_URL = process.env.BE_API_URL || ''
const API_KEY = process.env.COLLECTOR_API_KEY || ''
const BATCH_LIMIT = 50

async function runTaggerJob() {
  if (!BE_API_URL) {
    console.error('[TAGGER-JOB] BE_API_URL 미설정')
    return
  }

  console.log('\n[TAGGER-JOB] 시작\n')
  let totalTagged = 0

  while (true) {
    // 1. untagged 기사 조회
    const { data: articles } = await axios.get(`${BE_API_URL}/api/articles/untagged`, {
      params: { limit: BATCH_LIMIT },
    })

    if (articles.length === 0) {
      console.log('[TAGGER-JOB] 태그 미완료 기사 없음')
      break
    }

    console.log(`[TAGGER-JOB] ${articles.length}개 태깅 중...`)

    // 2. LLM 태깅
    const tagged = await tagBatch(articles)

    // 3. 서버에 태그 업데이트
    const payload = tagged.map(a => ({ id: a.id, tags: a.tags ?? [] }))
    const { data: result } = await axios.patch(
      `${BE_API_URL}/api/articles/tags/batch`,
      payload,
      { headers: { 'X-API-Key': API_KEY } }
    )

    totalTagged += result.updated
    console.log(`  [OK] ${result.updated}개 업데이트`)

    if (articles.length < BATCH_LIMIT) break
  }

  console.log(`\n[TAGGER-JOB] 완료 (총 ${totalTagged}개)\n`)
}

module.exports = { runTaggerJob }
