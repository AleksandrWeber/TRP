import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getRoot() {
    return {
      name: 'TRP API',
      version: '0.1.0',
      status: 'ok',
    };
  }
}
