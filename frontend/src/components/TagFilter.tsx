import styles from './TagFilter.module.css'

interface Props {
  tags: string[]
  selected: string | null
  onChange: (tag: string | null) => void
}

export default function TagFilter({ tags, selected, onChange }: Props) {
  return (
    <nav className={styles.filter}>
      <button
        className={`${styles.btn} ${selected === null ? styles.active : ''}`}
        onClick={() => onChange(null)}
      >
        전체
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          className={`${styles.btn} ${selected === tag ? styles.active : ''}`}
          onClick={() => onChange(tag)}
        >
          #{tag}
        </button>
      ))}
    </nav>
  )
}
