import { ConflictException, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { JobIdParamDto } from '../../validation';
import type { Job } from './job';
import { JobCancelConflictError } from './job-cancel-conflict.error';
import { JobService } from './job.service';

/**
 * Job Status + Cancellation API (US072–US073).
 * Status is read-only; cancel mutates PENDING → CANCELLED only.
 */
@Controller({ path: 'jobs', version: '1' })
export class JobController {
  constructor(private readonly jobs: JobService) {}

  @Get()
  list(): Job[] {
    return this.jobs.listJobs();
  }

  @Get(':jobId')
  getById(@Param() params: JobIdParamDto): Job {
    const job = this.jobs.getJob(params.jobId);
    if (!job) {
      throw new NotFoundException(`Job ${params.jobId} not found`);
    }
    return job;
  }

  @Post(':jobId/cancel')
  cancel(@Param() params: JobIdParamDto): Job {
    try {
      const job = this.jobs.cancelJob(params.jobId);
      if (!job) {
        throw new NotFoundException(`Job ${params.jobId} not found`);
      }
      return job;
    } catch (error) {
      if (error instanceof JobCancelConflictError) {
        throw new ConflictException(
          `Job ${params.jobId} is already ${error.status} and cannot be cancelled`,
        );
      }
      throw error;
    }
  }
}
