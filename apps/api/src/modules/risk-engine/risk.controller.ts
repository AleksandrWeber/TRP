import {
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { requireWorkspaceId } from '../../common/workspace/require-workspace';
import type { AuthUser } from '../auth/jwt.strategy';
import { WorkspaceDomainService } from '../workspace';
import {
  RiskError,
  RiskPolicyNotFoundError,
  RiskRejectedError,
  RiskValidationError,
} from './risk-errors';
import { RiskService } from './risk.service';

type RequestWithUser = { user: AuthUser };

/**
 * Risk Engine REST API (US207).
 * Path `risk` — trading platform gatekeeper; distinct from paper risk decisions.
 * Never executes orders or mutates portfolio/position.
 */
@Controller({ path: 'risk', version: '1' })
export class RiskController {
  constructor(
    private readonly risk: RiskService,
    private readonly workspaces: WorkspaceDomainService,
  ) {}

  @Post('evaluate')
  async evaluate(
    @Req() req: RequestWithUser,
    @Body()
    body: {
      orderId?: string;
      symbol?: string;
      side?: string;
      type?: string;
      quantity?: string;
      requestedPrice?: string | null;
      referencePrice?: string | null;
    },
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.risk.evaluate(workspaceId, req.user.userId, {
        orderId: String(body.orderId ?? ''),
        symbol: String(body.symbol ?? ''),
        side: String(body.side ?? ''),
        type: String(body.type ?? ''),
        quantity: String(body.quantity ?? ''),
        requestedPrice:
          body.requestedPrice === undefined || body.requestedPrice === null
            ? body.requestedPrice
            : String(body.requestedPrice),
        referencePrice:
          body.referencePrice === undefined || body.referencePrice === null
            ? body.referencePrice
            : String(body.referencePrice),
      });
    });
  }

  @Get('history')
  async history(
    @Req() req: RequestWithUser,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.risk.listHistory(workspaceId, req.user.userId);
    });
  }

  @Get('decisions')
  async decisions(
    @Req() req: RequestWithUser,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.risk.listDecisions(workspaceId, req.user.userId);
    });
  }

  @Get('policies')
  async policies(
    @Req() req: RequestWithUser,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.risk.listPolicies(workspaceId, req.user.userId);
    });
  }

  @Get('summary')
  async summary(
    @Req() req: RequestWithUser,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.risk.getSummary(workspaceId, req.user.userId);
    });
  }

  @Patch('policies/:id')
  async updatePolicy(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body()
    body: {
      enabled?: boolean;
      priority?: number;
      configuration?: Record<string, unknown>;
    },
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.risk.updatePolicy(workspaceId, req.user.userId, id, {
        enabled: body.enabled,
        priority: body.priority,
        configuration: body.configuration,
      });
    });
  }

  private workspace(workspaceIdHeader?: string): string {
    return requireWorkspaceId(workspaceIdHeader, this.workspaces);
  }

  private async run<T>(action: () => Promise<T>): Promise<T> {
    try {
      return await action();
    } catch (error) {
      throw mapRiskError(error);
    }
  }
}

function mapRiskError(error: unknown): Error {
  if (error instanceof HttpException) return error;
  if (error instanceof RiskPolicyNotFoundError) {
    return new NotFoundException(error.message);
  }
  if (error instanceof RiskValidationError || error instanceof RiskRejectedError) {
    return new HttpException(
      { statusCode: HttpStatus.BAD_REQUEST, message: error.message, code: error.code },
      HttpStatus.BAD_REQUEST,
    );
  }
  if (error instanceof RiskError) {
    return new HttpException(
      { statusCode: HttpStatus.BAD_REQUEST, message: error.message, code: error.code },
      HttpStatus.BAD_REQUEST,
    );
  }
  return error instanceof Error ? error : new Error(String(error));
}
