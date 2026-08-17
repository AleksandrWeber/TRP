import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Optional,
} from '@nestjs/common';
import type { Logger } from '../logging/logger';
import { LOGGER } from '../logging/logger.token';
import { SecurityAuditService } from '../modules/security-audit/security-audit.service';
import { loadSecurityPlatformConfig } from './security-config';
import { PLATFORM_ACCESS_DENIED_MESSAGE } from './anti-enumeration';
import { emitPlatformSecurityEvent } from './security-event';
import { sanitizeClientError } from './security-error';

type ReplyLike = {
  code: (status: number) => { send: (body: unknown) => unknown };
};

/**
 * Centralized security error handling for every HTTP response (V3-S04-a).
 * Validation errors remain owned by ValidationExceptionFilter.
 */
@Injectable()
@Catch()
export class PlatformSecurityExceptionFilter implements ExceptionFilter {
  private readonly logger: Logger;

  constructor(
    @Inject(LOGGER) logger: Logger,
    @Optional() @Inject(SecurityAuditService) private readonly audit?: SecurityAuditService,
  ) {
    this.logger = logger.child(PlatformSecurityExceptionFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() !== 'http') {
      throw exception;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<ReplyLike>();
    const config = loadSecurityPlatformConfig();
    const sanitized = sanitizeClientError(exception, config);
    const messageText =
      typeof sanitized.message === 'string' ? sanitized.message : sanitized.message.join(' ');

    if (sanitized.statusCode === 403 && messageText === PLATFORM_ACCESS_DENIED_MESSAGE) {
      emitPlatformSecurityEvent(
        this.logger,
        {
          type: 'platform.deny.shaped',
          statusCode: sanitized.statusCode,
        },
        this.audit,
      );
    }

    if (!(exception instanceof HttpException)) {
      this.logger.error('Unhandled platform exception', {
        name: exception instanceof Error ? exception.name : 'unknown',
        message: exception instanceof Error ? exception.message : String(exception),
      });
    } else if (sanitized.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.warn('Server error sanitized for client', {
        statusCode: sanitized.statusCode,
      });
    }

    void response.code(sanitized.statusCode).send(sanitized);
  }
}
