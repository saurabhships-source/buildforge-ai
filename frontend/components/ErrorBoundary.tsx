'use client'

import { Component, type ReactNode, type ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  /** Optional label shown in the error UI */
  label?: string
  /** Compact mode for panel-level boundaries */
  compact?: boolean
  /** Called when an error is caught */
  onError?: (error: Error, info: ErrorInfo) => void
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.label ?? 'unknown'}]`, error, info.componentStack)
    this.props.onError?.(error, info)
  }

  reset = () => this.setState({ error: null })

  render() {
    const { error } = this.state
    const { children, label, compact } = this.props

    if (!error) return children

    if (compact) {
      return (
        <div className="flex items-center gap-2 p-3 text-xs text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 truncate">{label ?? 'Panel'} error: {error.message}</span>
          <button
            onClick={this.reset}
            className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 hover:bg-red-500/20 transition-colors"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
          <AlertTriangle className="h-6 w-6 text-red-400" />
        </div>
        <h3 className="font-semibold text-sm mb-1">{label ?? 'Something went wrong'}</h3>
        <p className="text-xs text-muted-foreground mb-4 max-w-xs">{error.message}</p>
        <button
          onClick={this.reset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-lg border border-primary/20 transition-colors"
        >
          <RefreshCw className="h-3 w-3" /> Try again
        </button>
      </div>
    )
  }
}

/** HOC: wrap a component in an ErrorBoundary */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  label?: string,
  compact = true,
) {
  const Wrapped = (props: P) => (
    <ErrorBoundary label={label} compact={compact}>
      <Component {...props} />
    </ErrorBoundary>
  )
  Wrapped.displayName = `WithErrorBoundary(${Component.displayName ?? Component.name})`
  return Wrapped
}
