import type { OperatorNotification } from '../notifications';

type Props = {
  notifications: readonly OperatorNotification[];
  onDismiss: (id: string) => void;
};

const toneClasses: Record<OperatorNotification['tone'], string> = {
  success: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-50',
  warning: 'border-amber-500/35 bg-amber-500/10 text-amber-50',
  error: 'border-red-500/35 bg-red-500/10 text-red-50',
  critical: 'border-red-500/50 bg-red-500/15 text-red-50',
};

/**
 * Lightweight in-memory notification stack (RC-20 Epic 5).
 * Non-blocking; sticky critical items require manual dismiss.
 */
export function NotificationCenter({ notifications, onDismiss }: Props) {
  if (notifications.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-40 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
      data-testid="cc-notification-center"
      aria-live="polite"
      aria-relevant="additions removals"
    >
      {notifications.map((item) => (
        <div
          key={item.id}
          className={`pointer-events-auto rounded-lg border px-3 py-2 shadow-lg backdrop-blur ${toneClasses[item.tone]}`}
          data-testid="cc-notification"
          data-tone={item.tone}
          data-sticky={item.sticky ? 'true' : 'false'}
          role={item.tone === 'critical' || item.tone === 'error' ? 'alert' : 'status'}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-xs opacity-90">{item.message}</p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded px-1.5 py-0.5 text-xs opacity-80 hover:bg-white/10 hover:opacity-100 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
              aria-label={`Dismiss ${item.title}`}
              data-testid="cc-notification-dismiss"
              onClick={() => onDismiss(item.id)}
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
