import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { InvalidEvaluatorConfigError } from './evaluator-config.error';

type ReplyLike = {
  code: (status: number) => { send: (body: unknown) => unknown };
};

/**
 * Maps InvalidEvaluatorConfigError instances escaping strategy evaluators
 * onto HTTP 400 responses (US014). Registered via APP_FILTER in
 * StrategyEvaluatorsModule — the same boundary pattern as
 * TechnicalIndicatorsErrorFilter (US012). A misconfigured strategy is a
 * caller mistake, never a server fault.
 */
@Catch(InvalidEvaluatorConfigError)
export class EvaluatorConfigErrorFilter implements ExceptionFilter {
  catch(exception: InvalidEvaluatorConfigError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<ReplyLike>();

    void response.code(HttpStatus.BAD_REQUEST).send({
      statusCode: HttpStatus.BAD_REQUEST,
      code: exception.code,
      message: exception.message,
    });
  }
}
