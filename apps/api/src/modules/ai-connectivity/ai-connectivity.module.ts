import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { PrismaModule } from '../../storage/prisma/prisma.module';
import { SecretVaultModule } from '../secret-vault';
import { SecurityAuditModule } from '../security-audit';
import { WorkspaceModule } from '../workspace';
import { OpenRouterConnectivityAudit } from './openrouter-connectivity.audit';
import { OpenRouterConnectivityCache } from './openrouter-connectivity.cache';
import { OpenRouterConnectivityService } from './openrouter-connectivity.service';
import {
  DEFAULT_OPENROUTER_TEST_TIMEOUT_MS,
  OPENROUTER_TEST_CLOCK,
  OPENROUTER_TEST_TIMEOUT_MS,
  OpenRouterConnectionTestService,
  SYSTEM_OPENROUTER_TEST_CLOCK,
} from './openrouter-connection-test.service';
import { OpenRouterKeyResolution } from './openrouter-key-resolution';
import { OpenRouterAiRequestAudit } from './openrouter-ai-request.audit';
import { OpenRouterAiRequestCache } from './openrouter-ai-request.cache';
import { OpenRouterAiRequestController } from './openrouter-ai-request.controller';
import {
  DEFAULT_OPENROUTER_AI_REQUEST_TIMEOUT_MS,
  OPENROUTER_AI_REQUEST_CLOCK,
  OPENROUTER_AI_REQUEST_TIMEOUT_MS,
  OpenRouterAiRequestService,
  SYSTEM_OPENROUTER_AI_REQUEST_CLOCK,
} from './openrouter-ai-request.service';
import { WorkspaceAiRequestHistoryAudit } from './workspace-ai-request-history.audit';
import { WorkspaceAiRequestHistoryController } from './workspace-ai-request-history.controller';
import { WorkspaceAiRequestHistoryService } from './workspace-ai-request-history.service';
import { WorkspaceAiSessionAudit } from './workspace-ai-session.audit';
import { WorkspaceAiSessionController } from './workspace-ai-session.controller';
import { WorkspaceAiSessionService } from './workspace-ai-session.service';

/**
 * AI Connectivity Foundation module.
 *
 * W2-S05-a: OpenRouter connectivity, connection test, projection, key resolution.
 * W2-S05-b: Workspace AI Request — one vaulted-key request/response.
 * W2-S05-c: Workspace AI Session — metadata-only request grouping.
 * W2-S05-d: Workspace AI Request History — read-only operational record.
 * Does not implement chat, conversation reconstruction, AI memory, Knowledge, or AI Platform.
 */
@Module({
  imports: [PrismaModule, WorkspaceModule, SecretVaultModule, SecurityAuditModule, AiModule],
  controllers: [
    OpenRouterAiRequestController,
    WorkspaceAiSessionController,
    WorkspaceAiRequestHistoryController,
  ],
  providers: [
    OpenRouterKeyResolution,
    OpenRouterConnectivityCache,
    OpenRouterConnectivityAudit,
    {
      provide: OPENROUTER_TEST_TIMEOUT_MS,
      useValue: DEFAULT_OPENROUTER_TEST_TIMEOUT_MS,
    },
    {
      provide: OPENROUTER_TEST_CLOCK,
      useValue: SYSTEM_OPENROUTER_TEST_CLOCK,
    },
    OpenRouterConnectionTestService,
    OpenRouterConnectivityService,
    WorkspaceAiSessionAudit,
    WorkspaceAiSessionService,
    WorkspaceAiRequestHistoryAudit,
    WorkspaceAiRequestHistoryService,
    OpenRouterAiRequestCache,
    OpenRouterAiRequestAudit,
    {
      provide: OPENROUTER_AI_REQUEST_TIMEOUT_MS,
      useValue: DEFAULT_OPENROUTER_AI_REQUEST_TIMEOUT_MS,
    },
    {
      provide: OPENROUTER_AI_REQUEST_CLOCK,
      useValue: SYSTEM_OPENROUTER_AI_REQUEST_CLOCK,
    },
    OpenRouterAiRequestService,
  ],
  exports: [
    OpenRouterKeyResolution,
    OpenRouterConnectionTestService,
    OpenRouterConnectivityService,
    OpenRouterConnectivityAudit,
    OpenRouterAiRequestService,
    WorkspaceAiSessionService,
    WorkspaceAiRequestHistoryService,
  ],
})
export class AiConnectivityModule {}
