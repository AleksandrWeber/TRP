import { Injectable } from '@nestjs/common';

export type RiskDecision = {
  approved: boolean;
  reason?: string;
};

export type RiskContext = {
  deploymentStatus: string;
  signalType: 'buy' | 'sell' | 'hold';
  positionSide: 'flat' | 'long';
  quantity: number;
  price: number;
  maxNotional: number;
};

@Injectable()
export class RiskService {
  evaluate(ctx: RiskContext): RiskDecision {
    if (ctx.deploymentStatus !== 'active') {
      return { approved: false, reason: 'Deployment is not active' };
    }

    if (ctx.signalType === 'hold') {
      return { approved: false, reason: 'No actionable signal' };
    }

    if (ctx.signalType === 'buy') {
      if (ctx.positionSide === 'long') {
        return { approved: false, reason: 'Already in long position' };
      }
      const notional = ctx.quantity * ctx.price;
      if (notional > ctx.maxNotional) {
        return { approved: false, reason: `Notional exceeds limit (${ctx.maxNotional})` };
      }
      return { approved: true };
    }

    if (ctx.signalType === 'sell') {
      if (ctx.positionSide !== 'long' || ctx.quantity <= 0) {
        return { approved: false, reason: 'No open position to close' };
      }
      return { approved: true };
    }

    return { approved: false, reason: 'Unknown signal' };
  }
}
