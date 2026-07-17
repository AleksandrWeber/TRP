import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { ClassValidatorErrorMapper } from './class-validator-error.mapper';
import type { ValidationErrorDetail } from './validation.types';

type ReplyLike = {
  code: (status: number) => { send: (body: unknown) => unknown };
};

/**
 * Normalizes ValidationPipe BadRequestException into unified validation errors (US113).
 *
 * Response body:
 * {
 *   statusCode: 400,
 *   errors: [{ code, message, field, value }, ...]
 * }
 */
@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly mapper = new ClassValidatorErrorMapper();

  catch(exception: BadRequestException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<ReplyLike>();
    const status = exception.getStatus?.() ?? HttpStatus.BAD_REQUEST;
    const body = exception.getResponse();
    const errors = this.extractErrors(body);

    if (errors.length > 0) {
      void response.code(status).send({
        statusCode: status,
        errors,
      });
      return;
    }

    const message =
      typeof body === 'string'
        ? body
        : typeof body === 'object' && body !== null && 'message' in body
          ? (body as { message: unknown }).message
          : exception.message;

    void response.code(status).send({
      statusCode: status,
      message,
      error: 'Bad Request',
    });
  }

  private extractErrors(body: string | object): ValidationErrorDetail[] {
    if (typeof body !== 'object' || body === null) return [];

    const message = (body as { message?: unknown }).message;
    if (!Array.isArray(message)) {
      // exceptionFactory returns BadRequestException(errors) — body.message may be ValidationError[]
      // or body itself may be the array when Nest wraps differently.
      if (Array.isArray(body)) {
        return this.mapper.map(body);
      }
      return [];
    }

    if (message.length === 0) return [];

    if (typeof message[0] === 'string') {
      return message.map((item) => ({
        code: 'validation',
        message: String(item),
        field: '',
        value: undefined,
      }));
    }

    return this.mapper.map(message);
  }
}
