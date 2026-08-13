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
