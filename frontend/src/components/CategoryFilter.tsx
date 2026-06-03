import { CATEGORIES } from '../types/article'
import styles from './CategoryFilter.module.css'

interface Props {
  selected: string | null
  onChange: (slug: string | null) => void
}

export default function CategoryFilter({ selected, onChange }: Props) {
  return (
    <nav className={styles.filter}>
      {CATEGORIES.map((cat) => (
        <button
          key={cat.slug ?? 'all'}
          className={`${styles.btn} ${selected === cat.slug ? styles.active : ''}`}
          onClick={() => onChange(cat.slug)}
        >
          {cat.name}
        </button>
      ))}
    </nav>
  )
}
