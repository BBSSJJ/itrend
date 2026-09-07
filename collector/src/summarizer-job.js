const axios = require('axios')
const {
  CHUNK_SIZE,
  CHUNK_DELAY_MS,
  summarizeBatch,
} = require('./services/summarizer')

const BE_API_URL = process.env.BE_API_URL || ''
const API_KEY = process.env.COLLECTOR_API_KEY || ''
const BATCH_LIMIT = 50

async function completeSummaryChunk(chunk) {
  const summarized = await summarizeBatch(chunk)
  const payload = summarized.map(article => ({
    id: article.id,
    summary: article.summary,
    model: article.summaryModel,
  }))
  const response = await axios.patch(
    `${BE_API_URL}/api/articles/summarization/complete`,
    payload,
    { headers: { 'X-API-Key': API_KEY } },
  )
  return response.data.updated
}

async function reportSummaryFailure(chunk, error) {
  try {
    await axios.patch(
      `${BE_API_URL}/api/articles/summarization/fail`,
      { ids: chunk.map(article => article.id), error: error.message },
      { headers: { 'X-API-Key': API_KEY } },
    )
  } catch (reportError) {
    console.error(`[SUMMARIZER-JOB] 실패 상태 보고 실패: ${reportError.message}`)
  }
}

async function runSummarizerJob() {
  if (!BE_API_URL) {
    console.error('[SUMMARIZER-JOB] BE_API_URL 미설정')
    return
  }

  console.log('\n[SUMMARIZER-JOB] 시작\n')
  let totalSummarized = 0

  while (true) {
    const { data: articles } = await axios.post(
      `${BE_API_URL}/api/articles/summarization/claim`,
      null,
      {
        params: { limit: BATCH_LIMIT },
        headers: { 'X-API-Key': API_KEY },
      },
    )

    if (articles.length === 0) {
      console.log('[SUMMARIZER-JOB] 요약 미완료 기사 없음')
      break
    }

    console.log(`[SUMMARIZER-JOB] ${articles.length}개 요약 중...`)

    let batchUpdated = 0
    let hadFailures = false

    for (let index = 0; index < articles.length; index += CHUNK_SIZE) {
      const chunk = articles.slice(index, index + CHUNK_SIZE)
      if (index > 0) {
        await new Promise(resolve => setTimeout(resolve, CHUNK_DELAY_MS))
      }

      try {
        const updated = await completeSummaryChunk(chunk)
        batchUpdated += updated
        console.log(`  [OK] ${updated}개 업데이트`)
      } catch (err) {
        console.warn(`  [RETRY] 청크 ${chunk.map(article => article.id).join(', ')} 개별 재처리: ${err.message}`)

        for (const article of chunk) {
          try {
            const updated = await completeSummaryChunk([article])
            batchUpdated += updated
            console.log(`  [OK] 기사 ${article.id} 업데이트`)
          } catch (articleError) {
            hadFailures = true
            console.error(`  [FAIL] 기사 ${article.id}: ${articleError.message}`)
            await reportSummaryFailure([article], articleError)
          }
        }
      }
    }

    totalSummarized += batchUpdated

    if (hadFailures || articles.length < BATCH_LIMIT) break
  }

  console.log(`\n[SUMMARIZER-JOB] 완료 (총 ${totalSummarized}개)\n`)
}

module.exports = { runSummarizerJob }
