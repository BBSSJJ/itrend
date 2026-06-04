const { CANONICAL_TAGS } = require('../config/keywords')

function matchKeyword(text, kw) {
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`\\b${escaped}\\b`).test(text)
}

function tag(article) {
  const text = `${article.title ?? ''} ${article.description ?? ''}`.toLowerCase()
  const tags = CANONICAL_TAGS.filter(kw => matchKeyword(text, kw))
  return { ...article, tags }
}

module.exports = { tag }
