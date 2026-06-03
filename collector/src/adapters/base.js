/**
 * 모든 어댑터의 부모 클래스.
 *
 * Java의 abstract class와 동일한 개념이다.
 * 각 소스(RSS, HN API, Dev.to 등)는 이 클래스를 상속받아
 * fetch()와 normalize()를 반드시 구현해야 한다.
 *
 * 이 패턴 덕분에 collector.js는 소스 종류를 몰라도 된다.
 * adapter.fetch()만 호출하면 항상 같은 형태의 Article 배열이 나온다.
 */
class BaseAdapter {
  /**
   * @param {object} source   - sources.js에 정의된 소스 설정 객체
   * @param {object} state    - state.json에서 읽어온 이 소스의 마지막 수집 상태
   *                            예: { lastFetched: "2026-06-01T18:00:00Z" }
   */
  constructor(source, state = {}) {
    this.source = source
    this.state = state
  }

  // 하위 클래스에서 반드시 구현. Article[] 반환
  async fetch() {
    throw new Error(`fetch() not implemented in ${this.constructor.name}`)
  }

  // 각 소스의 raw 데이터를 공통 Article 형태로 변환
  normalize(raw) {
    throw new Error(`normalize() not implemented in ${this.constructor.name}`)
  }
}

// Node.js에서 다른 파일이 이 클래스를 사용할 수 있도록 내보냄 (Java의 public class와 유사)
module.exports = BaseAdapter
