import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SecurityAuditModule } from '../modules/security-audit';
import { LoggingModule } from '../logging/logging.module';
import { PlatformSecurityExceptionFilter } from './platform-security-exception.filter';
import { SecurityPlatformBootstrap } from './security-platform.bootstrap';

/**
 * Platform security foundation (V3-S04-a).
 * Extends Identity/Auth HTTP posture without inventing a new bounded context.
 */
@Global()
@Module({
  imports: [LoggingModule, SecurityAuditModule],
  providers: [
    SecurityPlatformBootstrap,
    {
      provide: APP_FILTER,
      useClass: PlatformSecurityExceptionFilter,
    },
  ],
})
export class SecurityPlatformModule {}
