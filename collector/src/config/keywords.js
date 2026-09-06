const CANONICAL_TAGS = require('../../../config/canonical-tags.json')

// 동의어 → canonical 형태로 정규화
const SYNONYMS = {
  // LLM
  'llms': 'llm',
  'large-language-model': 'llm',
  'large-language-models': 'llm',
  // Node.js
  'node': 'node.js',
  'nodejs': 'node.js',
  'node-js': 'node.js',
  // Kubernetes
  'k8s': 'kubernetes',
  // PostgreSQL
  'postgres': 'postgresql',
  // Spring Boot
  'springboot': 'spring-boot',
  // React
  'reactjs': 'react',
  'react.js': 'react',
  // Next.js
  'next.js': 'nextjs',
  // Vue
  'vue.js': 'vue',
  'vuejs': 'vue',
  // Tailwind
  'tailwindcss': 'tailwind',
  // Go
  'golang': 'go',
  // Ruby on Rails
  'rails': 'ruby-on-rails',
  // Machine Learning
  'ml': 'machine-learning',
  // Deep Learning
  'dl': 'deep-learning',
  // Natural Language Processing
  'natural-language-processing': 'nlp',
  // REST API
  'rest': 'rest-api',
  'restful': 'rest-api',
  'restful-api': 'rest-api',
  // CI/CD
  'cicd': 'ci-cd',
  'ci/cd': 'ci-cd',
  // Microservices
  'microservice': 'microservices',
  'msa': 'microservices',
  // Generative AI
  'genai': 'generative-ai',
  'gen-ai': 'generative-ai',
  // WebAssembly
  'wasm': 'webassembly',
  // OpenAI
  'open-ai': 'openai',
  // Fine-tuning
  'fine-tune': 'fine-tuning',
  // Retrieval-Augmented Generation
  'retrieval-augmented-generation': 'rag',
  // Hugging Face
  'hugging-face': 'huggingface',
  // DDD
  'domain-driven-design': 'ddd',
  // TDD
  'test-driven-development': 'tdd',
  // Vector DB
  'vector-db': 'vector-database',
  'vector-store': 'vector-database',
  // Elasticsearch
  'elastic': 'elasticsearch',
  // ChatGPT
  'chat-gpt': 'gpt',
  'chatgpt': 'gpt',
  // Embeddings
  'embeddings': 'embedding',
  // WebSocket
  'websockets': 'websocket',
  // Swagger
  'swagger': 'openapi',
  // GitHub Actions
  'github-action': 'github-actions',
  // OAuth
  'oauth': 'oauth2',
  // SvelteKit
  'sveltekit': 'svelte',
  // TypeScript
  'ts': 'typescript',
  // JavaScript
  'js': 'javascript',
  // Digital Transformation
  'dx': 'digital-transformation',
  // AI Strategy
  'ax': 'ai-strategy',
  // AI Agent
  'agentic-ai': 'ai-agent',
  'llm-agent': 'ai-agent',
  // UX
  'ui/ux': 'ux',
  'user-experience': 'ux',
  // Data Science
  'data-engineering': 'data-pipeline',
  // Flink
  'apache flink': 'apache-flink',
  // Post-mortem
  'postmortem': 'post-mortem',
  // Code Quality
  'code-review': 'code-quality',
  // Testing
  'unit-testing': 'testing',
  'integration-testing': 'testing',
  'e2e-testing': 'testing',
}

// 기사 본문에서 직접 찾아도 오탐 가능성이 낮은 별칭만 선태깅에 사용한다.
// `go`, `spring`, `agent`, `ml`, `js`처럼 일반 문장에서도 자주 등장하는 짧은
// 표현은 의도적으로 제외하고 더 구체적인 표기만 허용한다.
const HIGH_CONFIDENCE_ALIASES = {
  kafka: 'kafka',
  kubernetes: 'kubernetes',
  grafana: 'grafana',
  prometheus: 'prometheus',
  opentelemetry: 'opentelemetry',
  airflow: 'airflow',
  hadoop: 'hadoop',
  redis: 'redis',
  btrfs: 'btrfs',
  android: 'android',
  cli: 'cli',
  sdk: 'sdk',
  llm: 'llm',
  llms: 'llm',
  'large language model': 'llm',
  'large language models': 'llm',
  nodejs: 'node.js',
  'node-js': 'node.js',
  k8s: 'kubernetes',
  '쿠버네티스': 'kubernetes',
  postgres: 'postgresql',
  '포스트그레스': 'postgresql',
  postgresql: 'postgresql',
  springboot: 'spring-boot',
  'spring boot': 'spring-boot',
  '스프링 부트': 'spring-boot',
  'spring-boot': 'spring-boot',
  reactjs: 'react',
  'react.js': 'react',
  '리액트': 'react',
  react: 'react',
  'next.js': 'nextjs',
  nextjs: 'nextjs',
  'vue.js': 'vue',
  vuejs: 'vue',
  vue: 'vue',
  tailwindcss: 'tailwind',
  golang: 'go',
  '생성형 ai': 'generative-ai',
  genai: 'generative-ai',
  'retrieval augmented generation': 'rag',
  '검색 증강 생성': 'rag',
  rag: 'rag',
  'hugging face': 'huggingface',
  huggingface: 'huggingface',
  'domain driven design': 'ddd',
  '도메인 주도 설계': 'ddd',
  ddd: 'ddd',
  'test driven development': 'tdd',
  '테스트 주도 개발': 'tdd',
  tdd: 'tdd',
  'vector db': 'vector-database',
  'vector store': 'vector-database',
  '벡터 데이터베이스': 'vector-database',
  'vector-database': 'vector-database',
  chatgpt: 'gpt',
  'chat-gpt': 'gpt',
  gpt: 'gpt',
  websockets: 'websocket',
  websocket: 'websocket',
  swagger: 'openapi',
  openapi: 'openapi',
  'github action': 'github-actions',
  'github actions': 'github-actions',
  'github-actions': 'github-actions',
  sveltekit: 'svelte',
  svelte: 'svelte',
  'apache flink': 'apache-flink',
  'apache-flink': 'apache-flink',
  postmortem: 'post-mortem',
  'post-mortem': 'post-mortem',
  'unit testing': 'testing',
  'integration testing': 'testing',
  'e2e testing': 'testing',
  '단위 테스트': 'testing',
  '통합 테스트': 'testing',
  'ai agent': 'ai-agent',
  'ai agents': 'ai-agent',
  'ai 에이전트': 'ai-agent',
  '인공지능 에이전트': 'ai-agent',
  '코딩 에이전트': 'ai-agent',
  'llm agent': 'ai-agent',
  'llm agents': 'ai-agent',
  'llm 에이전트': 'ai-agent',
  'agentic ai': 'ai-agent',
  '에이전틱 ai': 'ai-agent',
  'ai-agent': 'ai-agent',
  '관측성': 'observability',
  observability: 'observability',
  monorepo: 'monorepo',
  'mono repo': 'monorepo',
  '모노리포': 'monorepo',
  '모노 리포': 'monorepo',
  'optimistic locking': 'optimistic-locking',
  'optimistic-locking': 'optimistic-locking',
  '낙관적 락': 'optimistic-locking',
  '낙관적 잠금': 'optimistic-locking',
  'load balancer': 'load-balancing',
  'load balancing': 'load-balancing',
  'load-balancing': 'load-balancing',
  '로드 밸런서': 'load-balancing',
  '로드밸런서': 'load-balancing',
  '로드 밸런싱': 'load-balancing',
  '부하 분산': 'load-balancing',
}

module.exports = { CANONICAL_TAGS, SYNONYMS, HIGH_CONFIDENCE_ALIASES }
