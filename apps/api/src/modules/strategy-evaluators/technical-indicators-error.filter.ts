import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import {
  TechnicalIndicatorsError,
  type TechnicalIndicatorsErrorCode,
} from '../technical-indicators';

type ReplyLike = {
  code: (status: number) => { send: (body: unknown) => unknown };
};

const STATUS_BY_CODE: Readonly<Record<TechnicalIndicatorsErrorCode, HttpStatus>> = Object.freeze({
  // Strategy misconfiguration — the caller can fix the request.
  UNKNOWN_INDICATOR: HttpStatus.BAD_REQUEST,
  INVALID_PERIOD: HttpStatus.BAD_REQUEST,
  INSUFFICIENT_INPUT: HttpStatus.BAD_REQUEST,
  // The candle pipeline delivered non-finite data — an upstream fault.
  INVALID_INPUT: HttpStatus.BAD_GATEWAY,
  // Registration-time error; must never surface during a request.
  DUPLICATE_INDICATOR: HttpStatus.INTERNAL_SERVER_ERROR,
});

/**
 * Maps TechnicalIndicatorsError instances escaping indicator-backed
 * evaluators onto HTTP responses (US012). Registered via APP_FILTER in
 * StrategyEvaluatorsModule — the same boundary pattern as the signal-engine
 * and market-data filters (US007/US009). Catches only indicator errors;
 * everything else keeps its existing handling.
 */
@Catch(TechnicalIndicatorsError)
export class TechnicalIndicatorsErrorFilter implements ExceptionFilter {
  catch(exception: TechnicalIndicatorsError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<ReplyLike>();
    const status = STATUS_BY_CODE[exception.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;

    void response.code(status).send({
      statusCode: status,
      code: exception.code,
      message: exception.message,
    });
  }
}
