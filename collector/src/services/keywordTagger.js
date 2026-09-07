const {
  CANONICAL_TAGS,
  HIGH_CONFIDENCE_ALIASES,
} = require('../config/keywords')
const { prepareTaggingInput } = require('./taggingText')

function keywordPattern(kw) {
  const escaped = kw
    .split('-')
    .map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('(?:-|\\s)+')
  return new RegExp(`(^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`)
}

function matchKeyword(text, kw) {
  return keywordPattern(kw).test(text)
}

function findTags(text) {
  const canonicalMatches = CANONICAL_TAGS.filter(tag => matchKeyword(text, tag))
  const aliasMatches = Object.entries(HIGH_CONFIDENCE_ALIASES)
    .filter(([alias]) => matchKeyword(text, alias))
    .map(([, canonical]) => canonical)

  return [...new Set([...canonicalMatches, ...aliasMatches])]
}

function findHighConfidenceTags(text) {
  return [...new Set(
    Object.entries(HIGH_CONFIDENCE_ALIASES)
      .map(([alias, canonical], order) => ({
        canonical,
        index: text.search(keywordPattern(alias)),
        order,
      }))
      .filter(match => match.index >= 0)
      .sort((a, b) => a.index - b.index || a.order - b.order)
      .map(match => match.canonical)
  )]
}

function pretag(article) {
  const input = prepareTaggingInput(article)
  const titleTags = findHighConfidenceTags(input.title.toLowerCase())
  const descriptionTags = findHighConfidenceTags(input.description.toLowerCase())
  return [...new Set([...titleTags, ...descriptionTags])]
}

function tag(article) {
  const input = prepareTaggingInput(article)
  const text = `${input.title} ${input.description}`.toLowerCase()
  return { ...article, tags: findTags(text) }
}

module.exports = { pretag, tag }
