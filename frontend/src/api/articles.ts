import type { Article, Page } from '../types/article'

export async function fetchArticles(
  page: number,
  categorySlug: string | null
): Promise<Page<Article>> {
  const params = new URLSearchParams({ page: String(page), size: '20' })
  if (categorySlug) params.set('categorySlug', categorySlug)

  const res = await fetch(`/api/articles?${params}`)
  if (!res.ok) throw new Error('Failed to fetch articles')
  return res.json()
}
