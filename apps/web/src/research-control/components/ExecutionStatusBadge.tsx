import type { ExecutionRecordStatus } from '../api';

const STATUS_STYLES: Record<ExecutionRecordStatus, string> = {
  pending: 'border-slate-500/40 bg-slate-500/10 text-slate-200',
  running: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
  completed: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  failed: 'border-red-500/40 bg-red-500/10 text-red-200',
  cancelled: 'border-slate-500/40 bg-slate-500/10 text-slate-400',
};

type Props = {
  status: ExecutionRecordStatus | string;
};

export function ExecutionStatusBadge({ status }: Props) {
  const normalized = (
    STATUS_STYLES[status as ExecutionRecordStatus] ? status : 'pending'
  ) as ExecutionRecordStatus;
  const style = STATUS_STYLES[normalized];

  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium capitalize ${style}`}
      role="status"
      aria-label={`Status: ${status}`}
    >
      {status}
    </span>
  );
}
