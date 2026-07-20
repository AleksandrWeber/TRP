import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { RuntimeHealthService } from './runtime-health.service';

/**
 * Public runtime health endpoint (RC-01).
 * Remains VERSION_NEUTRAL so probes hit GET /health without /v1.
 */
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class RuntimeHealthController {
  constructor(private readonly runtimeHealthService: RuntimeHealthService) {}

  @Public()
  @Get()
  async getHealth() {
    return this.runtimeHealthService.check();
  }
}

/** @deprecated Prefer RuntimeHealthController. */
export { RuntimeHealthController as HealthController };
