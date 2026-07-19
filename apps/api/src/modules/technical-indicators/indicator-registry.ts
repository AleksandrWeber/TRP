import { Injectable } from '@nestjs/common';
import {
  DuplicateIndicatorError,
  InvalidIndicatorInputError,
  UnknownIndicatorError,
} from './domain/technical-indicators.error';
import type { Indicator } from './domain/indicator';
import type { IndicatorResult } from './domain/indicator-result';
import type { SeriesIndicatorInput } from './indicators/series-indicator';

type RegisteredIndicator = Indicator<never, unknown>;

/**
 * Registry of Indicator implementations (US011).
 * Mirrors the SignalEvaluatorRegistry policy (US009): consumers resolve
 * indicators by id and never reference an implementation. Unlike the
 * evaluator registry there is no default — an indicator must always be
 * requested explicitly, because indicators are not interchangeable.
 */
@Injectable()
export class IndicatorRegistry {
  private readonly indicators = new Map<string, RegisteredIndicator>();

  register<TInput, TResult>(indicator: Indicator<TInput, TResult>): void {
    const id = indicator.id().trim();
    if (id === '') {
      throw new InvalidIndicatorInputError('Indicator id must not be empty');
    }
    if (this.indicators.has(id)) {
      throw new DuplicateIndicatorError(id);
    }
    this.indicators.set(id, indicator);
  }

  resolve<TInput = SeriesIndicatorInput, TResult = IndicatorResult>(
    id: string,
  ): Indicator<TInput, TResult> {
    const indicator = this.indicators.get(id);
    if (!indicator) {
      throw new UnknownIndicatorError(id, this.list());
    }
    // Registry ids are the runtime type discriminator. Defaults preserve the
    // original period-series API; richer indicators request their own types.
    return indicator as unknown as Indicator<TInput, TResult>;
  }

  has(id: string): boolean {
    return this.indicators.has(id);
  }

  list(): ReadonlyArray<string> {
    return Object.freeze([...this.indicators.keys()]);
  }
}
