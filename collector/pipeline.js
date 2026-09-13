const { collect } = require('./src/collector')
const { runTaggerJob } = require('./src/tagger-job')
const { runSummarizerJob } = require('./src/summarizer-job')

function parseLimit(argv) {
  const value = argv[0] ?? process.env.COLLECTOR_LIMIT
  if (value === undefined || value === '') return undefined
  const limit = Number(value)
  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new Error('사용법: npm run pipeline -- [신규 기사 최대 건수]')
  }
  return limit
}

async function runPipeline() {
  const limit = parseLimit(process.argv.slice(2))
  const ids = await collect({ limit })
  if (limit !== undefined && ids.length === 0) return
  await runTaggerJob(limit === undefined ? {} : { ids })
  await runSummarizerJob(limit === undefined ? {} : { ids })
}

runPipeline().catch(error => {
  console.error('[PIPELINE] 실행 실패:', error)
  process.exitCode = 1
})
