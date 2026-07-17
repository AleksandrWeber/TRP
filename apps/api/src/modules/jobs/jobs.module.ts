import { Module } from '@nestjs/common';
import { CampaignReplayModule } from '../campaign-replay/campaign-replay.module';
import { ResearchCampaignModule } from '../research-campaign/research-campaign.module';
import type { Metrics } from '../../metrics/metrics';
import { METRICS } from '../../metrics/metrics.token';
import { BackgroundJobRunner } from './background-job.runner';
import { JobController } from './job.controller';
import { JOB_QUEUE } from './job-queue.token';
import { JobService } from './job.service';
import { BullMQQueue } from './queue/bullmq.queue';
import { InMemoryQueue } from './queue/in-memory.queue';
import { resolveQueueDriver } from './queue/queue-driver';
import { resolveRetryPolicy } from './queue/retry-policy';

/**
 * Asynchronous Jobs Nest module (US069–US073, US110).
 * JobService → JOB_QUEUE → InMemoryQueue | BullMQQueue (QUEUE_DRIVER).
 * BackgroundJobRunner → acknowledge / retry via Queue abstraction.
 */
@Module({
  imports: [ResearchCampaignModule, CampaignReplayModule],
  controllers: [JobController],
  providers: [
    {
      provide: JOB_QUEUE,
      useFactory: (metrics: Metrics) => {
        const policy = resolveRetryPolicy();
        if (resolveQueueDriver() === 'bullmq') {
          return new BullMQQueue({ retryPolicy: policy, metrics });
        }
        return new InMemoryQueue(policy, { metrics });
      },
      inject: [METRICS],
    },
    JobService,
    BackgroundJobRunner,
  ],
  exports: [JobService, JOB_QUEUE, BackgroundJobRunner],
})
export class JobsModule {}
