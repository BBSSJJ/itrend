import type { Article, Page } from '../types/article'

export async function fetchArticles(page: number, tag: string | null): Promise<Page<Article>> {
  const params = new URLSearchParams({ page: String(page), size: '20' })
  if (tag) params.set('tag', tag)

  const res = await fetch(`/api/articles?${params}`)
  if (!res.ok) throw new Error('Failed to fetch articles')
  return res.json()
}

export async function fetchPopularTags(limit = 15): Promise<string[]> {
  const res = await fetch(`/api/tags/popular?limit=${limit}`)
  if (!res.ok) throw new Error('Failed to fetch tags')
  return res.json()
}
