import 'reflect-metadata';
import { BadRequestException, type ArgumentMetadata } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CampaignController } from '../../modules/research-campaign/campaign.controller';
import { createValidationPipe } from '../create-validation-pipe';
import { RunCampaignBodyDto } from './campaign.dto';

const metadata: ArgumentMetadata = { type: 'body', metatype: RunCampaignBodyDto };

beforeEach(() => {
  // Nest compiles this property as design:type Array. Vitest does not emit that
  // metadata, so install the same reflected type the API compiler emits.
  Reflect.defineMetadata('design:type', Array, RunCampaignBodyDto.prototype, 'paramsList');
});

function pipe() {
  return createValidationPipe();
}

function transform(value: unknown) {
  return pipe().transform(value, metadata) as Promise<RunCampaignBodyDto>;
}

function controllerWith(run: ReturnType<typeof vi.fn>) {
  return new CampaignController(
    { run } as never,
    { run: vi.fn() } as never,
    { run: vi.fn() } as never,
  );
}

describe('RunCampaignBodyDto through the configured ValidationPipe', () => {
  const paramsList = [{ channelPeriod: 10 }, { channelPeriod: 20 }];

  it('keeps two parameter objects and their numeric values in order', async () => {
    const body = await transform({
      datasetId: 'ds-1',
      strategyId: 'donchian-breakout',
      paramsList,
    });

    expect(body.paramsList).toEqual(paramsList);
    expect(body.paramsList?.map((params) => Array.isArray(params))).toEqual([false, false]);
    expect(body.paramsList?.[0]?.channelPeriod).toBe(10);
    expect(body.paramsList?.[1]?.channelPeriod).toBe(20);
    expect(typeof body.paramsList?.[0]?.channelPeriod).toBe('number');
    expect(typeof body.paramsList?.[1]?.channelPeriod).toBe('number');
  });

  it('keeps an empty parameter object as an object', async () => {
    const body = await transform({
      datasetId: 'ds-1',
      strategyId: 'donchian-breakout',
      paramsList: [{}],
    });

    expect(body.paramsList).toEqual([{}]);
    expect(Array.isArray(body.paramsList?.[0])).toBe(false);
  });

  it('does not coerce a string parameter into a number', async () => {
    const body = await transform({
      datasetId: 'ds-1',
      strategyId: 'donchian-breakout',
      paramsList: [{ label: '10' }],
    });

    expect(body.paramsList).toEqual([{ label: '10' }]);
  });

  it('keeps a string strategy id unchanged', async () => {
    const body = await transform({
      datasetId: 'ds-1',
      strategyId: 'donchian-breakout',
      paramsList,
    });

    expect(body.strategyId).toBe('donchian-breakout');
  });

  it('rejects primitive parameter elements', async () => {
    await expect(
      transform({
        datasetId: 'ds-1',
        strategyId: 'donchian-breakout',
        paramsList: [10],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects nested arrays', async () => {
    await expect(
      transform({
        datasetId: 'ds-1',
        strategyId: 'donchian-breakout',
        paramsList: [[{ channelPeriod: 10 }]],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a non-array paramsList', async () => {
    await expect(
      transform({
        datasetId: 'ds-1',
        strategyId: 'donchian-breakout',
        paramsList: { channelPeriod: 10 },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('still rejects missing dataset, strategy, and parameter list in the controller', async () => {
    const run = vi.fn();
    const campaigns = controllerWith(run);

    const missingDataset = await transform({
      strategyId: 'donchian-breakout',
      paramsList,
    });
    await expect(campaigns.run(missingDataset)).rejects.toThrow('datasetId is required');

    const missingStrategy = await transform({
      datasetId: 'ds-1',
      paramsList,
    });
    await expect(campaigns.run(missingStrategy)).rejects.toThrow('strategyId is required');

    const emptyParams = await transform({
      datasetId: 'ds-1',
      strategyId: 'donchian-breakout',
      paramsList: [],
    });
    await expect(campaigns.run(emptyParams)).rejects.toThrow(
      'paramsList must be a non-empty array',
    );
    expect(run).not.toHaveBeenCalled();
  });

  it('passes the original parameter objects to the campaign controller', async () => {
    const body = await transform({
      datasetId: 'ds-1',
      strategyId: 'donchian-breakout',
      paramsList,
    });
    const run = vi.fn().mockResolvedValue({
      summary: {
        campaignId: 'camp-1',
        strategyId: 'donchian-breakout',
        datasetId: 'ds-1',
        totalRuns: 2,
        passCount: 0,
        failCount: 0,
        needsReviewCount: 0,
        bestExperimentId: null,
        createdAt: '2026-11-18T00:00:00.000Z',
        failedRuns: [],
      },
      experiments: [],
    });
    const campaigns = controllerWith(run);

    await campaigns.run(body);

    expect(run).toHaveBeenCalledWith({
      datasetId: 'ds-1',
      strategyId: 'donchian-breakout',
      paramsList,
    });
  });
});
