const {
  cleanTaggingText,
  truncateAtWordBoundary,
} = require('./taggingText')

const SUMMARY_TITLE_MAX_LENGTH = 200
const SUMMARY_DESCRIPTION_MAX_LENGTH = 2000

function prepareSummaryInput(article) {
  return {
    title: truncateAtWordBoundary(
      cleanTaggingText(article.title),
      SUMMARY_TITLE_MAX_LENGTH,
    ),
    description: truncateAtWordBoundary(
      cleanTaggingText(article.description),
      SUMMARY_DESCRIPTION_MAX_LENGTH,
    ),
  }
}

module.exports = {
  SUMMARY_TITLE_MAX_LENGTH,
  SUMMARY_DESCRIPTION_MAX_LENGTH,
  prepareSummaryInput,
}
