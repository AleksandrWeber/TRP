import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../storage/prisma/prisma.module';
import type { ComponentStatus } from './health-status';

export type DatabaseHealthCheckResult = Readonly<{
  status: ComponentStatus;
  detail: string;
}>;

/**
 * Verifies database reachability with a lightweight query.
 */
@Injectable()
export class DatabaseHealthCheck {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<DatabaseHealthCheckResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'up',
        detail: 'Database reachable',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        status: 'down',
        detail: `Database unreachable: ${message}`,
      };
    }
  }
}
