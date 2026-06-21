import { UnexpectedErrorPage } from '@/features/errors/UnexpectedErrorPage'
import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean; error: Error | null; componentStack: string | null }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, componentStack: null }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[AppErrorBoundary]', error, info.componentStack)
    this.setState({ componentStack: info.componentStack ?? null })
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, componentStack: null })
  }

  render(): ReactNode {
    const { error, hasError } = this.state
    if (hasError && error) {
      return (
        <UnexpectedErrorPage
          error={error}
          componentStack={this.state.componentStack}
          onReset={this.handleReset}
        />
      )
    }
    return this.props.children
  }
}
