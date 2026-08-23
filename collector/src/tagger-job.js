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
    // 1. 태깅 대기 기사를 원자적으로 선점
    const { data: articles } = await axios.post(`${BE_API_URL}/api/articles/tagging/claim`, null, {
      params: { limit: BATCH_LIMIT },
      headers: { 'X-API-Key': API_KEY },
    })

    if (articles.length === 0) {
      console.log('[TAGGER-JOB] 태그 미완료 기사 없음')
      break
    }

    console.log(`[TAGGER-JOB] ${articles.length}개 태깅 중...`)

    let result
    try {
      // 2. LLM 또는 키워드 태깅
      const tagged = await tagBatch(articles)

      // 3. 서버에 태그와 처리 방법 업데이트
      const payload = tagged.map(a => ({
        id: a.id,
        tags: a.tags ?? [],
        method: a.taggingMethod,
        error: a.taggingError,
      }))
      const response = await axios.patch(
        `${BE_API_URL}/api/articles/tagging/complete`,
        payload,
        { headers: { 'X-API-Key': API_KEY } }
      )
      result = response.data
    } catch (err) {
      try {
        await axios.patch(
          `${BE_API_URL}/api/articles/tagging/fail`,
          { ids: articles.map(article => article.id), error: err.message },
          { headers: { 'X-API-Key': API_KEY } }
        )
      } catch (reportError) {
        console.error(`[TAGGER-JOB] 실패 상태 보고 실패: ${reportError.message}`)
      }
      throw err
    }

    totalTagged += result.updated
    console.log(`  [OK] ${result.updated}개 업데이트`)

    if (articles.length < BATCH_LIMIT) break
  }

  console.log(`\n[TAGGER-JOB] 완료 (총 ${totalTagged}개)\n`)
}

module.exports = { runTaggerJob }
