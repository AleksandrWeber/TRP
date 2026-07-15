import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './modules/health/health.module';
import { DatasetsModule } from './modules/datasets/datasets.module';
import { ExperimentsModule } from './modules/experiments/experiments.module';
import { ProductionModule } from './modules/production/production.module';
import { PrismaModule } from './storage/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    HealthModule,
    DatasetsModule,
    ExperimentsModule,
    ProductionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
