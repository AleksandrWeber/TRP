import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateStrategyDeploymentBodyDto } from './strategy-deployment.dto';

describe('CreateStrategyDeploymentBodyDto (US211)', () => {
  it('accepts a valid create body', () => {
    const dto = plainToInstance(CreateStrategyDeploymentBodyDto, {
      strategyId: 'strategy-1',
      strategyVersion: '1.0.0',
      parameters: { fast: 12 },
      instrument: 'BTCUSDT',
      timeframe: '1h',
      marketDataSourceId: 'binance-spot',
      paperExecutionConfigurationId: 'paper-config-us167',
      riskPolicyId: 'm2-baseline-paper-risk',
      riskPolicyVersion: 1,
    });
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('accepts optional libraryEntryId', () => {
    const dto = plainToInstance(CreateStrategyDeploymentBodyDto, {
      strategyId: 'strategy-1',
      strategyVersion: '1.0.0',
      libraryEntryId: 'lib-entry-1',
      parameters: {},
      instrument: 'BTCUSDT',
      timeframe: '1h',
      marketDataSourceId: 'binance-spot',
      paperExecutionConfigurationId: 'paper-config-us167',
      riskPolicyId: 'm2-baseline-paper-risk',
      riskPolicyVersion: 1,
    });
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('rejects unsupported timeframe and non-positive risk policy version', () => {
    const dto = plainToInstance(CreateStrategyDeploymentBodyDto, {
      strategyId: 'strategy-1',
      strategyVersion: '1.0.0',
      parameters: {},
      instrument: 'BTCUSDT',
      timeframe: '2h',
      marketDataSourceId: 'binance-spot',
      paperExecutionConfigurationId: 'paper-config',
      riskPolicyId: 'policy',
      riskPolicyVersion: 0,
    });
    const errors = validateSync(dto);
    expect(errors.some((error) => error.property === 'timeframe')).toBe(true);
    expect(errors.some((error) => error.property === 'riskPolicyVersion')).toBe(true);
  });
});
