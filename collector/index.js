require('dotenv').config()
const express = require('express')
const { collect } = require('./src/collector')
const { runTaggerJob } = require('./src/tagger-job')
const { runSummarizerJob } = require('./src/summarizer-job')

const app = express()
const PORT = process.env.COLLECTOR_PORT || 3001

let collectRunning = false
let tagRunning = false
let summarizeRunning = false

app.post('/collect', async (req, res) => {
  if (collectRunning) {
    return res.status(409).json({ error: '수집이 이미 실행 중입니다' })
  }
  collectRunning = true
  res.json({ message: '수집 시작' })
  try {
    await collect()
  } finally {
    collectRunning = false
  }
})

app.post('/tag', async (req, res) => {
  if (tagRunning) {
    return res.status(409).json({ error: '태깅이 이미 실행 중입니다' })
  }
  tagRunning = true
  res.json({ message: '태깅 시작' })
  try {
    await runTaggerJob()
  } finally {
    tagRunning = false
  }
})

app.post('/summarize', async (req, res) => {
  if (summarizeRunning) {
    return res.status(409).json({ error: '요약이 이미 실행 중입니다' })
  }
  summarizeRunning = true
  res.json({ message: '요약 시작' })
  try {
    await runSummarizerJob()
  } finally {
    summarizeRunning = false
  }
})

app.listen(PORT, () => {
  console.log(`[SERVER] 수집기 API 서버 실행 중 (포트: ${PORT})`)
  console.log(`  POST /collect  — RSS 수집`)
  console.log(`  POST /tag      — LLM 태깅`)
  console.log(`  POST /summarize — LLM 요약`)
})
