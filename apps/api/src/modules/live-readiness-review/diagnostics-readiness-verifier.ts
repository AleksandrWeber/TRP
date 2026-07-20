import {
  createEventEmissionFailingNotifier,
  EVENT_EMISSION_FAILURE_MESSAGE,
  SMOKE_COMPLETION_EVENT,
} from '../chaos-testing';
import { createSmokeBenchmarkDependencies } from '../performance-benchmark';
import { SmokeBacktestService } from '../smoke-backtest';
import { createReadinessCheck } from './readiness-check';
import {
  buildReadinessCategoryResult,
  type ReadinessCategoryResult,
} from './readiness-category-result';
import type { ExecutionServiceFactories } from './execution-readiness-verifier';

/**
 * Diagnostics readiness verification for US200.
 */

export type DiagnosticsReadinessContext = Readonly<{
  clock: () => string;
  factories: ExecutionServiceFactories;
}>;

export async function verifyDiagnosticsReadiness(
  context: DiagnosticsReadinessContext,
): Promise<ReadinessCategoryResult> {
  const checks = [
    await verifyDiagnosticsAvailable(context),
    await verifyInfrastructureFailuresRecorded(context),
    await verifyEventEmissionDiagnosticsAvailable(context),
  ];

  const recommendations = checks
    .filter((check) => !check.passed)
    .map((check) => `Enable diagnostics coverage: ${check.description}`);

  return buildReadinessCategoryResult('Diagnostics', checks, recommendations);
}

async function verifyDiagnosticsAvailable(
  context: DiagnosticsReadinessContext,
): Promise<ReturnType<typeof createReadinessCheck>> {
  try {
    const service = context.factories.createSmokeBacktestService();
    await service.execute();
    const diagnosticsAvailable = typeof service.eventEmissionDiagnostics === 'function';

    return createReadinessCheck({
      checkId: 'diagnostics-available',
      description: 'Execution diagnostics are available after a completed run',
      passed: diagnosticsAvailable,
      warning: false,
    });
  } catch {
    return createReadinessCheck({
      checkId: 'diagnostics-available',
      description: 'Execution diagnostics are available after a completed run',
      passed: false,
      warning: false,
    });
  }
}

async function verifyInfrastructureFailuresRecorded(
  context: DiagnosticsReadinessContext,
): Promise<ReturnType<typeof createReadinessCheck>> {
  try {
    const service = SmokeBacktestService.create({
      ...createSmokeBenchmarkDependencies({
        clock: context.clock,
      }),
      applicationEventNotifier: createEventEmissionFailingNotifier([SMOKE_COMPLETION_EVENT]),
    });
    await service.execute();
    const diagnostics = service.eventEmissionDiagnostics();
    const infrastructureFailuresRecorded = diagnostics.some(
      (diagnostic) => diagnostic.message === EVENT_EMISSION_FAILURE_MESSAGE,
    );

    return createReadinessCheck({
      checkId: 'diagnostics-infrastructure-failures',
      description: 'Infrastructure failures are recorded in event emission diagnostics',
      passed: infrastructureFailuresRecorded,
      warning: false,
    });
  } catch {
    return createReadinessCheck({
      checkId: 'diagnostics-infrastructure-failures',
      description: 'Infrastructure failures are recorded in event emission diagnostics',
      passed: false,
      warning: false,
    });
  }
}

async function verifyEventEmissionDiagnosticsAvailable(
  context: DiagnosticsReadinessContext,
): Promise<ReturnType<typeof createReadinessCheck>> {
  try {
    const service = context.factories.createSmokeBacktestService();
    await service.execute();
    const diagnostics = service.eventEmissionDiagnostics();

    return createReadinessCheck({
      checkId: 'diagnostics-event-emission',
      description: 'Event emission diagnostics are available on execution services',
      passed: Array.isArray(diagnostics),
      warning: false,
    });
  } catch {
    return createReadinessCheck({
      checkId: 'diagnostics-event-emission',
      description: 'Event emission diagnostics are available on execution services',
      passed: false,
      warning: false,
    });
  }
}
