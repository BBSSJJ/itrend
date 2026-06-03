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
        {article.categoryName && (
          <span className={styles.category}>{article.categoryName}</span>
        )}
        <span className={styles.date}>
          {formatDate(article.publishedAt ?? article.createdAt)}
        </span>
      </div>
      <h2 className={styles.title}>{article.title}</h2>
      {article.description && (
        <p className={styles.description}>{article.description}</p>
      )}
      <div className={styles.footer}>
        {article.author && (
          <span className={styles.author}>{article.author}</span>
        )}
        {article.tags.length > 0 && (
          <ul className={styles.tags}>
            {article.tags.map((tag) => (
              <li key={tag} className={styles.tag}>
                {tag}
              </li>
            ))}
          </ul>
        )}
      </div>
    </a>
  )
}
