const cron = require('node-cron')
const { collect } = require('./collector')
const { runTaggerJob } = require('./tagger-job')

// 매일 08:00, 18:00 수집
cron.schedule('0 8,18 * * *', async () => {
  console.log('[SCHEDULER] 수집 시작')
  await collect()
}, { timezone: 'Asia/Seoul' })

// 수집 30분 후 태깅 (08:30, 18:30)
cron.schedule('30 8,18 * * *', async () => {
  console.log('[SCHEDULER] 태깅 시작')
  await runTaggerJob()
}, { timezone: 'Asia/Seoul' })

console.log('[SCHEDULER] 실행 중 (수집: 08:00/18:00, 태깅: 08:30/18:30 KST)')
