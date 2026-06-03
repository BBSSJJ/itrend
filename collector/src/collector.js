/**
 * 수집기의 핵심 로직.
 *
 * collect() 함수가 모든 활성 소스를 순회하며 수집을 실행한다.
 * 각 소스의 어댑터 종류를 ADAPTERS 맵으로 관리해서,
 * 새 어댑터 추가 시 이 파일의 ADAPTERS에 한 줄만 추가하면 된다.
 */
const sources = require('./config/sources')
const RssAdapter = require('./adapters/rss')
const HackerNewsAdapter = require('./adapters/hackernews')
const DevToAdapter = require('./adapters/devto')
const { tagBatch } = require('./services/tagger')
const { send } = require('./services/sender')
const state = require('./services/state')

// adapterType(문자열) → 클래스 매핑
// 새 어댑터 추가 시 여기에 한 줄 추가
const ADAPTERS = {
  rss: RssAdapter,
  hn_api: HackerNewsAdapter,
  devto_api: DevToAdapter,
}

/**
 * 소스 하나를 수집한다.
 * 에러가 나도 throw하지 않고 error 필드로 반환 → 하나 실패해도 나머지 소스는 계속 진행
 */
async function collectOne(source) {
  const AdapterClass = ADAPTERS[source.adapterType]
  if (!AdapterClass) {
    console.warn(`[SKIP] 알 수 없는 어댑터: ${source.adapterType} (${source.name})`)
    return { count: 0, error: null }
  }

  // 이 소스의 마지막 수집 상태를 읽어서 어댑터에 전달
  const sourceState = state.get(source.id)
  const lastFetched = sourceState.lastFetched
    ? new Date(sourceState.lastFetched).toLocaleString('ko-KR')
    : '처음 수집'
  console.log(`  이전 수집: ${lastFetched}`)

  try {
    // 어댑터 생성 시 state를 주입 → 어댑터 내부에서 중복 필터링에 사용
    const articles = await new AdapterClass(source, sourceState).fetch()

    if (articles.length === 0) {
      console.log(`  새 항목 없음`)
      return { count: 0, error: null }
    }

    // 각 아티클에 태그와 카테고리 부여 (LLM 배치 호출)
    const tagged = await tagBatch(articles)

    // HN/Dev.to는 IT 외 콘텐츠가 많으므로 태그가 없는 기사(IT 무관) 제외
    const filtered = source.adapterType !== 'rss'
      ? tagged.filter(a => a.tags && a.tags.length > 0)
      : tagged

    if (filtered.length === 0) {
      console.log(`  새 항목 없음 (카테고리 필터 후)`)
      return { count: 0, error: null }
    }

    // Spring Boot로 전송 (현재는 개발 모드라 콘솔 출력)
    await send(filtered)

    // 수집 성공 후 state 업데이트
    const stateUpdate = { lastFetched: new Date().toISOString() }
    if (source.adapterType === 'hn_api') {
      // HN은 ID 기반 필터링이므로 최대 ID도 저장
      const maxId = Math.max(...articles.map(a => a._hnId || 0))
      if (maxId > 0) stateUpdate.lastItemId = maxId
    }
    state.update(source.id, stateUpdate)

    return { count: filtered.length, error: null }
  } catch (err) {
    return { count: 0, error: err.message }
  }
}

/**
 * 모든 활성 소스를 순차적으로 수집한다.
 * 병렬(Promise.all)로 실행하면 빠르지만 서버에 부하를 줄 수 있어 순차 실행을 선택.
 */
async function collect() {
  const active = sources.filter(s => s.isActive)
  console.log(`\n[COLLECT] ${active.length}개 소스 수집 시작\n`)

  for (const source of active) {
    console.log(`[FETCH] ${source.name}...`)
    const result = await collectOne(source)

    if (result.error) {
      console.error(`  [ERROR] ${result.error}`)
    } else {
      console.log(`  [OK] ${result.count}개 수집됨`)
    }
  }

  console.log('\n[COLLECT] 완료\n')
}

module.exports = { collect }
