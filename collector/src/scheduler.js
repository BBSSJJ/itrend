/**
 * 수집 스케줄러.
 *
 * node-cron 라이브러리를 사용해 정해진 시간에 자동으로 collect()를 실행한다.
 * cron 표현식: '분 시 일 월 요일'
 *   '0 8,18 * * *' → 매일 8시 0분, 18시 0분에 실행
 *
 * 참고: Java Spring의 @Scheduled(cron = "0 0 8,18 * * *")와 동일한 개념
 */
const cron = require('node-cron')
const { collect } = require('./collector')

cron.schedule('0 8,18 * * *', async () => {
  console.log('[SCHEDULER] 수집 시작')
  await collect()
}, { timezone: 'Asia/Seoul' })  // 한국 시간 기준

console.log('[SCHEDULER] 실행 중 (매일 08:00, 18:00 KST)')
