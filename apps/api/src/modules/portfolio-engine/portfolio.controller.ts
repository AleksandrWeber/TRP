import {
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  NotFoundException,
  Post,
  Req,
} from '@nestjs/common';
import { requireWorkspaceId } from '../../common/workspace/require-workspace';
import type { AuthUser } from '../auth/jwt.strategy';
import { WorkspaceDomainService } from '../workspace';
import {
  PortfolioArchivedError,
  PortfolioError,
  PortfolioInvalidStateError,
  PortfolioNotFoundError,
  PortfolioResetForbiddenError,
  PortfolioValidationError,
} from './portfolio-errors';
import { PortfolioService } from './portfolio.service';

type RequestWithUser = { user: AuthUser };

/**
 * Portfolio Engine REST API (US204).
 * Read endpoints + development-only reset. No exchange or execution.
 */
@Controller({ path: 'portfolio', version: '1' })
export class PortfolioController {
  constructor(
    private readonly portfolios: PortfolioService,
    private readonly workspaces: WorkspaceDomainService,
  ) {}

  @Get()
  async getPortfolio(
    @Req() req: RequestWithUser,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.portfolios.getOrCreate(workspaceId, req.user.userId);
    });
  }

  @Get('balance')
  async getBalance(
    @Req() req: RequestWithUser,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      await this.portfolios.getOrCreate(workspaceId, req.user.userId);
      return this.portfolios.getBalance(workspaceId);
    });
  }

  @Get('equity')
  async getEquity(
    @Req() req: RequestWithUser,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      await this.portfolios.getOrCreate(workspaceId, req.user.userId);
      return this.portfolios.getEquity(workspaceId);
    });
  }

  @Get('margin')
  async getMargin(
    @Req() req: RequestWithUser,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      await this.portfolios.getOrCreate(workspaceId, req.user.userId);
      return this.portfolios.getMargin(workspaceId);
    });
  }

  @Get('snapshots')
  async getSnapshots(
    @Req() req: RequestWithUser,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      await this.portfolios.getOrCreate(workspaceId, req.user.userId);
      return this.portfolios.listSnapshots(workspaceId);
    });
  }

  @Post('reset')
  async reset(@Req() req: RequestWithUser, @Headers('x-workspace-id') workspaceIdHeader?: string) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      await this.portfolios.getOrCreate(workspaceId, req.user.userId);
      return this.portfolios.reset(workspaceId);
    });
  }

  private workspace(workspaceIdHeader?: string): string {
    return requireWorkspaceId(workspaceIdHeader, this.workspaces);
  }

  private async run<T>(action: () => Promise<T>): Promise<T> {
    try {
      return await action();
    } catch (error) {
      throw mapPortfolioError(error);
    }
  }
}

function mapPortfolioError(error: unknown): Error {
  if (error instanceof HttpException) return error;
  if (error instanceof PortfolioNotFoundError) {
    return new NotFoundException(error.message);
  }
  if (error instanceof PortfolioResetForbiddenError) {
    return new ForbiddenException(error.message);
  }
  if (
    error instanceof PortfolioValidationError ||
    error instanceof PortfolioInvalidStateError ||
    error instanceof PortfolioArchivedError
  ) {
    return new HttpException(
      { statusCode: HttpStatus.BAD_REQUEST, message: error.message, code: error.code },
      HttpStatus.BAD_REQUEST,
    );
  }
  if (error instanceof PortfolioError) {
    return new HttpException(
      { statusCode: HttpStatus.BAD_REQUEST, message: error.message, code: error.code },
      HttpStatus.BAD_REQUEST,
    );
  }
  return error instanceof Error ? error : new Error(String(error));
}
