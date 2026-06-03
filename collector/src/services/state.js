/**
 * 수집기의 상태(마지막 수집 시점)를 파일로 관리하는 서비스.
 *
 * state.json 구조 예시:
 * {
 *   "yozm":        { "lastFetched": "2026-06-01T18:00:00Z" },
 *   "hackernews":  { "lastFetched": "2026-06-01T18:00:00Z", "lastItemId": 41234567 },
 *   "devto":       { "lastFetched": "2026-06-01T18:00:00Z" }
 * }
 *
 * 역할: Spring Boot가 없어도 Node.js 혼자서 중복 수집을 1차로 방지한다.
 * Spring Boot의 URL unique 제약은 혹시 모를 경우를 대비한 2차 안전망이다.
 */
const fs = require('fs')    // Node.js 내장 모듈: 파일 읽기/쓰기 (별도 설치 불필요)
const path = require('path')  // Node.js 내장 모듈: 경로 처리 (OS별 경로 구분자 차이 자동 처리)

// __dirname: 현재 파일이 위치한 디렉토리의 절대 경로 (Node.js 내장 변수)
// path.join으로 조합하면 어떤 OS에서도 올바른 경로가 만들어진다
const STATE_FILE = path.join(__dirname, '../../state.json')

// 파일에서 전체 state 읽기. 파일이 없으면 빈 객체 반환
function _load() {
  if (!fs.existsSync(STATE_FILE)) return {}
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'))
}

// 특정 소스의 state만 꺼냄. 없으면 빈 객체 반환
function get(sourceId) {
  return _load()[sourceId] || {}
}

// 특정 소스의 state를 업데이트하고 파일에 저장
function update(sourceId, data) {
  const all = _load()
  // 스프레드 연산자(...): 기존 값을 유지하면서 새 값으로 덮어씀
  // Java로 치면: map.putAll(data)와 유사하지만 새 객체를 만든다
  all[sourceId] = { ...all[sourceId], ...data }
  fs.writeFileSync(STATE_FILE, JSON.stringify(all, null, 2))  // null, 2: 들여쓰기 2칸으로 예쁘게 저장
}

module.exports = { get, update }
