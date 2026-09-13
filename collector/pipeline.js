const { collect } = require('./src/collector')
const { runTaggerJob } = require('./src/tagger-job')
const { runSummarizerJob } = require('./src/summarizer-job')

async function runPipeline() {
  await collect()
  await runTaggerJob()
  await runSummarizerJob()
}

runPipeline().catch(error => {
  console.error('[PIPELINE] 실행 실패:', error)
  process.exitCode = 1
})

