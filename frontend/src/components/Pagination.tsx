import styles from './Pagination.module.css'

interface Props {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

const PAGE_GROUP_SIZE = 5

export default function Pagination({ currentPage, totalPages, onPageChange }: Props) {
  const groupStart = Math.floor(currentPage / PAGE_GROUP_SIZE) * PAGE_GROUP_SIZE
  const groupEnd = Math.min(groupStart + PAGE_GROUP_SIZE, totalPages)
  const pages = Array.from(
    { length: groupEnd - groupStart },
    (_, index) => groupStart + index,
  )

  const hasPreviousGroup = groupStart > 0
  const hasNextGroup = groupEnd < totalPages

  return (
    <nav className={styles.pagination} aria-label="기사 목록 페이지 이동">
      <button
        type="button"
        className={styles.button}
        disabled={!hasPreviousGroup}
        onClick={() => onPageChange(groupStart - 1)}
        aria-label="이전 페이지 묶음"
        title="이전 페이지 묶음"
      >
        «
      </button>
      <button
        type="button"
        className={styles.button}
        disabled={currentPage === 0}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="이전 페이지"
        title="이전 페이지"
      >
        ‹
      </button>

      {pages.map((page) => {
        const isCurrent = page === currentPage

        return (
          <button
            type="button"
            key={page}
            className={[styles.button, isCurrent ? styles.active : ''].filter(Boolean).join(' ')}
            onClick={() => {
              if (!isCurrent) onPageChange(page)
            }}
            aria-current={isCurrent ? 'page' : undefined}
            aria-label={String(page + 1) + '페이지' + (isCurrent ? ', 현재 페이지' : '')}
          >
            {page + 1}
          </button>
        )
      })}

      <button
        type="button"
        className={styles.button}
        disabled={currentPage === totalPages - 1}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="다음 페이지"
        title="다음 페이지"
      >
        ›
      </button>
      <button
        type="button"
        className={styles.button}
        disabled={!hasNextGroup}
        onClick={() => onPageChange(groupEnd)}
        aria-label="다음 페이지 묶음"
        title="다음 페이지 묶음"
      >
        »
      </button>
    </nav>
  )
}
