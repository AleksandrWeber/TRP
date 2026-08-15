export type DeliveryOutcomeFilter = 'all' | 'delivered' | 'skipped' | 'failed';
export type NotificationTypeFilter =
  | 'all'
  | 'daily-report'
  | 'weekly-report'
  | 'monthly-report'
  | 'session-finished'
  | 'strategy-certified'
  | 'strategy-deprecated'
  | 'runtime-validation-failed'
  | 'emergency-stop'
  | 'kill-switch-activated'
  | 'critical-platform-error'
  | 'order-events'
  | 'fill-events'
  | 'debug-events';

export const DELIVERY_OUTCOME_FILTERS: { id: DeliveryOutcomeFilter; label: string }[] = [
  { id: 'all', label: 'All outcomes' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'skipped', label: 'Skipped' },
  { id: 'failed', label: 'Failed' },
];

export const NOTIFICATION_TYPE_FILTERS: { id: NotificationTypeFilter; label: string }[] = [
  { id: 'all', label: 'All types' },
  { id: 'daily-report', label: 'Daily report' },
  { id: 'weekly-report', label: 'Weekly report' },
  { id: 'monthly-report', label: 'Monthly report' },
  { id: 'session-finished', label: 'Session finished' },
  { id: 'strategy-certified', label: 'Strategy certified' },
  { id: 'strategy-deprecated', label: 'Strategy deprecated' },
  { id: 'runtime-validation-failed', label: 'Runtime validation failed' },
  { id: 'emergency-stop', label: 'Emergency stop' },
  { id: 'kill-switch-activated', label: 'Kill switch' },
  { id: 'critical-platform-error', label: 'Critical platform error' },
  { id: 'order-events', label: 'Order events' },
  { id: 'fill-events', label: 'Fill events' },
  { id: 'debug-events', label: 'Debug events' },
];

export const TIMEZONE_OPTIONS = [
  'UTC',
  'Europe/Kyiv',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Tokyo',
] as const;

export function notificationTypeLabel(type: string): string {
  return NOTIFICATION_TYPE_FILTERS.find((item) => item.id === type)?.label ?? type;
}

export function deliveryOutcomeLabel(outcome: string): string {
  switch (outcome) {
    case 'delivered':
      return 'Delivered';
    case 'skipped':
      return 'Skipped';
    case 'failed':
      return 'Failed';
    case 'not-invoked':
      return 'Not invoked';
    default:
      return outcome;
  }
}

export function skipReasonLabel(reason: string): string {
  switch (reason) {
    case 'notifications-disabled':
      return 'Notifications disabled';
    case 'type-disabled':
      return 'Type disabled';
    case 'channel-disabled':
      return 'Channel disabled';
    case 'channel-reserved':
      return 'Channel reserved';
    case 'channel-not-connected':
      return 'Channel not connected';
    case 'quiet-hours':
      return 'Quiet hours';
    case 'no-routes':
      return 'No routes';
    default:
      return reason;
  }
}

export function telegramStatusLabel(status: string): string {
  switch (status) {
    case 'connected':
      return 'Connected';
    case 'pending':
      return 'Pending';
    case 'not-connected':
      return 'Not connected';
    default:
      return status;
  }
}

export function channelStatusLabel(status: string): string {
  return status === 'active' ? 'Active' : 'Reserved — not offered';
}

export function notificationChannelLabel(channelId: string): string {
  switch (channelId) {
    case 'telegram':
      return 'Telegram';
    case 'email':
      return 'Email';
    case 'slack':
      return 'Slack';
    case 'discord':
      return 'Discord';
    case 'teams':
      return 'Microsoft Teams';
    case 'push':
      return 'Push';
    default:
      return channelId;
  }
}

export function configurationHealthLabel(health: string): string {
  switch (health) {
    case 'ready':
      return 'Ready';
    case 'not-connected':
      return 'Not connected';
    case 'pending':
      return 'Pending';
    case 'disabled':
      return 'Disabled';
    case 'reserved-inactive':
      return 'Reserved — not offered';
    default:
      return health;
  }
}

export function connectionStateLabel(state: string): string {
  switch (state) {
    case 'connected':
      return 'Connected';
    case 'pending':
      return 'Pending';
    case 'not-connected':
      return 'Not connected';
    case 'reserved-inactive':
      return 'Reserved — not offered';
    default:
      return state;
  }
}

export function buildDeliveryListQuery(input: {
  search: string;
  outcome: DeliveryOutcomeFilter;
  type: NotificationTypeFilter;
}) {
  return {
    ...(input.search.trim() ? { q: input.search.trim() } : {}),
    ...(input.outcome !== 'all' ? { outcome: input.outcome } : {}),
    ...(input.type !== 'all' ? { type: input.type } : {}),
  };
}
