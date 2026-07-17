/**
 * One rolling train/test window over historical bars (US119).
 * Timestamps are inclusive ISO-8601 bounds from the bar series.
 */
export type WalkForwardWindow = {
  index: number;
  trainFrom: string;
  trainTo: string;
  testFrom: string;
  testTo: string;
};
