type RowProps = {
  children: React.ReactNode
  gap?: string
  align?: string
}

function Row({ children, gap = 'zero', align = 'stretch' }: RowProps) {
  return (
    <div className={`flex flex-row gap-${gap} items-${align}`}>{children}</div>
  )
}

export { Row }
