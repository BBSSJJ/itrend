export interface Article {
  id: number
  title: string
  url: string
  description: string | null
  author: string | null
  publishedAt: string | null
  createdAt: string
  categoryName: string | null
  categorySlug: string | null
  tags: string[]
}

export interface Page<T> {
  content: T[]
  totalPages: number
  totalElements: number
  number: number
  size: number
  last: boolean
}

export const CATEGORIES = [
  { name: '전체', slug: null },
  { name: 'Frontend', slug: 'frontend' },
  { name: 'Backend', slug: 'backend' },
  { name: 'Cloud', slug: 'cloud' },
  { name: 'DevOps', slug: 'devops' },
  { name: 'AI/ML', slug: 'ai' },
  { name: 'Architecture', slug: 'architecture' },
  { name: 'General', slug: 'general' },
] as const
