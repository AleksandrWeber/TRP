import type { PaperExecutionContext, PaperStrategy } from '../paper-trading-runner';

/**
 * Test double that injects deterministic strategy failures (US199).
 */

export type FailingPaperStrategyOptions = Readonly<{
  delegate: PaperStrategy;
  failOn?: 'initialize' | 'execute' | 'shutdown';
  failAfterExecuteCalls?: number;
  message?: string;
}>;

export class FailingPaperStrategy implements PaperStrategy {
  private readonly delegate: PaperStrategy;
  private readonly failOn: 'initialize' | 'execute' | 'shutdown';
  private readonly failAfterExecuteCalls: number;
  private readonly message: string;
  private executeCalls = 0;
  readonly failureInjected: boolean[] = [];

  private constructor(options: FailingPaperStrategyOptions) {
    this.delegate = options.delegate;
    this.failOn = options.failOn ?? 'execute';
    this.failAfterExecuteCalls = options.failAfterExecuteCalls ?? 0;
    this.message = options.message ?? 'chaos: strategy failure';
  }

  static create(options: FailingPaperStrategyOptions): FailingPaperStrategy {
    if (options.delegate === null || options.delegate === undefined) {
      throw new Error('delegate is required');
    }
    return new FailingPaperStrategy(options);
  }

  initialize(context: PaperExecutionContext): void {
    if (this.failOn === 'initialize') {
      this.failureInjected.push(true);
      throw new Error(this.message);
    }
    this.delegate.initialize(context);
  }

  execute(context: PaperExecutionContext): void {
    const currentCalls = this.executeCalls;
    this.executeCalls += 1;

    if (this.failOn === 'execute' && currentCalls >= this.failAfterExecuteCalls) {
      this.failureInjected.push(true);
      throw new Error(this.message);
    }

    this.delegate.execute(context);
  }

  shutdown(context: PaperExecutionContext): void {
    if (this.failOn === 'shutdown') {
      this.failureInjected.push(true);
      throw new Error(this.message);
    }
    this.delegate.shutdown(context);
  }
}
