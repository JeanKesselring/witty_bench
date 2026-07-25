import { Component, type ErrorInfo, type ReactNode } from 'react'

export class AppErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Kite could not start.', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main className="startup-error">
        <p>Kite could not start</p>
        <h1>The learning desk hit a snag.</h1>
        <span>Refresh the page to try again. If the problem continues, check the browser console.</span>
        <button type="button" onClick={() => window.location.reload()}>
          Reload page
        </button>
      </main>
    )
  }
}
