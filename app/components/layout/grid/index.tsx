import styles from './grid.module.css'

type GridProps = {
  className?: string
  children: React.ReactNode
  gap?: string
}

function Grid({ children, gap = 'zero', className = '' }: GridProps) {
  return (
    <div className={`${className} grid gap-${gap} ${styles.grid}`.trim()}>
      {children}
    </div>
  )
}

export { Grid }
