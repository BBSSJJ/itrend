// LLM에게 넘기는 canonical 태그 목록이자 키워드 태거의 매칭 사전
const CANONICAL_TAGS = [
  // ── Frontend ──────────────────────────────────────────────
  'react', 'vue', 'angular', 'svelte', 'nextjs', 'nuxt', 'remix', 'astro',
  'javascript', 'typescript', 'html', 'css',
  'tailwind', 'bootstrap', 'material-ui', 'shadcn',
  'webpack', 'vite', 'rollup', 'esbuild', 'turbopack',
  'redux', 'zustand', 'recoil', 'pinia', 'mobx',
  'jest', 'vitest', 'cypress', 'playwright', 'storybook',

  // ── Backend frameworks ─────────────────────────────────────
  'java', 'kotlin',
  'spring-boot', 'spring', 'spring-security', 'spring-cloud', 'quarkus', 'micronaut',
  'node.js', 'express', 'nestjs', 'fastify', 'hapi',
  'python', 'django', 'fastapi', 'flask',
  'go', 'gin', 'echo', 'fiber',
  'rust', 'actix', 'axum', 'tokio',
  'ruby', 'ruby-on-rails',
  'php', 'laravel', 'symfony',
  'elixir', 'phoenix',
  'scala', 'haskell', 'clojure',

  // ── Databases ──────────────────────────────────────────────
  'postgresql', 'mysql', 'mariadb', 'sqlite', 'oracle', 'mssql',
  'mongodb', 'cassandra', 'dynamodb', 'couchdb', 'firestore',
  'redis', 'memcached',
  'elasticsearch', 'opensearch', 'solr', 'meilisearch',
  'influxdb', 'timescaledb',
  'neo4j',
  'pinecone', 'weaviate', 'qdrant', 'chroma', 'pgvector',
  'cockroachdb', 'tidb', 'planetscale', 'neon',
  'jpa', 'hibernate', 'prisma', 'sequelize', 'typeorm', 'drizzle', 'sqlalchemy',

  // ── Messaging / Streaming ──────────────────────────────────
  'kafka', 'rabbitmq', 'activemq', 'nats', 'pulsar', 'sqs', 'pubsub',

  // ── Cloud ──────────────────────────────────────────────────
  'aws', 'gcp', 'azure',
  'ec2', 's3', 'lambda', 'ecs', 'eks', 'rds', 'cloudfront', 'api-gateway', 'cloudwatch',
  'cloud-run', 'bigquery', 'gke',
  'azure-functions', 'aks', 'cosmos-db',
  'serverless', 'vercel', 'netlify', 'cloudflare',

  // ── Infrastructure / DevOps ─────────────────────────────────
  'docker', 'kubernetes', 'containerd', 'podman', 'helm',
  'terraform', 'pulumi', 'ansible', 'chef', 'puppet',
  'istio', 'linkerd', 'envoy',
  'github-actions', 'gitlab-ci', 'jenkins', 'circleci', 'argocd', 'tekton',
  'grafana', 'prometheus', 'datadog', 'new-relic', 'opentelemetry', 'jaeger',
  'nginx', 'apache', 'traefik', 'haproxy',
  'linux', 'ubuntu', 'alpine',
  'ci-cd', 'gitops',

  // ── AI / ML ────────────────────────────────────────────────
  'llm', 'machine-learning', 'deep-learning', 'nlp', 'computer-vision',
  'reinforcement-learning', 'generative-ai', 'rag', 'fine-tuning', 'embedding',
  'gpt', 'claude', 'gemini', 'llama', 'mistral',
  'openai', 'anthropic', 'huggingface',
  'pytorch', 'tensorflow', 'keras', 'jax',
  'langchain', 'llamaindex',
  'vector-database', 'mcp',

  // ── Architecture / Patterns ────────────────────────────────
  'microservices', 'monolith', 'event-driven', 'cqrs', 'event-sourcing',
  'ddd', 'clean-architecture', 'hexagonal-architecture', 'solid', 'tdd', 'bdd',
  'rest-api', 'graphql', 'grpc', 'websocket', 'webhook', 'openapi',

  // ── Security ──────────────────────────────────────────────
  'oauth2', 'jwt', 'ssl-tls', 'zero-trust', 'sso', 'saml', 'keycloak',

  // ── Tools / Other ─────────────────────────────────────────
  'git', 'github', 'gitlab', 'webassembly',
]

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
  // Vercel
  // TypeScript
  'ts': 'typescript',
  // JavaScript
  'js': 'javascript',
}

module.exports = { CANONICAL_TAGS, SYNONYMS }
