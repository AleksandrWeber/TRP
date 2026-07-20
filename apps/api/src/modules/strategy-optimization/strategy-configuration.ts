/**
 * Immutable strategy configuration candidate for US203 Strategy Optimization.
 */

export type StrategyParameters = Readonly<Record<string, unknown>>;

export type StrategyConfiguration = Readonly<{
  configurationId: string;
  parameters: StrategyParameters;
}>;

export type CreateStrategyConfigurationInput = Readonly<{
  configurationId: string;
  parameters?: StrategyParameters;
}>;

export function createStrategyConfiguration(
  input: CreateStrategyConfigurationInput,
): StrategyConfiguration {
  const configurationId = required(input.configurationId, 'configurationId');
  const parameters = freezeParameters(input.parameters ?? {});

  return Object.freeze({
    configurationId,
    parameters,
  });
}

function freezeParameters(parameters: StrategyParameters): StrategyParameters {
  return Object.freeze({ ...parameters });
}

function required(value: string, field: string): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (normalized === '') {
    throw new Error(`${field} is required`);
  }
  return normalized;
}
