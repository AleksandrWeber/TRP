/**
 * Single field-level difference in a structural comparison (US078).
 */
export type ComparisonChange = {
  key: string;
  before?: string | number | boolean | null;
  after?: string | number | boolean | null;
};
