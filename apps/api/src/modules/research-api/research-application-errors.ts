/**
 * Application errors for the US190 Research API.
 *
 * These wrap domain / runner failures without exposing aggregate internals.
 */

export type ResearchApplicationErrorCode =
  | 'RESEARCH_SESSION_NOT_FOUND'
  | 'RESEARCH_SESSION_ALREADY_EXISTS'
  | 'RESEARCH_SESSION_ALREADY_RUNNING'
  | 'RESEARCH_SESSION_STOPPED'
  | 'RESEARCH_VALIDATION';

export abstract class ResearchApplicationError extends Error {
  abstract readonly code: ResearchApplicationErrorCode;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ResearchSessionNotFoundError extends ResearchApplicationError {
  readonly code = 'RESEARCH_SESSION_NOT_FOUND' as const;

  constructor(sessionId: string) {
    super(`Research session not found: ${sessionId}`);
  }
}

export class ResearchSessionAlreadyExistsError extends ResearchApplicationError {
  readonly code = 'RESEARCH_SESSION_ALREADY_EXISTS' as const;

  constructor(sessionId: string) {
    super(`Research session already exists: ${sessionId}`);
  }
}

export class ResearchSessionAlreadyRunningError extends ResearchApplicationError {
  readonly code = 'RESEARCH_SESSION_ALREADY_RUNNING' as const;

  constructor(sessionId: string) {
    super(`Research session is already running: ${sessionId}`);
  }
}

export class ResearchSessionStoppedError extends ResearchApplicationError {
  readonly code = 'RESEARCH_SESSION_STOPPED' as const;

  constructor(sessionId: string) {
    super(`Research session is stopped: ${sessionId}`);
  }
}

export class ResearchValidationError extends ResearchApplicationError {
  readonly code = 'RESEARCH_VALIDATION' as const;
  readonly cause: unknown | undefined;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}
