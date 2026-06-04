/**
 * 수집된 아티클을 Spring Boot API로 전송하는 서비스.
 *
 * 현재 상태: NODE_ENV=dev이거나 BE_API_URL 미설정 시 콘솔에만 출력 (Spring Boot 없이 개발 가능)
 * Spring Boot 완성 후: POST /api/articles/batch 로 실제 전송
 *
 * 이 파일만 수정하면 전송 방식을 바꿀 수 있다. 어댑터나 collector는 변경 불필요.
 */
const axios = require('axios')

const BE_API_URL = process.env.BE_API_URL || ''      // .env 파일에서 읽어옴. 없으면 빈 문자열
const API_KEY = process.env.COLLECTOR_API_KEY || ''  // Spring Boot에서 수집기 요청임을 검증하는 키

async function send(articles) {
  // 개발 모드이거나 BE URL이 없으면 콘솔에만 출력
  if (!BE_API_URL || process.env.NODE_ENV === 'dev') {
    _logArticles(articles)
    return
  }

  // _hnId 같은 내부용 필드는 Spring Boot에 보내지 않음
  const payload = articles.map(({ _hnId, ...article }) => article)

  try {
    await axios.post(`${BE_API_URL}/api/articles/batch`, payload, {
      headers: { 'X-API-Key': API_KEY },
    })
  } catch (err) {
    console.error('[SENDER] 전송 실패:', err.message)
    throw err  // 호출자(collector.js)에서 에러를 잡을 수 있도록 다시 던짐
  }
}

// 개발 시 수집 결과를 보기 좋게 콘솔 출력
function _logArticles(articles) {
  articles.forEach(a => {
    console.log(`  ${a.title}`)
    if (a.tags.length > 0) console.log(`    tags: ${a.tags.join(', ')}`)
    console.log(`    ${a.url}`)
  })
}

module.exports = { send }
