import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Get()
  search(
    @Query('q') q?: string,
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('tag') tag?: string,
  ) {
    return this.knowledgeService.search({ q, type, category, tag });
  }

  @Post('backfill')
  backfill() {
    return this.knowledgeService.backfillFromExperiments();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.knowledgeService.get(id);
  }

  @Post()
  create(
    @Body()
    body: {
      type: string;
      title: string;
      description: string;
      category: string;
      tags?: string[];
      validationStatus: string;
      workflowId?: string;
      experimentId?: string;
      authorEmail?: string;
      payload: Record<string, unknown>;
      parentId?: string;
    },
  ) {
    return this.knowledgeService.create(body);
  }
}
