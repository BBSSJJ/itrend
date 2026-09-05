const cheerio = require('cheerio')

const TITLE_MAX_LENGTH = 200
const DESCRIPTION_MAX_LENGTH = 600

function stripMarkup(value) {
  const withoutMarkdownMedia = value
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/[^\s<>)\]}]+/gi, ' ')

  if (!/<[a-z][\s\S]*>/i.test(withoutMarkdownMedia)) {
    return withoutMarkdownMedia
  }

  const $ = cheerio.load(withoutMarkdownMedia, null, false)
  $('script, style, noscript, svg, img, picture, video, audio').remove()
  return $.root().text()
}

function cleanTaggingText(value) {
  if (value == null) return ''

  return stripMarkup(String(value).normalize('NFKC'))
    .replace(/\\[rnt]/g, ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/(^|\s)[#>*_~`]+(?=\s|$)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function truncateAtWordBoundary(value, maxLength) {
  if (value.length <= maxLength) return value

  const candidate = value.slice(0, maxLength + 1)
  const lastWhitespace = candidate.lastIndexOf(' ')
  const boundary = lastWhitespace >= Math.floor(maxLength * 0.8)
    ? lastWhitespace
    : maxLength

  return candidate.slice(0, boundary).trim()
}

function prepareTaggingInput(article) {
  return {
    title: truncateAtWordBoundary(cleanTaggingText(article.title), TITLE_MAX_LENGTH),
    description: truncateAtWordBoundary(
      cleanTaggingText(article.description),
      DESCRIPTION_MAX_LENGTH,
    ),
  }
}

module.exports = {
  TITLE_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  cleanTaggingText,
  prepareTaggingInput,
}
