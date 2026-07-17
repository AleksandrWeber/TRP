import { Module } from '@nestjs/common';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeDomainService } from './knowledge-domain.service';
import { KnowledgeExtractionService } from './knowledge-extraction.service';
import { KnowledgeService } from './knowledge.service';

@Module({
  controllers: [KnowledgeController],
  providers: [KnowledgeService, KnowledgeExtractionService, KnowledgeDomainService],
  exports: [KnowledgeService, KnowledgeExtractionService, KnowledgeDomainService],
})
export class KnowledgeModule {}
