type SpacerProps = {
  children?: React.ReactNode
}

function Spacer({ children }: SpacerProps) {
  return <div className={`flex-1`}>{children}</div>
}

export { Spacer }
