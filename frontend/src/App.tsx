import { useEffect, useState } from 'react'
import { fetchArticles, fetchPopularTags } from './api/articles'
import TagFilter from './components/TagFilter'
import ArticleCard from './components/ArticleCard'
import Pagination from './components/Pagination'
import type { Article, Page } from './types/article'
import './App.css'

export default function App() {
  const [tag, setTag] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [data, setData] = useState<Page<Article> | null>(null)
  const [popularTags, setPopularTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPopularTags().then(setPopularTags).catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false

    fetchArticles(page, tag)
      .then((nextData) => {
        if (!cancelled) setData(nextData)
      })
      .catch(() => {
        if (!cancelled) setError('기사를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page, tag])

  function handleTagChange(t: string | null) {
    if (t === tag) return
    setLoading(true)
    setError(null)
    setTag(t)
    setPage(0)
  }

  function handlePageChange(nextPage: number) {
    setLoading(true)
    setError(null)
    setPage(nextPage)
  }

  return (
    <div className="layout">
      <header className="header">
        <h1 className="logo">ITrend</h1>
        <p className="tagline">IT 최신 뉴스 & 인사이트</p>
      </header>

      <main className="main">
        <TagFilter tags={popularTags} selected={tag} onChange={handleTagChange} />

        {loading && <p className="status">불러오는 중...</p>}
        {error && <p className="status error">{error}</p>}

        {data && !loading && (
          <>
            <p className="count">총 {data.totalElements.toLocaleString()}개</p>
            <div className="grid">
              {data.content.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            {data.totalPages > 1 && (
              <Pagination
                currentPage={data.number}
                totalPages={data.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}
