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
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { ProductionModule } from './modules/production/production.module';
import { ResearchAnalysisModule } from './modules/research-analysis/research-analysis.module';
import { CampaignExportModule } from './modules/campaign-export/campaign-export.module';
import { ResearchCampaignModule } from './modules/research-campaign/research-campaign.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { PrismaModule } from './storage/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    EventsModule,
    AuthModule,
    HealthModule,
    DatasetsModule,
    ExperimentsModule,
    KnowledgeModule,
    ResearchCampaignModule,
    CampaignExportModule,
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
