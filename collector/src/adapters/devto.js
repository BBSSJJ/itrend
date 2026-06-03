/**
 * Dev.to 공식 REST API 어댑터.
 *
 * Dev.to는 개발자 커뮤니티 플랫폼으로 개인 경험 글, 튜토리얼이 많다.
 * 인증 없이 사용 가능한 공개 API를 제공한다.
 *
 * API 문서: https://developers.forem.com/api
 */
const axios = require('axios')
const BaseAdapter = require('./base')

class DevToAdapter extends BaseAdapter {
  async fetch() {
    const { data } = await axios.get('https://dev.to/api/articles', {
      params: {
        per_page: this.source.config?.limit || 30,  // 한 번에 가져올 수
        tag: this.source.config?.tag || null,        // 특정 태그만 필터링 (없으면 전체)
      },
    })

    // RSS와 동일하게 lastFetched 이후 발행된 것만 필터링
    const since = this.state.lastFetched ? new Date(this.state.lastFetched) : null
    const items = since
      ? data.filter(item => new Date(item.published_at) > since)
      : data

    return items.map(item => this.normalize(item))
  }

  normalize(item) {
    return {
      title: item.title?.trim(),
      url: item.url,
      description: item.description || null,
      author: item.user?.name || null,  // user 객체 안에 name이 있음. user가 null이면 undefined 대신 null
      publishedAt: new Date(item.published_at),
      sourceId: this.source.id,
    }
  }
}

module.exports = DevToAdapter
