/**
 * Raised when compareVersions references a missing version number (US078).
 */
export class ExperimentVersionNotFoundError extends Error {
  constructor(experimentId: string, version: number) {
    super(`Experiment ${experimentId} has no version ${version}`);
    this.name = 'ExperimentVersionNotFoundError';
  }
}
