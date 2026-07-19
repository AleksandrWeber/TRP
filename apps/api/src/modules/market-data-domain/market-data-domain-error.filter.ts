import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import {
  MarketDataDomainError,
  type MarketDataDomainErrorCode,
} from './domain/market-data-domain.error';

type ReplyLike = {
  code: (status: number) => { send: (body: unknown) => unknown };
};

const STATUS_BY_CODE: Readonly<Record<MarketDataDomainErrorCode, HttpStatus>> = Object.freeze({
  UNSUPPORTED_SYMBOL: HttpStatus.BAD_REQUEST,
  UNSUPPORTED_TIMEFRAME: HttpStatus.BAD_REQUEST,
  PROVIDER_UNAVAILABLE: HttpStatus.BAD_GATEWAY,
  PROVIDER_TIMEOUT: HttpStatus.GATEWAY_TIMEOUT,
});

/**
 * Maps MarketDataDomainError instances onto HTTP responses (US007).
 * Registered via APP_FILTER in MarketDataDomainModule; catches only domain
 * errors, so every other exception keeps its existing behavior. Consumers and
 * the controller stay provider-agnostic — they never handle provider failures.
 */
@Catch(MarketDataDomainError)
export class MarketDataDomainErrorFilter implements ExceptionFilter {
  catch(exception: MarketDataDomainError, host: ArgumentsHost): void {
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
