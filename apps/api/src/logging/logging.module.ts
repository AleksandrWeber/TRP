import { Global, Module } from '@nestjs/common';
import { ConsoleLogger } from './console.logger';
import { resolveLoggerDriver } from './logger-driver';
import { LOGGER } from './logger.token';
import { NoOpLogger } from './noop.logger';

/**
 * Global structured logging module (US111).
 * Provides LOGGER token → ConsoleLogger | NoOpLogger.
 */
@Global()
@Module({
  providers: [
    {
      provide: LOGGER,
      useFactory: () => {
        return resolveLoggerDriver() === 'noop' ? new NoOpLogger() : new ConsoleLogger();
      },
    },
  ],
  exports: [LOGGER],
})
export class LoggingModule {}
