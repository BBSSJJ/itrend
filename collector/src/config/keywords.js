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

module.exports = { CANONICAL_TAGS, SYNONYMS }
