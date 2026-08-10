import { useCallback, useRef, useState } from 'react';
import {
  AUTO_DISMISS_MS,
  dismissNotification,
  prependNotification,
  scheduleAutoDismiss,
  type OperatorNotification,
} from './notifications';

/**
 * Session-scoped in-memory notification list. No persistence.
 * Non-sticky items auto-dismiss after AUTO_DISMISS_MS.
 */
export function useOperatorNotifications() {
  const [notifications, setNotifications] = useState<OperatorNotification[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setNotifications((current) => dismissNotification(current, id));
  }, []);

  const push = useCallback((notification: OperatorNotification) => {
    setNotifications((current) => prependNotification(current, notification));
    if (!notification.sticky) {
      const timer = scheduleAutoDismiss(
        notification.id,
        (id) => {
          timersRef.current.delete(id);
          setNotifications((current) => dismissNotification(current, id));
        },
        AUTO_DISMISS_MS,
      );
      timersRef.current.set(notification.id, timer);
    }
  }, []);

  const clear = useCallback(() => {
    for (const timer of timersRef.current.values()) {
      clearTimeout(timer);
    }
    timersRef.current.clear();
    setNotifications([]);
  }, []);

  return { notifications, push, dismiss, clear };
}
