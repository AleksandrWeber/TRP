import {
  ResearchValidationError,
  type CreateResearchSessionRequest,
  type ResearchSessionResponse,
} from '../research-api';
import type { SmokeResearchOrchestrator } from '../smoke-backtest';

/**
 * Test double that injects validation and event-emission failures (US199).
 */

export type FailingResearchOrchestratorOptions = Readonly<{
  delegate: SmokeResearchOrchestrator;
  failOn?: 'createSession' | 'startSession' | 'runCycle' | 'stopSession' | 'domainEvents';
  validationMessage?: string;
  eventEmissionMessage?: string;
}>;

export class FailingResearchOrchestrator implements SmokeResearchOrchestrator {
  private readonly delegate: SmokeResearchOrchestrator;
  private readonly failOn:
    'createSession' | 'startSession' | 'runCycle' | 'stopSession' | 'domainEvents';
  private readonly validationMessage: string;
  private readonly eventEmissionMessage: string;
  readonly failureInjected: boolean[] = [];

  private constructor(options: FailingResearchOrchestratorOptions) {
    this.delegate = options.delegate;
    this.failOn = options.failOn ?? 'createSession';
    this.validationMessage = options.validationMessage ?? 'chaos: validation failure';
    this.eventEmissionMessage = options.eventEmissionMessage ?? 'chaos: event emission failure';
  }

  static create(options: FailingResearchOrchestratorOptions): FailingResearchOrchestrator {
    if (options.delegate === null || options.delegate === undefined) {
      throw new Error('delegate is required');
    }
    return new FailingResearchOrchestrator(options);
  }

  async createSession(request: CreateResearchSessionRequest): Promise<ResearchSessionResponse> {
    if (this.failOn === 'createSession') {
      this.failureInjected.push(true);
      throw new ResearchValidationError(this.validationMessage);
    }
    return this.delegate.createSession(request);
  }

  async startSession(sessionId: string): Promise<ResearchSessionResponse> {
    if (this.failOn === 'startSession') {
      this.failureInjected.push(true);
      throw new ResearchValidationError(this.validationMessage);
    }
    return this.delegate.startSession(sessionId);
  }

  async runCycle(sessionId: string): Promise<ResearchSessionResponse> {
    if (this.failOn === 'runCycle') {
      this.failureInjected.push(true);
      throw new Error(this.eventEmissionMessage);
    }
    return this.delegate.runCycle(sessionId);
  }

  async stopSession(sessionId: string): Promise<ResearchSessionResponse> {
    if (this.failOn === 'stopSession') {
      this.failureInjected.push(true);
      throw new Error(this.eventEmissionMessage);
    }
    return this.delegate.stopSession(sessionId);
  }

  domainEvents(): readonly unknown[] {
    if (this.failOn === 'domainEvents') {
      this.failureInjected.push(true);
      throw new Error(this.eventEmissionMessage);
    }
    return this.delegate.domainEvents();
  }
}
