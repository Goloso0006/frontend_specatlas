/**
 * Lightweight request monitor that tracks slow operations
 * and frequent errors to help identify performance issues.
 *
 * Usage: wrap any async operation with `monitor.track(name, operation)`.
 */

export interface OperationMetrics {
  name: string
  startedAt: number
  completedAt: number | null
  durationMs: number | null
  status: 'pending' | 'success' | 'error'
  error?: string
}

interface MonitorConfig {
  /** Threshold in ms to flag an operation as "slow" (default: 5000). */
  slowThresholdMs: number
  /** Maximum number of entries to keep in the log (default: 50). */
  maxEntries: number
  /** Callback fired when an operation exceeds the slow threshold. */
  onSlowOperation?: (metrics: OperationMetrics) => void
  /** Callback fired when an error occurs. */
  onError?: (metrics: OperationMetrics) => void
}

const DEFAULT_CONFIG: MonitorConfig = {
  slowThresholdMs: 5_000,
  maxEntries: 50,
}

class RequestMonitor {
  private readonly config: MonitorConfig
  private readonly log: OperationMetrics[] = []

  constructor(config: Partial<MonitorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Wraps an async operation and tracks its timing and result.
   */
  async track<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const entry: OperationMetrics = {
      name,
      startedAt: Date.now(),
      completedAt: null,
      durationMs: null,
      status: 'pending',
    }

    this.addEntry(entry)

    try {
      const result = await operation()
      entry.completedAt = Date.now()
      entry.durationMs = entry.completedAt - entry.startedAt
      entry.status = 'success'

      if (entry.durationMs > this.config.slowThresholdMs) {
        this.config.onSlowOperation?.(entry)

        if (import.meta.env.DEV) {
          console.warn(
            `[Monitor] Slow operation "${name}": ${entry.durationMs}ms (threshold: ${this.config.slowThresholdMs}ms)`,
          )
        }
      }

      return result
    } catch (error) {
      entry.completedAt = Date.now()
      entry.durationMs = entry.completedAt - entry.startedAt
      entry.status = 'error'
      entry.error = error instanceof Error ? error.message : 'Unknown error'

      this.config.onError?.(entry)

      if (import.meta.env.DEV) {
        console.error(`[Monitor] Operation "${name}" failed after ${entry.durationMs}ms:`, entry.error)
      }

      throw error
    }
  }

  /**
   * Returns the operation log (most recent first).
   */
  getLog(): readonly OperationMetrics[] {
    return [...this.log].reverse()
  }

  /**
   * Returns only slow operations from the log.
   */
  getSlowOperations(): OperationMetrics[] {
    return this.log
      .filter((e) => e.durationMs !== null && e.durationMs > this.config.slowThresholdMs)
      .reverse()
  }

  /**
   * Returns only failed operations from the log.
   */
  getErrors(): OperationMetrics[] {
    return this.log.filter((e) => e.status === 'error').reverse()
  }

  /**
   * Returns a summary of error frequency by operation name.
   */
  getErrorFrequency(): Record<string, number> {
    const freq: Record<string, number> = {}
    for (const entry of this.log) {
      if (entry.status === 'error') {
        freq[entry.name] = (freq[entry.name] ?? 0) + 1
      }
    }
    return freq
  }

  /**
   * Returns average duration per operation name.
   */
  getAverageDurations(): Record<string, number> {
    const sums: Record<string, { total: number; count: number }> = {}
    for (const entry of this.log) {
      if (entry.durationMs !== null && entry.status === 'success') {
        const existing = sums[entry.name] ?? { total: 0, count: 0 }
        existing.total += entry.durationMs
        existing.count += 1
        sums[entry.name] = existing
      }
    }

    const averages: Record<string, number> = {}
    for (const [name, data] of Object.entries(sums)) {
      averages[name] = Math.round(data.total / data.count)
    }
    return averages
  }

  /** Clears the operation log. */
  clear(): void {
    this.log.length = 0
  }

  private addEntry(entry: OperationMetrics): void {
    this.log.push(entry)
    if (this.log.length > this.config.maxEntries) {
      this.log.shift()
    }
  }
}

/**
 * Global monitor instance.
 *
 * In dev mode, access via `window.__monitor` for debugging:
 * ```js
 * window.__monitor.getLog()
 * window.__monitor.getSlowOperations()
 * window.__monitor.getErrorFrequency()
 * window.__monitor.getAverageDurations()
 * ```
 */
export const monitor = new RequestMonitor({
  slowThresholdMs: 5_000,
  maxEntries: 50,
  onSlowOperation: (m) => {
    if (import.meta.env.DEV) {
      console.warn(`⚠️ Slow: ${m.name} took ${m.durationMs}ms`)
    }
  },
  onError: (m) => {
    if (import.meta.env.DEV) {
      console.error(`❌ Failed: ${m.name} — ${m.error}`)
    }
  },
})

// Expose monitor in dev mode for console debugging
if (import.meta.env.DEV) {
  ;(globalThis as Record<string, unknown>).__monitor = monitor
}
