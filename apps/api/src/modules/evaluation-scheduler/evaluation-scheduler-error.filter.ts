import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import {
  EvaluationSchedulerError,
  type EvaluationSchedulerErrorCode,
} from './domain/evaluation-scheduler.error';

type ReplyLike = {
  code: (status: number) => { send: (body: unknown) => unknown };
};

const STATUS_BY_CODE: Readonly<Record<EvaluationSchedulerErrorCode, HttpStatus>> = Object.freeze({
  INVALID_SCHEDULE: HttpStatus.BAD_REQUEST,
  INVALID_INTERVAL: HttpStatus.BAD_REQUEST,
  DUPLICATE_SCHEDULE: HttpStatus.CONFLICT,
  SCHEDULE_NOT_FOUND: HttpStatus.NOT_FOUND,
  STRATEGY_NOT_FOUND: HttpStatus.NOT_FOUND,
});

/**
 * Maps EvaluationSchedulerError onto HTTP responses (US015).
 * Catches only scheduler-domain errors.
 */
@Catch(EvaluationSchedulerError)
export class EvaluationSchedulerErrorFilter implements ExceptionFilter {
  catch(exception: EvaluationSchedulerError, host: ArgumentsHost): void {
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
