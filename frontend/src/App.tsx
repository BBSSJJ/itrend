import { useEffect, useState } from 'react'
import { fetchArticles } from './api/articles'
import CategoryFilter from './components/CategoryFilter'
import ArticleCard from './components/ArticleCard'
import type { Article, Page } from './types/article'
import './App.css'

export default function App() {
  const [categorySlug, setCategorySlug] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [data, setData] = useState<Page<Article> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchArticles(page, categorySlug)
      .then(setData)
      .catch(() => setError('기사를 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [page, categorySlug])

  function handleCategoryChange(slug: string | null) {
    setCategorySlug(slug)
    setPage(0)
  }

  return (
    <div className="layout">
      <header className="header">
        <h1 className="logo">ITrend</h1>
        <p className="tagline">IT 최신 뉴스 & 인사이트</p>
      </header>

      <main className="main">
        <CategoryFilter selected={categorySlug} onChange={handleCategoryChange} />

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
              <div className="pagination">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  이전
                </button>
                <span>
                  {page + 1} / {data.totalPages}
                </span>
                <button
                  disabled={data.last}
                  onClick={() => setPage((p) => p + 1)}
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
