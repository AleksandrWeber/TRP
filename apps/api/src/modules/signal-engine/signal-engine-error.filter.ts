import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { SignalEngineError, type SignalEngineErrorCode } from './domain/signal-engine.error';

type ReplyLike = {
  code: (status: number) => { send: (body: unknown) => unknown };
};

const STATUS_BY_CODE: Readonly<Record<SignalEngineErrorCode, HttpStatus>> = Object.freeze({
  UNKNOWN_EVALUATOR: HttpStatus.BAD_REQUEST,
  EMPTY_CANDLE_SERIES: HttpStatus.BAD_GATEWAY,
});

/**
 * Maps SignalEngineError instances onto HTTP responses (US009).
 * Registered via APP_FILTER in SignalEngineModule; catches only signal-engine
 * domain errors — every other exception (including MarketDataDomainError from
 * the candle loader, US007) keeps its existing handling.
 */
@Catch(SignalEngineError)
export class SignalEngineErrorFilter implements ExceptionFilter {
  catch(exception: SignalEngineError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<ReplyLike>();
    const status = STATUS_BY_CODE[exception.code] ?? HttpStatus.BAD_GATEWAY;

    void response.code(status).send({
      statusCode: status,
      code: exception.code,
      message: exception.message,
    });
  }
}
