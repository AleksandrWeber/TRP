import {
  createPredefinedBenchmarkSuiteConfiguration,
  predefinedBenchmarkSuiteEntries,
} from '../performance-benchmark';
import { createPredefinedChaosTestingConfiguration } from '../chaos-testing';
import { createPredefinedRegressionSuiteConfiguration } from '../regression-suite';
import { createReadinessCheck } from './readiness-check';
import {
  buildReadinessCategoryResult,
  type ReadinessCategoryResult,
} from './readiness-category-result';
import type { LiveReadinessReviewConfiguration } from './live-readiness-review-configuration';
import {
  createLiveReadinessReviewConfiguration,
  type CreateLiveReadinessReviewConfigurationInput,
} from './live-readiness-review-configuration';

/**
 * Configuration readiness verification for US200.
 */

export type ConfigurationReadinessContext = Readonly<{
  configuration: LiveReadinessReviewConfiguration;
}>;

export function verifyConfigurationReadiness(
  context: ConfigurationReadinessContext,
): ReadinessCategoryResult {
  const checks = [
    verifyPredefinedConfigurationsValid(context),
    verifyDeterministicDatasetsAvailable(context),
  ];

  const recommendations = checks
    .filter((check) => !check.passed)
    .map((check) => `Fix configuration readiness issue: ${check.description}`);

  return buildReadinessCategoryResult('Configuration', checks, recommendations);
}

function verifyPredefinedConfigurationsValid(
  context: ConfigurationReadinessContext,
): ReturnType<typeof createReadinessCheck> {
  try {
    createLiveReadinessReviewConfiguration(
      context.configuration as CreateLiveReadinessReviewConfigurationInput,
    );
    createPredefinedBenchmarkSuiteConfiguration();
    createPredefinedRegressionSuiteConfiguration();
    createPredefinedChaosTestingConfiguration();

    return createReadinessCheck({
      checkId: 'configuration-predefined-valid',
      description: 'Predefined engineering suite configurations are valid',
      passed: true,
      warning: false,
    });
  } catch {
    return createReadinessCheck({
      checkId: 'configuration-predefined-valid',
      description: 'Predefined engineering suite configurations are valid',
      passed: false,
      warning: false,
    });
  }
}

function verifyDeterministicDatasetsAvailable(
  context: ConfigurationReadinessContext,
): ReturnType<typeof createReadinessCheck> {
  const dataset = context.configuration.deterministicDataset;
  const benchmarkEntries = predefinedBenchmarkSuiteEntries();
  const datasetsAvailable =
    dataset.candles.length > 0 && dataset.datasetId.trim() !== '' && benchmarkEntries.length > 0;

  return createReadinessCheck({
    checkId: 'configuration-deterministic-datasets',
    description: 'Deterministic datasets are available for readiness validation',
    passed: datasetsAvailable,
    warning: false,
  });
}
