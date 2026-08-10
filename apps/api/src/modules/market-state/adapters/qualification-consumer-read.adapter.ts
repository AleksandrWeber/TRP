/**
 * RC-26 Epic 2 — Market Qualification consumer read adapter (Market State).
 *
 * Wraps RC-25 MarketQualificationConsumerReadPort → Market State input models.
 * No ownership transfer. No classification. Empty-safe (null / empty).
 */

import { Inject, Injectable } from '@nestjs/common';
import {
  MARKET_QUALIFICATION_CONSUMER_READ_PORT,
  type MarketQualificationConsumerReadPort,
} from '../../market-qualification/ports/market-qualification-consumer.port';
import {
  toQualificationConfidenceInput,
  toQualificationHealthInput,
  toQualificationLifecycleInput,
  toQualificationSummaryInput,
  type MarketStateTargetReadQuery,
  type QualificationConfidenceInput,
  type QualificationHealthInput,
  type QualificationLifecycleInput,
  type QualificationSummaryInput,
} from '../domain/market-state-input-read-model';
import type { MarketStateQualificationConsumerPort } from '../ports/market-state.port';

@Injectable()
export class MarketStateQualificationReadAdapter implements MarketStateQualificationConsumerPort {
  constructor(
    @Inject(MARKET_QUALIFICATION_CONSUMER_READ_PORT)
    private readonly qualificationConsumer: MarketQualificationConsumerReadPort,
  ) {}

  getLifecycleStatus(query: MarketStateTargetReadQuery): QualificationLifecycleInput | null {
    if (!query.workspaceId || !query.exchangeScopeId || !query.marketSymbol) {
      return null;
    }
    return toQualificationLifecycleInput(this.qualificationConsumer.getLifecycleStatus(query));
  }

  getConfidence(query: MarketStateTargetReadQuery): QualificationConfidenceInput | null {
    if (!query.workspaceId || !query.exchangeScopeId || !query.marketSymbol) {
      return null;
    }
    return toQualificationConfidenceInput(
      this.qualificationConsumer.getConfidenceProjection(query),
    );
  }

  getHealth(query: MarketStateTargetReadQuery): QualificationHealthInput | null {
    if (!query.workspaceId || !query.exchangeScopeId || !query.marketSymbol) {
      return null;
    }
    return toQualificationHealthInput(this.qualificationConsumer.getHealthProjection(query));
  }

  getQualificationSummary(query: MarketStateTargetReadQuery): QualificationSummaryInput | null {
    if (!query.workspaceId || !query.exchangeScopeId || !query.marketSymbol) {
      return null;
    }
    return toQualificationSummaryInput(this.qualificationConsumer.getQualificationSummary(query));
  }
}
