import type { ReactNode } from 'react'

type ModuleFrameProps = {
  children: ReactNode
  code: string
  footer?: ReactNode
  kind: string
  title: string
}

export function ModuleFrame({ children, code, footer, kind, title }: ModuleFrameProps) {
  return (
    <article className="catalog-card">
      <header className="catalog-card__head">
        <span>{code}</span>
        <div>
          <small>{kind}</small>
          <h3>{title}</h3>
        </div>
        <i aria-hidden="true" />
      </header>
      <div className="catalog-card__body">{children}</div>
      {footer && <footer className="catalog-card__foot">{footer}</footer>}
    </article>
  )
}

export function ModuleStatus({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'right' | 'wrong'
}) {
  return (
    <span className="catalog-status" data-tone={tone} role="status">
      {children}
    </span>
  )
}
