// 카테고리 추가 시 여기에만 추가하면 됨
// keywords는 소문자로, 아티클 제목+설명과 매칭됨
module.exports = [
  {
    name: 'Frontend',
    slug: 'frontend',
    keywords: [
      'react', 'vue', 'angular', 'svelte', 'nextjs', 'next.js',
      'css', 'html', 'javascript', 'typescript', 'webpack', 'vite',
      'tailwind', 'ui', 'ux', 'frontend', 'front-end',
    ],
  },
  {
    name: 'Backend',
    slug: 'backend',
    keywords: [
      'spring', 'spring boot', 'springboot', 'java',
      'node', 'nodejs', 'node.js', 'express', 'nestjs',
      'django', 'fastapi', 'flask', 'python',
      'go', 'golang', 'rust', 'php',
      'api', 'rest', 'graphql', 'grpc', 'backend', 'back-end',
      'microservice', 'msa',
    ],
  },
  {
    name: 'Cloud',
    slug: 'cloud',
    keywords: [
      'aws', 'gcp', 'azure', 'cloud',
      'kubernetes', 'k8s', 'docker', 'container',
      'terraform', 'helm', 'serverless', 'lambda',
      'eks', 'ecs', 'gke', 'aks',
    ],
  },
  {
    name: 'DevOps',
    slug: 'devops',
    keywords: [
      'devops', 'ci/cd', 'cicd', 'github actions', 'jenkins',
      'ansible', 'argocd', 'gitops',
      'monitoring', 'grafana', 'prometheus', 'datadog',
      'nginx', 'linux', 'infra', 'infrastructure',
    ],
  },
  {
    name: 'AI/ML',
    slug: 'ai',
    keywords: [
      'ai', 'ml', 'llm', 'gpt', 'claude', 'gemini',
      'machine learning', 'deep learning', 'nlp',
      'pytorch', 'tensorflow', 'langchain', 'rag',
      'generative ai', 'chatgpt',
    ],
  },
  {
    name: 'Architecture',
    slug: 'architecture',
    keywords: [
      'architecture', 'design pattern', 'ddd', 'domain driven',
      'event driven', 'cqrs', 'event sourcing', 'clean architecture',
      'hexagonal', 'solid', 'refactor', 'technical debt',
    ],
  },
]
