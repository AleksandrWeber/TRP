export type OutboxDispatcherMetricsSnapshot = Readonly<{
  deliveriesAttempted: number;
  deliveriesSucceeded: number;
  deliveriesFailed: number;
  deadLetters: number;
  duplicatesAcknowledged: number;
}>;

/**
 * Simple in-process dispatcher metrics (US130).
 * Observability foundation — not a distributed metrics backend.
 */
export class OutboxDispatcherMetrics {
  private deliveriesAttempted = 0;
  private deliveriesSucceeded = 0;
  private deliveriesFailed = 0;
  private deadLetters = 0;
  private duplicatesAcknowledged = 0;

  recordAttempt(): void {
    this.deliveriesAttempted += 1;
  }

  recordSuccess(): void {
    this.deliveriesSucceeded += 1;
  }

  recordFailure(): void {
    this.deliveriesFailed += 1;
  }

  recordDeadLetter(): void {
    this.deadLetters += 1;
  }

  recordDuplicateAck(): void {
    this.duplicatesAcknowledged += 1;
  }

  snapshot(): OutboxDispatcherMetricsSnapshot {
    return Object.freeze({
      deliveriesAttempted: this.deliveriesAttempted,
      deliveriesSucceeded: this.deliveriesSucceeded,
      deliveriesFailed: this.deliveriesFailed,
      deadLetters: this.deadLetters,
      duplicatesAcknowledged: this.duplicatesAcknowledged,
    });
  }
}
