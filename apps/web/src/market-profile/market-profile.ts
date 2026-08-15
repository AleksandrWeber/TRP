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

export function regimeLabel(label: string | null): string {
  if (!label) return '—';
  switch (label) {
    case 'low':
      return 'Low';
    case 'moderate':
      return 'Moderate';
    case 'elevated':
      return 'Elevated';
    case 'extreme':
      return 'Extreme';
    case 'unknown':
      return 'Unknown';
    case 'insufficient_data':
      return 'Insufficient data';
    default:
      return label;
  }
}

export function dimensionKindLabel(kind: string): string {
  switch (kind) {
    case 'volatility':
      return 'Volatility';
    case 'liquidity':
      return 'Liquidity';
    case 'trend':
      return 'Trend';
    case 'structure':
      return 'Structure';
    default:
      return kind;
  }
}

export function metadataFieldLabel(field: string): string {
  switch (field) {
    case 'marketProfileId':
      return 'Profile id';
    case 'version':
      return 'Version';
    case 'publishedAt':
      return 'Published at';
    case 'publishedBy':
      return 'Published by';
    case 'qualificationRunId':
      return 'Qualification run';
    case 'confidenceLevel':
      return 'Confidence level';
    case 'confidenceScore':
      return 'Recorded score';
    case 'confidenceSourceRunId':
      return 'Source run';
    case 'rationaleSummary':
      return 'Rationale';
    default:
      return field;
  }
}
