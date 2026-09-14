const sources = require('./config/sources')
const RssAdapter = require('./adapters/rss')
const HackerNewsAdapter = require('./adapters/hackernews')
const DevToAdapter = require('./adapters/devto')
const { send } = require('./services/sender')
const state = require('./services/state')

const ADAPTERS = {
  rss: RssAdapter,
  hn_api: HackerNewsAdapter,
  devto_api: DevToAdapter,
}

async function collectOne(source, remainingLimit) {
  const AdapterClass = ADAPTERS[source.adapterType]
  if (!AdapterClass) {
    console.warn(`[SKIP] 알 수 없는 어댑터: ${source.adapterType} (${source.name})`)
    return { count: 0, ids: [], error: null }
  }

  const sourceState = state.get(source.id)
  const lastFetched = sourceState.lastFetched
    ? new Date(sourceState.lastFetched).toLocaleString('ko-KR')
    : '처음 수집'
  console.log(`  이전 수집: ${lastFetched}`)

  try {
    const articles = await new AdapterClass(source, sourceState).fetch()

    if (articles.length === 0) {
      console.log(`  새 항목 없음`)
      return { count: 0, ids: [], error: null }
    }

    const candidates = remainingLimit === undefined ? articles : articles.slice(0, remainingLimit)
    const result = await send(candidates, remainingLimit)

    const stateUpdate = { lastFetched: new Date().toISOString() }
    if (source.adapterType === 'hn_api') {
      const maxId = Math.max(...articles.map(a => a._hnId || 0))
      if (maxId > 0) stateUpdate.lastItemId = maxId
    }
    if (remainingLimit === undefined) state.update(source.id, stateUpdate)

    return { count: result.savedIds?.length ?? candidates.length, ids: result.savedIds ?? [], error: null }
  } catch (err) {
    return { count: 0, ids: [], error: err.message }
  }
}

async function collect({ limit } = {}) {
  const active = sources.filter(s => s.isActive)
  console.log(`\n[COLLECT] ${active.length}개 소스 수집 시작\n`)

  const savedIds = []
  for (const source of active) {
    console.log(`[FETCH] ${source.name}...`)
    const remaining = limit === undefined ? undefined : limit - savedIds.length
    if (remaining !== undefined && remaining <= 0) break
    const result = await collectOne(source, remaining)
    savedIds.push(...result.ids)

    if (result.error) {
      console.error(`  [ERROR] ${result.error}`)
    } else {
      console.log(`  [OK] ${result.count}개 수집됨`)
    }
  }

  console.log(`\n[COLLECT] 완료 (신규 저장 ${savedIds.length}개)\n`)
  return savedIds
}

module.exports = { collect }
