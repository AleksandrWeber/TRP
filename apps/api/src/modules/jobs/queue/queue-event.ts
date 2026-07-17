/**
 * Structured queue lifecycle events (US110).
 */
export type QueueEventType = 'queued' | 'processing' | 'completed' | 'failed' | 'dead-letter';

export type QueueEvent = {
  type: QueueEventType;
  messageId: string;
  timestamp: string;
  attempt?: number;
  error?: string;
};
