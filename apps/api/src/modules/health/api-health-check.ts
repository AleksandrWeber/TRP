import { Injectable } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import type { ComponentStatus } from './health-status';

export type ApiHealthCheckResult = Readonly<{
  status: ComponentStatus;
  initialized: boolean;
  controllersRegistered: number;
  modulesRegistered: number;
  registeredModules: readonly string[];
  detail: string;
}>;

/**
 * Verifies the Nest application is initialized and controllers are registered.
 */
@Injectable()
export class ApiHealthCheck {
  constructor(private readonly modulesContainer: ModulesContainer) {}

  check(): ApiHealthCheckResult {
    let controllersRegistered = 0;
    const registeredModules: string[] = [];

    for (const moduleRef of this.modulesContainer.values()) {
      controllersRegistered += moduleRef.controllers.size;
      const name = moduleRef.metatype?.name;
      if (typeof name === 'string' && name.length > 0) {
        registeredModules.push(name);
      }
    }

    registeredModules.sort();
    const modulesRegistered = this.modulesContainer.size;
    const initialized = modulesRegistered > 0;
    const status: ComponentStatus = initialized && controllersRegistered > 0 ? 'up' : 'down';

    return {
      status,
      initialized,
      controllersRegistered,
      modulesRegistered,
      registeredModules,
      detail:
        status === 'up'
          ? `API initialized with ${controllersRegistered} controller(s) across ${modulesRegistered} module(s)`
          : 'API not fully initialized or no controllers registered',
    };
  }
}
