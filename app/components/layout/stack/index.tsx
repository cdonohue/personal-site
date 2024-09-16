enum Alignment {
  Start = 'start',
  Center = 'center',
  End = 'end',
  Stretch = 'stretch',
}

type StackProps = {
  className?: string
  children: React.ReactNode
  align?: Alignment
  gap?: string
}

function Stack({
  children,
  gap = 'zero',
  className = '',
  align = Alignment.Stretch,
}: StackProps) {
  const alignment = `items-${align}`

  return (
    <div
      className={`${className} flex flex-col gap-${gap} w-full ${alignment}`.trim()}
    >
      {children}
    </div>
  )
}

export { Stack, Alignment }
