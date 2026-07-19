import { Injectable } from '@nestjs/common';
import {
  DuplicateIndicatorError,
  InvalidIndicatorInputError,
  UnknownIndicatorError,
} from './domain/technical-indicators.error';
import type { SeriesIndicator } from './indicators/series-indicator';

/**
 * Registry of Indicator implementations (US011).
 * Mirrors the SignalEvaluatorRegistry policy (US009): consumers resolve
 * indicators by id and never reference an implementation. Unlike the
 * evaluator registry there is no default — an indicator must always be
 * requested explicitly, because indicators are not interchangeable.
 */
@Injectable()
export class IndicatorRegistry {
  private readonly indicators = new Map<string, SeriesIndicator>();

  register(indicator: SeriesIndicator): void {
    const id = indicator.id().trim();
    if (id === '') {
      throw new InvalidIndicatorInputError('Indicator id must not be empty');
    }
    if (this.indicators.has(id)) {
      throw new DuplicateIndicatorError(id);
    }
    this.indicators.set(id, indicator);
  }

  resolve(id: string): SeriesIndicator {
    const indicator = this.indicators.get(id);
    if (!indicator) {
      throw new UnknownIndicatorError(id, this.list());
    }
    return indicator;
  }

  has(id: string): boolean {
    return this.indicators.has(id);
  }

  list(): ReadonlyArray<string> {
    return Object.freeze([...this.indicators.keys()]);
  }
}
