/**
 * 수집된 아티클을 Spring Boot API로 전송하는 서비스.
 *
 * 현재 상태: NODE_ENV=dev이거나 BE_API_URL 미설정 시 콘솔에만 출력 (Spring Boot 없이 개발 가능)
 * Spring Boot 완성 후: POST /api/articles/batch 로 실제 전송
 *
 * 이 파일만 수정하면 전송 방식을 바꿀 수 있다. 어댑터나 collector는 변경 불필요.
 */
const axios = require('axios')

function createSender({
  httpClient = axios,
  apiUrl = process.env.BE_API_URL || '',
  apiKey = process.env.COLLECTOR_API_KEY || '',
  isDev = process.env.NODE_ENV === 'dev',
} = {}) {
  return async function sendArticles(articles) {
    if (!apiUrl || isDev) {
      _logArticles(articles)
      return
    }

    // _hnId 같은 내부용 필드는 Spring Boot에 보내지 않음
    const payload = articles.map(({ _hnId, ...article }) => article)

    try {
      await httpClient.post(`${apiUrl}/api/articles/batch`, payload, {
        headers: { 'X-API-Key': apiKey },
      })
    } catch (err) {
      console.error('[SENDER] 전송 실패:', err.message)
      throw err
    }
  }
}

const send = createSender()

// 개발 시 수집 결과를 보기 좋게 콘솔 출력
function _logArticles(articles) {
  articles.forEach(a => {
    console.log(`  ${a.title}`)
    if (a.tags?.length > 0) console.log(`    tags: ${a.tags.join(', ')}`)
    console.log(`    ${a.url}`)
  })
}

module.exports = { createSender, send }
