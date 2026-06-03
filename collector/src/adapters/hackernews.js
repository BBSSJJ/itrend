/**
 * Hacker News 공식 API 어댑터.
 *
 * HN API 구조:
 *   1. /topstories.json → 상위 500개 스토리의 ID 배열 반환
 *   2. /item/{id}.json  → 개별 스토리 상세 정보 반환
 *
 * 중복 방지 전략: RSS처럼 날짜가 아닌 "마지막으로 수집한 item ID"를 기준으로 삼는다.
 * HN item ID는 단조 증가하므로 lastItemId보다 큰 것만 가져오면 새 항목만 수집된다.
 */
const axios = require('axios')  // axios: HTTP 요청 라이브러리 (Java의 RestTemplate과 유사)
const BaseAdapter = require('./base')

const HN_API = 'https://hacker-news.firebaseio.com/v0'

class HackerNewsAdapter extends BaseAdapter {
  async fetch() {
    const { data: ids } = await axios.get(`${HN_API}/topstories.json`)
    // { data: ids } 는 구조 분해 할당. axios 응답에서 data 필드만 꺼내 ids로 명명
    // Java로 치면: List<Long> ids = response.getData();

    const limit = this.source.config?.limit || 30
    const lastItemId = this.state.lastItemId || 0  // 처음 수집이면 0 (전부 가져옴)

    // lastItemId 이후 것만 필터링, 최대 limit개
    const newIds = ids.filter(id => id > lastItemId).slice(0, limit)
    if (newIds.length === 0) return []

    // Promise.all: 여러 비동기 요청을 동시에 실행 (Java의 CompletableFuture.allOf와 유사)
    // 순차 실행보다 훨씬 빠름
    const items = await Promise.all(
      newIds.map(id =>
        axios.get(`${HN_API}/item/${id}.json`)
          .then(r => r.data)
          .catch(() => null)  // 개별 요청 실패 시 null 반환 (전체 중단 방지)
      )
    )

    return items
      .filter(item => item && item.url)  // null이거나 url 없는 항목 제외 (텍스트 전용 게시물)
      .map(item => this.normalize(item))
  }

  normalize(item) {
    return {
      title: item.title?.trim(),
      url: item.url,
      description: null,  // HN API는 본문 요약을 제공하지 않음
      author: item.by || null,
      publishedAt: new Date(item.time * 1000),  // HN은 Unix timestamp(초) 사용. JS Date는 밀리초 기준이라 *1000
      sourceId: this.source.id,
      _hnId: item.id,  // _ prefix: 내부용 필드 (Spring Boot로 전송 시 제외해야 함)
    }
  }

  // collector.js에서 수집 후 최대 ID를 state에 저장할 때 사용
  static extractMaxId(articles) {
    return articles.reduce((max, a) => Math.max(max, a._hnId || 0), 0)
  }
}

module.exports = HackerNewsAdapter
