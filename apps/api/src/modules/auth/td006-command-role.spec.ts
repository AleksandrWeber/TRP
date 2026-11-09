import { ExecutionContext, type Type } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';
import { ExchangeAdapterController } from '../exchange-adapter/exchange-adapter.controller';
import { Role } from '../identity/role';
import { PaperTradingController as ManualPaperTradingController } from '../paper-trading/paper-trading.controller';
import { PaperTradingController as PaperTradingEngineController } from '../paper-trading-engine/paper-trading.controller';
import { PortfolioController } from '../portfolio-engine/portfolio.controller';
import { RiskController } from '../risk-engine/risk.controller';
import { collectControllerHandlers } from './surface-coverage';
import { PermissionClass } from './permission-catalog';
import { RolesGuard } from './roles.guard';
import type { AuthUser } from './jwt.strategy';

function user(role: Role): AuthUser {
  return { userId: 'user-1', email: 'op@trp.local', displayName: 'Operator', role };
}

function contextFor(controller: Type<object>, handler: string, caller: AuthUser): ExecutionContext {
  return {
    getHandler: () => (controller.prototype as Record<string, unknown>)[handler],
    getClass: () => controller,
    switchToHttp: () => ({
      getRequest: () => ({ user: caller }),
    }),
  } as unknown as ExecutionContext;
}

const COMMANDS: ReadonlyArray<readonly [Type<object>, string]> = [
  [ManualPaperTradingController, 'execute'],
  [PaperTradingEngineController, 'createSession'],
  [PaperTradingEngineController, 'startSession'],
  [PaperTradingEngineController, 'pauseSession'],
  [PaperTradingEngineController, 'stopSession'],
  [PaperTradingEngineController, 'completeSession'],
  [PaperTradingEngineController, 'deleteSession'],
  [ExchangeAdapterController, 'connect'],
  [ExchangeAdapterController, 'disconnect'],
  [PortfolioController, 'reset'],
  [RiskController, 'updatePolicy'],
];

const SIBLINGS: ReadonlyArray<readonly [Type<object>, string, PermissionClass]> = [
  [ManualPaperTradingController, 'positions', PermissionClass.Projection],
  [ManualPaperTradingController, 'history', PermissionClass.Projection],
  [ManualPaperTradingController, 'portfolio', PermissionClass.Projection],
  [PaperTradingEngineController, 'listSessions', PermissionClass.Projection],
  [PaperTradingEngineController, 'getSession', PermissionClass.Projection],
  [PaperTradingEngineController, 'listOrders', PermissionClass.Projection],
  [PaperTradingEngineController, 'listPositions', PermissionClass.Projection],
  [PaperTradingEngineController, 'getPortfolio', PermissionClass.Projection],
  [PaperTradingEngineController, 'listExecutions', PermissionClass.Projection],
  [PaperTradingEngineController, 'listEvents', PermissionClass.Projection],
  [PaperTradingEngineController, 'getStatistics', PermissionClass.Projection],
  [ExchangeAdapterController, 'list', PermissionClass.Projection],
  [ExchangeAdapterController, 'status', PermissionClass.Projection],
  [ExchangeAdapterController, 'capabilities', PermissionClass.Projection],
  [ExchangeAdapterController, 'get', PermissionClass.Projection],
  [PortfolioController, 'getPortfolio', PermissionClass.Projection],
  [PortfolioController, 'getBalance', PermissionClass.Projection],
  [PortfolioController, 'getEquity', PermissionClass.Projection],
  [PortfolioController, 'getMargin', PermissionClass.Projection],
  [PortfolioController, 'getSnapshots', PermissionClass.Projection],
  [RiskController, 'evaluate', PermissionClass.Research],
  [RiskController, 'history', PermissionClass.Projection],
  [RiskController, 'decisions', PermissionClass.Projection],
  [RiskController, 'policies', PermissionClass.Projection],
  [RiskController, 'summary', PermissionClass.Projection],
];

describe('TD-006 command and sibling role classification', () => {
  const guard = new RolesGuard(new Reflector());

  it('keeps the 11 paper-command handlers on C5', () => {
    expect(COMMANDS).toHaveLength(11);
    for (const [controller, handler] of COMMANDS) {
      const found = collectControllerHandlers(controller).find(
        (entry) => entry.handler === handler,
      );
      expect(found?.permission, `${controller.name}.${handler}`).toBe(PermissionClass.PaperCommand);
    }
  });

  it('keeps the 25 sibling handlers on Projection or Research', () => {
    expect(SIBLINGS).toHaveLength(25);
    for (const [controller, handler, permission] of SIBLINGS) {
      const found = collectControllerHandlers(controller).find(
        (entry) => entry.handler === handler,
      );
      expect(found?.permission, `${controller.name}.${handler}`).toBe(permission);
    }
  });

  it.each(COMMANDS)(
    'denies Reader and Researcher on %s.%s and still allows Trader and Admin',
    (controller, handler) => {
      expect(guard.canActivate(contextFor(controller, handler, user(Role.Reader)))).toBe(false);
      expect(guard.canActivate(contextFor(controller, handler, user(Role.Researcher)))).toBe(false);
      expect(guard.canActivate(contextFor(controller, handler, user(Role.Trader)))).toBe(true);
      expect(guard.canActivate(contextFor(controller, handler, user(Role.Admin)))).toBe(true);
    },
  );

  it('keeps research evaluation on C4 and projections readable by Reader', () => {
    expect(guard.canActivate(contextFor(RiskController, 'evaluate', user(Role.Reader)))).toBe(
      false,
    );
    expect(guard.canActivate(contextFor(RiskController, 'evaluate', user(Role.Researcher)))).toBe(
      true,
    );
    expect(
      guard.canActivate(contextFor(ManualPaperTradingController, 'positions', user(Role.Reader))),
    ).toBe(true);
  });
});
