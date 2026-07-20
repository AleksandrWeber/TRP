import { Injectable } from '@nestjs/common';
import { resolveApplicationVersion } from './modules/health/application-version';

@Injectable()
export class AppService {
  getRoot() {
    return {
      name: 'TRP API',
      version: resolveApplicationVersion(),
      status: 'ok',
    };
  }
}
