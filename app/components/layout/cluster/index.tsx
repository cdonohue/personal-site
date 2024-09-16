type ClusterProps = {
  children: React.ReactNode
  gap?: string
  align?: string
}

function Cluster({ children, gap = 'zero', align = 'stretch' }: ClusterProps) {
  return (
    <div className={`flex flex-row gap-${gap} items-${align} flex-wrap`}>
      {children}
    </div>
  )
}

export { Cluster }
