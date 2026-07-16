import { Module } from '@nestjs/common';
import { ResearchAnalysisController } from './research-analysis.controller';
import { ResearchAnalysisService } from './research-analysis.service';

@Module({
  controllers: [ResearchAnalysisController],
  providers: [ResearchAnalysisService],
  exports: [ResearchAnalysisService],
})
export class ResearchAnalysisModule {}
