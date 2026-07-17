import { ConflictException, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import type { Job } from './job';
import { JobCancelConflictError } from './job-cancel-conflict.error';
import { JobService } from './job.service';

/**
 * Job Status + Cancellation API (US072–US073).
 * Status is read-only; cancel mutates PENDING → CANCELLED only.
 */
@Controller('jobs')
export class JobController {
  constructor(private readonly jobs: JobService) {}

  @Get()
  list(): Job[] {
    return this.jobs.listJobs();
  }

  @Get(':jobId')
  getById(@Param('jobId') jobId: string): Job {
    const job = this.jobs.getJob(jobId);
    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }
    return job;
  }

  @Post(':jobId/cancel')
  cancel(@Param('jobId') jobId: string): Job {
    try {
      const job = this.jobs.cancelJob(jobId);
      if (!job) {
        throw new NotFoundException(`Job ${jobId} not found`);
      }
      return job;
    } catch (error) {
      if (error instanceof JobCancelConflictError) {
        throw new ConflictException(
          `Job ${jobId} is already ${error.status} and cannot be cancelled`,
        );
      }
      throw error;
    }
  }
}
