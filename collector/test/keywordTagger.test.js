const test = require('node:test')
const assert = require('node:assert/strict')
const { tag } = require('../src/services/keywordTagger')

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
