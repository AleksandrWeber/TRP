import { Module } from '@nestjs/common';
import { WorkspaceModule } from '../workspace';
import { ResearchControlCenterController } from './research-control-center.controller';
import { ResearchControlCenterService } from './research-control-center.service';
import { ResearchControlCenterStore } from './research-control-center.store';

@Module({
  imports: [WorkspaceModule],
  controllers: [ResearchControlCenterController],
  providers: [ResearchControlCenterStore, ResearchControlCenterService],
  exports: [ResearchControlCenterService],
})
export class ResearchControlCenterModule {}
