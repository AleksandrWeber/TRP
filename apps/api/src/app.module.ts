import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';
import { RolesGuard } from './modules/auth/roles.guard';
import { AiModule } from './modules/ai/ai.module';
import { DatasetsModule } from './modules/datasets/datasets.module';
import { EventsModule } from './modules/events/events.module';
import { ExperimentsModule } from './modules/experiments/experiments.module';
import { HealthModule } from './modules/health/health.module';
import { IdentityModule } from './modules/identity/identity.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { ProductionModule } from './modules/production/production.module';
import { ResearchAnalysisModule } from './modules/research-analysis/research-analysis.module';
import { CampaignExportModule } from './modules/campaign-export/campaign-export.module';
import { CampaignImportModule } from './modules/campaign-import/campaign-import.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { InsightModule } from './modules/insight/insight.module';
import { CrossCampaignAnalysisModule } from './modules/cross-campaign-analysis/cross-campaign-analysis.module';
import { RecommendationModule } from './modules/recommendation/recommendation.module';
import { ResearchReportModule } from './modules/research-report/research-report.module';
import { PipelineModule } from './modules/pipeline/pipeline.module';
import { ResearchCampaignModule } from './modules/research-campaign/research-campaign.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { PrismaModule } from './storage/prisma/prisma.module';
import { LoggingModule } from './logging/logging.module';
import { MetricsModule } from './metrics/metrics.module';
import { ValidationModule } from './validation/validation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    LoggingModule,
    MetricsModule,
    ValidationModule,
    PrismaModule,
    EventsModule,
    AuthModule,
    IdentityModule,
    WorkspaceModule,
    HealthModule,
    DatasetsModule,
    ExperimentsModule,
    KnowledgeModule,
    InsightModule,
    CrossCampaignAnalysisModule,
    RecommendationModule,
    ResearchReportModule,
    ResearchCampaignModule,
    PipelineModule,
    CampaignExportModule,
    CampaignImportModule,
    JobsModule,
    ResearchAnalysisModule,
    WorkflowModule,
    ProductionModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
