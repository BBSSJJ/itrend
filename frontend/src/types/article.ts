export interface Article {
  id: number
  title: string
  url: string
  description: string | null
  author: string | null
  publishedAt: string | null
  createdAt: string
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
