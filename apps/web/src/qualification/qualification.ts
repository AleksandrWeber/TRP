export type QualificationMode = 'lab' | 'paper';

export function lifecycleLabel(state: string): string {
  switch (state) {
    case 'not_qualified':
      return 'Not qualified';
    case 'pending_confirm':
      return 'Pending confirm';
    case 'qualifying':
      return 'Qualifying';
    case 'qualified':
      return 'Qualified';
    case 'degraded':
      return 'Degraded';
    case 'expired':
      return 'Expired';
    case 'failed':
      return 'Failed';
    default:
      return state;
  }
}

export function runStatusLabel(status: string): string {
  switch (status) {
    case 'requested':
      return 'Requested';
    case 'confirmed':
      return 'Confirmed';
    case 'running':
      return 'Running';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    case 'cancelled':
      return 'Cancelled';
    case 'rejected':
      return 'Rejected';
    default:
      return status;
  }
}

export function confidenceLabel(level: string | null): string {
  if (!level) return 'None recorded';
  switch (level) {
    case 'low':
      return 'Low';
    case 'medium':
      return 'Medium';
    case 'high':
      return 'High';
    case 'unknown':
      return 'Unknown';
    default:
      return level;
  }
}

export function healthLabel(status: string | null): string {
  if (!status) return 'None recorded';
  switch (status) {
    case 'healthy':
      return 'Healthy';
    case 'watch':
      return 'Watch';
    case 'unhealthy':
      return 'Unhealthy';
    case 'unknown':
      return 'Unknown';
    default:
      return status;
  }
}

export function modeLabel(mode: string): string {
  if (mode === 'live') return 'live (label only)';
  return mode;
}
