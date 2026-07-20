import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import {
  PaperTradingExecutorError,
  type PaperTradingExecutorErrorCode,
} from './domain/paper-trading-executor.error';

type ReplyLike = {
  code: (status: number) => { send: (body: unknown) => unknown };
};

const STATUS_BY_CODE: Readonly<Record<PaperTradingExecutorErrorCode, HttpStatus>> = Object.freeze({
  PORTFOLIO_NOT_FOUND: HttpStatus.NOT_FOUND,
});

/**
 * Maps PaperTradingExecutorError onto HTTP responses (US016).
 * Catches only executor-domain errors.
 */
@Catch(PaperTradingExecutorError)
export class PaperTradingExecutorErrorFilter implements ExceptionFilter {
  catch(exception: PaperTradingExecutorError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<ReplyLike>();
    const status = STATUS_BY_CODE[exception.code] ?? HttpStatus.BAD_REQUEST;

    void response.code(status).send({
      statusCode: status,
      code: exception.code,
      message: exception.message,
    });
  }
}
