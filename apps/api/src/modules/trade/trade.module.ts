import { Module } from '@nestjs/common';

/**
 * Trade execution Nest module (US121).
 * TradeEngine is constructed per BacktestSession (not a Nest singleton).
 * No REST / Prisma / broker / live trading.
 */
@Module({})
export class TradeModule {}
