/**
 * 아티클에 자동으로 태그와 카테고리를 부여하는 서비스.
 *
 * 동작 방식:
 *   1. 아티클의 제목 + 설명을 소문자로 합친 문자열을 만든다
 *   2. categories.js의 각 카테고리 키워드와 매칭한다
 *   3. 가장 많이 매칭된 카테고리를 주 카테고리로 선정한다
 *   4. 매칭된 키워드들이 태그가 된다
 *
 * 새 카테고리나 키워드 추가는 categories.js만 수정하면 된다. 이 파일은 건드릴 필요 없음.
 */
const categories = require('../config/categories')

/**
 * 아티클 객체를 받아 tags와 categorySlug를 추가해서 반환한다.
 * 원본 객체를 수정하지 않고 새 객체를 반환한다 (불변성 유지).
 */
function tag(article) {
  // 제목과 설명을 합쳐 소문자로 변환. null/undefined는 빈 문자열로 처리
  const text = `${article.title ?? ''} ${article.description ?? ''}`.toLowerCase()
  // ?? (Nullish coalescing): null이나 undefined일 때만 기본값 사용. Java의 Optional.orElse와 유사

  const matchedTags = new Set()  // Set: 중복 없는 집합 (같은 태그가 여러 번 매칭돼도 한 번만 저장)
  let bestCategory = null
  let bestScore = 0

  for (const category of categories) {
    const hits = category.keywords.filter(kw => text.includes(kw))  // 매칭된 키워드 목록
    if (hits.length > 0) {
      hits.forEach(kw => matchedTags.add(kw))
      // 더 많은 키워드가 매칭된 카테고리를 주 카테고리로 선정
      if (hits.length > bestScore) {
        bestScore = hits.length
        bestCategory = category.slug
      }
    }
  }

  return {
    ...article,               // 기존 필드 전부 유지 (스프레드 연산자)
    tags: [...matchedTags],   // Set을 배열로 변환
    categorySlug: bestCategory ?? 'general',  // 아무 카테고리도 매칭 안 되면 'general'
  }
}

module.exports = { tag }
