export interface Article {
  id: number
  title: string
  url: string
  description: string | null
  author: string | null
  publishedAt: string | null
  createdAt: string
  sourceCode: string
  sourceName: string
  summary: string | null
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
