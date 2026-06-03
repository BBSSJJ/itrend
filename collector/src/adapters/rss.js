/**
 * RSS 피드를 파싱하는 어댑터.
 *
 * RSS는 XML 기반의 표준 피드 포맷이다. 대부분의 기술 블로그가 제공한다.
 * rss-parser 라이브러리가 XML 파싱을 처리해주므로 우리는 데이터 추출에만 집중한다.
 *
 * 이 어댑터 하나로 sources.js에 등록된 모든 RSS 소스를 처리할 수 있다.
 * 소스마다 별도 어댑터를 만들 필요 없음.
 */
const Parser = require('rss-parser')  // rss-parser: RSS/Atom XML을 JS 객체로 변환해주는 라이브러리
const BaseAdapter = require('./base')

// Parser 인스턴스는 한 번만 생성해서 재사용 (매 요청마다 생성하면 비효율적)
const parser = new Parser({
  headers: {
    // 일부 서버는 봇 요청을 차단함. 브라우저처럼 보이게 헤더를 설정
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml',
  },
})

class RssAdapter extends BaseAdapter {
  async fetch() {
    // parseURL: URL에서 RSS XML을 내려받아 JS 객체로 파싱
    const feed = await parser.parseURL(this.source.url)

    // state.lastFetched가 있으면 그 이후 발행된 것만 필터링 (중복 수집 방지)
    const since = this.state.lastFetched ? new Date(this.state.lastFetched) : null
    const items = since
      ? feed.items.filter(item => item.pubDate && new Date(item.pubDate) > since)
      : feed.items  // 처음 수집이면 전체 가져옴

    return items.map(item => this.normalize(item))
  }

  /**
   * RSS item을 공통 Article 형태로 변환.
   * 소스마다 필드명이 다를 수 있어서 여러 후보를 시도한다.
   */
  normalize(item) {
    return {
      title: item.title?.trim(),                        // ?. : null-safe 접근 (Java의 Optional과 유사)
      url: item.link,
      description: item.contentSnippet || item.summary || null,  // 있는 것 중 첫 번째 사용
      author: item.creator || null,
      publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      sourceId: this.source.id,
    }
  }
}

module.exports = RssAdapter
