/**
 * ADR-019 — Application events are infrastructure notifications.
 *
 * Completion notifications are best-effort and must not invalidate business
 * execution after ExecutionResult has been committed.
 */

export type EventEmissionDiagnostic = Readonly<{
  eventType: string;
  message: string;
  occurredAt: string;
}>;

export type ApplicationEventNotifier<T> = Readonly<{
  publish(event: T): void;
}>;

export type ApplicationEventNotificationState<T extends { eventType: string }> = Readonly<{
  notify: (event: T) => void;
  diagnostics: () => readonly EventEmissionDiagnostic[];
}>;

export function createInMemoryApplicationEventNotifier<T>(store: T[]): ApplicationEventNotifier<T> {
  return {
    publish(event: T): void {
      store.push(Object.freeze(event) as T);
    },
  };
}

export function createFailingApplicationEventNotifier<T extends { eventType: string }>(
  store: T[],
  failOnEventTypes: readonly string[],
  message = 'event emission failure',
): ApplicationEventNotifier<T> {
  return {
    publish(event: T): void {
      if (failOnEventTypes.includes(event.eventType)) {
        throw new Error(message);
      }
      store.push(Object.freeze(event) as T);
    },
  };
}

export function createApplicationEventNotificationState<T extends { eventType: string }>(
  store: T[],
  clock: () => string,
  notifier?: ApplicationEventNotifier<T>,
): ApplicationEventNotificationState<T> {
  const publisher = notifier ?? createInMemoryApplicationEventNotifier(store);
  const diagnostics: EventEmissionDiagnostic[] = [];

  return {
    notify(event: T): void {
      try {
        publisher.publish(event);
      } catch (error) {
        diagnostics.push(
          Object.freeze({
            eventType: event.eventType,
            message: error instanceof Error ? error.message : String(error),
            occurredAt: clock(),
          }),
        );
      }
    },
    diagnostics(): readonly EventEmissionDiagnostic[] {
      return Object.freeze([...diagnostics]);
    },
  };
}
