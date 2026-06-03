import type { Article } from '../types/article'
import styles from './ArticleCard.module.css'

interface Props {
  article: Article
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function ArticleCard({ article }: Props) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.card}
    >
      <div className={styles.meta}>
        <span className={styles.date}>
          {formatDate(article.publishedAt ?? article.createdAt)}
        </span>
        {article.author && (
          <span className={styles.author}>{article.author}</span>
        )}
      </div>
      <h2 className={styles.title}>{article.title}</h2>
      {article.description && (
        <p className={styles.description}>{article.description}</p>
      )}
      {article.tags.length > 0 && (
        <ul className={styles.tags}>
          {article.tags.map((tag) => (
            <li key={tag} className={styles.tag}>#{tag}</li>
          ))}
        </ul>
      )}
    </a>
  )
}
