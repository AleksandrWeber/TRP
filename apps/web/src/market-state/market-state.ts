export function lifecycleLabel(status: string): string {
  switch (status) {
    case 'created':
      return 'Created';
    case 'active':
      return 'Active';
    case 'superseded':
      return 'Superseded';
    case 'archived':
      return 'Expired';
    default:
      return status;
  }
}

export function regimeLabel(label: string | null): string {
  if (!label) return '—';
  switch (label) {
    case 'unknown':
      return 'Unknown';
    case 'insufficient_data':
      return 'Insufficient data';
    case 'quiet':
      return 'Quiet';
    case 'trending':
      return 'Trending';
    case 'volatile':
      return 'Volatile';
    case 'illiquid':
      return 'Illiquid';
    case 'mixed':
      return 'Mixed';
    default:
      return label;
  }
}
