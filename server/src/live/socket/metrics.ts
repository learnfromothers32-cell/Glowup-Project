/**
 * Live Socket Metrics
 *
 * Observability infrastructure for the /live namespace.
 * Tracks event latency, broadcast latency, errors, and subscriptions.
 *
 * This is NOT business metrics — it's infrastructure metrics.
 * Business metrics (viewer count, gift revenue, etc.) belong in LiveAnalyticsService.
 */

export interface LiveSocketMetrics {
  recordEventLatency(event: string, durationMs: number): void;
  recordBroadcastLatency(sessionId: string, durationMs: number): void;
  recordRedisPublishLatency(durationMs: number): void;
  incrementSubscriptionCount(): void;
  decrementSubscriptionCount(): void;
  incrementErrorCount(event: string): void;
  getSnapshot(): MetricsSnapshot;
  reset(): void;
}

export interface MetricsSnapshot {
  eventLatencies: Record<string, { count: number; avgMs: number; p99Ms: number }>;
  broadcastLatencies: { count: number; avgMs: number; p99Ms: number };
  redisPublishLatencies: { count: number; avgMs: number; p99Ms: number };
  activeSubscriptions: number;
  errorCounts: Record<string, number>;
  totalEventsProcessed: number;
  totalErrors: number;
}

/**
 * In-memory metrics collector.
 * Suitable for single-instance or when metrics are scraped periodically.
 * For multi-instance aggregation, export to Prometheus/StatsD.
 */
export class LiveSocketMetricsCollector implements LiveSocketMetrics {
  private eventLatencies = new Map<string, number[]>();
  private broadcastLatencies: number[] = [];
  private redisPublishLatencies: number[] = [];
  private errorCounts = new Map<string, number>();
  private activeSubscriptions = 0;
  private totalEventsProcessed = 0;
  private totalErrors = 0;

  recordEventLatency(event: string, durationMs: number): void {
    if (!this.eventLatencies.has(event)) {
      this.eventLatencies.set(event, []);
    }
    this.eventLatencies.get(event)!.push(durationMs);
    this.totalEventsProcessed++;
  }

  recordBroadcastLatency(_sessionId: string, durationMs: number): void {
    this.broadcastLatencies.push(durationMs);
  }

  recordRedisPublishLatency(durationMs: number): void {
    this.redisPublishLatencies.push(durationMs);
  }

  incrementSubscriptionCount(): void {
    this.activeSubscriptions++;
  }

  decrementSubscriptionCount(): void {
    this.activeSubscriptions = Math.max(0, this.activeSubscriptions - 1);
  }

  incrementErrorCount(event: string): void {
    this.errorCounts.set(event, (this.errorCounts.get(event) || 0) + 1);
    this.totalErrors++;
  }

  getSnapshot(): MetricsSnapshot {
    return {
      eventLatencies: Object.fromEntries(
        Array.from(this.eventLatencies.entries()).map(([event, values]) => [
          event,
          {
            count: values.length,
            avgMs: avg(values),
            p99Ms: percentile(values, 0.99),
          },
        ])
      ),
      broadcastLatencies: {
        count: this.broadcastLatencies.length,
        avgMs: avg(this.broadcastLatencies),
        p99Ms: percentile(this.broadcastLatencies, 0.99),
      },
      redisPublishLatencies: {
        count: this.redisPublishLatencies.length,
        avgMs: avg(this.redisPublishLatencies),
        p99Ms: percentile(this.redisPublishLatencies, 0.99),
      },
      activeSubscriptions: this.activeSubscriptions,
      errorCounts: Object.fromEntries(this.errorCounts),
      totalEventsProcessed: this.totalEventsProcessed,
      totalErrors: this.totalErrors,
    };
  }

  reset(): void {
    this.eventLatencies.clear();
    this.broadcastLatencies = [];
    this.redisPublishLatencies = [];
    this.errorCounts.clear();
    this.activeSubscriptions = 0;
    this.totalEventsProcessed = 0;
    this.totalErrors = 0;
  }
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const sortedCopy = [...sorted].sort((a, b) => a - b);
  const index = Math.ceil(sortedCopy.length * p) - 1;
  return sortedCopy[Math.max(0, index)];
}
