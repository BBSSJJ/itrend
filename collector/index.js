/**
 * 수집기 진입점 (Entry Point).
 *
 * `node index.js`로 실행하면:
 *   1. .env 파일의 환경변수를 process.env에 로드 (BE_API_URL, COLLECTOR_API_KEY 등)
 *   2. 스케줄러 등록 (08:00, 18:00 자동 실행)
 *   3. 시작 즉시 1회 수집 실행 (서버 재시작 후 최신 데이터를 바로 채우기 위함)
 */
require('dotenv').config()          // .env 파일 로드. 반드시 다른 require보다 먼저 실행
const { collect } = require('./src/collector')
require('./src/scheduler')          // require만 해도 스케줄러가 등록됨

collect()
