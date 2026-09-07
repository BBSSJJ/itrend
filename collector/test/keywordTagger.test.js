const test = require('node:test')
const assert = require('node:assert/strict')
const { pretag, tag } = require('../src/services/keywordTagger')

test('키워드 태거는 제목과 설명에서 canonical 태그를 찾는다', () => {
  const article = tag({ title: 'Spring Boot with PostgreSQL', description: 'Docker deployment' })

  assert.ok(article.tags.includes('spring-boot'))
  assert.ok(article.tags.includes('postgresql'))
  assert.ok(article.tags.includes('docker'))
})

test('키워드 일부만 일치하면 태그로 처리하지 않는다', () => {
  const article = tag({ title: 'Reacting to change' })
  assert.ok(!article.tags.includes('react'))
})

test('키워드 태거는 배너와 URL을 제거한 공용 태깅 입력을 사용한다', () => {
  const article = tag({
    title: '메시지 플랫폼 운영',
    description: '![Express](https://example.com/go/bootstrap.png) Kafka를 운영합니다.',
  })

  assert.ok(article.tags.includes('kafka'))
  assert.ok(!article.tags.includes('express'))
  assert.ok(!article.tags.includes('go'))
  assert.ok(!article.tags.includes('bootstrap'))
})

test('키워드 태거는 고정밀 한국어와 영문 별칭을 canonical 태그로 변환한다', () => {
  const tags = pretag({
    title: 'Golang과 AI 에이전트로 운영 도구 만들기',
    description: '쿠버네티스 환경의 관측성을 개선합니다.',
  })

  assert.deepEqual(tags, ['go', 'ai-agent', 'kubernetes', 'observability'])
})

test('키워드 태거는 모호한 짧은 표현을 별칭으로 선태깅하지 않는다', () => {
  const tags = pretag({
    title: 'Agents go beyond spring trends',
    description: 'A simple ML test written in JS.',
  })

  assert.deepEqual(tags, [])
})

test('선태거는 실제 누락 사례의 명시적인 기술명을 보존한다', () => {
  assert.deepEqual(
    pretag({ title: '운영하지 않는 Kafka, EasyQueue를 소개합니다' }),
    ['kafka'],
  )
  assert.deepEqual(
    pretag({ title: 'Grafana에서 자연어로 장애 원인을 분석하기: LLM 에이전트 기반 SRELens 개발기' }),
    ['grafana', 'llm', 'ai-agent'],
  )
  assert.deepEqual(
    pretag({ title: '데이터 정합성을 유지하는 법 (feat. 낙관적 락)' }),
    ['optimistic-locking'],
  )
  assert.deepEqual(
    pretag({ title: '경계가 만든 길, Load Balancer(DSR)' }),
    ['load-balancing'],
  )
  assert.deepEqual(
    pretag({ title: '모노리포 희망편' }),
    ['monorepo'],
  )
  assert.deepEqual(
    pretag({ title: 'KDE에 Btrfs 스냅샷을 통합하기' }),
    ['btrfs'],
  )
})
