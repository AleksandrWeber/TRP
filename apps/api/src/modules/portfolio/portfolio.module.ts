import { Module } from '@nestjs/common';

/**
 * Portfolio simulation Nest module (US120).
 * PortfolioEngine is constructed per BacktestSession (not a singleton provider).
 * No REST / Prisma / broker / live trading.
 */
@Module({})
export class PortfolioModule {}
