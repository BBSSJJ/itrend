const { CANONICAL_TAGS } = require('../config/keywords')
const { prepareTaggingInput } = require('./taggingText')

function matchKeyword(text, kw) {
  const pattern = kw
    .split('-')
    .map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('(?:-|\\s)+')
  return new RegExp(`(^|[^a-z0-9])${pattern}(?=$|[^a-z0-9])`).test(text)
}

function tag(article) {
  const input = prepareTaggingInput(article)
  const text = `${input.title} ${input.description}`.toLowerCase()
  const tags = CANONICAL_TAGS.filter(kw => matchKeyword(text, kw))
  return { ...article, tags }
}

module.exports = { tag }
