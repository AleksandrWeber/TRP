import { Module } from '@nestjs/common';
import { ResearchAnalysisService } from './research-analysis.service';

@Module({
  providers: [ResearchAnalysisService],
  exports: [ResearchAnalysisService],
})
export class ResearchAnalysisModule {}
