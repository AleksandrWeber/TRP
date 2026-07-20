import type { ResearchSessionRecord, ResearchSessionRepository } from '../research-api';

/**
 * Test double that injects deterministic repository failures (US199).
 */

export type FailingSessionRepositoryOptions = Readonly<{
  delegate: ResearchSessionRepository;
  failOn?: 'save' | 'findById' | 'findAll' | 'delete';
  message?: string;
}>;

export class FailingSessionRepository implements ResearchSessionRepository {
  private readonly delegate: ResearchSessionRepository;
  private readonly failOn: 'save' | 'findById' | 'findAll' | 'delete';
  private readonly message: string;
  readonly failureInjected: boolean[] = [];

  private constructor(options: FailingSessionRepositoryOptions) {
    this.delegate = options.delegate;
    this.failOn = options.failOn ?? 'save';
    this.message = options.message ?? 'chaos: repository failure';
  }

  static create(options: FailingSessionRepositoryOptions): FailingSessionRepository {
    if (options.delegate === null || options.delegate === undefined) {
      throw new Error('delegate is required');
    }
    return new FailingSessionRepository(options);
  }

  async save(record: ResearchSessionRecord): Promise<void> {
    if (this.failOn === 'save') {
      this.failureInjected.push(true);
      throw new Error(this.message);
    }
    return this.delegate.save(record);
  }

  async findById(sessionId: string): Promise<ResearchSessionRecord | null> {
    if (this.failOn === 'findById') {
      this.failureInjected.push(true);
      throw new Error(this.message);
    }
    return this.delegate.findById(sessionId);
  }

  async findAll(): Promise<readonly ResearchSessionRecord[]> {
    if (this.failOn === 'findAll') {
      this.failureInjected.push(true);
      throw new Error(this.message);
    }
    return this.delegate.findAll();
  }

  async delete(sessionId: string): Promise<void> {
    if (this.failOn === 'delete') {
      this.failureInjected.push(true);
      throw new Error(this.message);
    }
    return this.delegate.delete(sessionId);
  }
}
