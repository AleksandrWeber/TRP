import type { PaperExecutionContext } from './paper-execution-context';

/**
 * Contract for the strategy pipeline invoked by the PaperTradingRunner.
 *
 * US189 defines the contract only. Concrete strategies (indicators,
 * evaluation, signal generation) arrive in later user stories.
 */
export interface PaperStrategy {
  initialize(context: PaperExecutionContext): Promise<void> | void;
  execute(context: PaperExecutionContext): Promise<void> | void;
  shutdown(context: PaperExecutionContext): Promise<void> | void;
}
