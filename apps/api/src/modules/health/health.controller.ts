import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { HealthService } from './health.service';

@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  async getHealth() {
    return this.healthService.check();
  }
}
