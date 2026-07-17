import { Module } from '@nestjs/common';
import { CampaignReplayModule } from '../campaign-replay/campaign-replay.module';
import { ResearchCampaignModule } from '../research-campaign/research-campaign.module';
import { BackgroundJobRunner } from './background-job.runner';
import { InMemoryJobQueue } from './in-memory-job.queue';
import { JobController } from './job.controller';
import { JOB_QUEUE } from './job-queue.token';
import { JobService } from './job.service';

/**
 * Asynchronous Jobs Nest module (US069–US073).
 * JobService → JOB_QUEUE → InMemoryJobQueue
 * BackgroundJobRunner → Campaign / Replay services (no job persistence)
 * JobController → GET /jobs + POST /jobs/:jobId/cancel
 */
@Module({
  imports: [ResearchCampaignModule, CampaignReplayModule],
  controllers: [JobController],
  providers: [
    {
      provide: JOB_QUEUE,
      useClass: InMemoryJobQueue,
    },
    JobService,
    BackgroundJobRunner,
  ],
  exports: [JobService, JOB_QUEUE, BackgroundJobRunner],
})
export class JobsModule {}
