import { statusColor } from '../api';

export function StatusBadge({ label }: { label: string }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs ${statusColor(label)}`}>
      {label.replaceAll('_', ' ')}
    </span>
  );
}
