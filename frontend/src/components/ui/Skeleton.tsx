import styles from './skeleton.module.css'

export default function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`${styles.skeleton} ${className || ''}`} style={style} />
}
