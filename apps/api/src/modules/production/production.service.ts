import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../storage/prisma/prisma.module';

@Injectable()
export class ProductionService {
  constructor(private readonly prisma: PrismaService) {}

  listDeployments() {
    return this.prisma.strategyDeployment.findMany({
      orderBy: { approvedAt: 'desc' },
      include: {
        position: true,
        experiment: { select: { verdict: true, configHash: true } },
        _count: { select: { signals: true, executions: true } },
      },
    });
  }

  async getDeployment(id: string) {
    const deployment = await this.prisma.strategyDeployment.findUnique({
      where: { id },
      include: {
        position: true,
        experiment: { include: { dataset: true } },
        signals: { orderBy: { createdAt: 'desc' }, take: 20, include: { execution: true } },
        executions: { orderBy: { executedAt: 'desc' }, take: 20 },
      },
    });

    if (!deployment) {
      throw new NotFoundException(`Deployment ${id} not found`);
    }

    return deployment;
  }

  listExecutions(deploymentId?: string) {
    return this.prisma.execution.findMany({
      where: deploymentId ? { deploymentId } : undefined,
      orderBy: { executedAt: 'desc' },
      include: {
        deployment: { select: { symbol: true, strategyId: true } },
        signal: { select: { type: true, timestamp: true } },
      },
      take: 50,
    });
  }
}
