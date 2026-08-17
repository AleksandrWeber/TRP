import { Injectable } from '@nestjs/common';
import {
  decideAuthorization,
  type AuthorizationDecision,
  type AuthorizationRequest,
} from './authorization-decision';

/**
 * Authorization decision service (V3-S02-a).
 * Existing Auth owner. Not a new IAM bounded context.
 */
@Injectable()
export class AuthorizationDecisionService {
  decide(request: AuthorizationRequest): AuthorizationDecision {
    return decideAuthorization(request);
  }

  allows(role: unknown, action: unknown, workspaceMember?: boolean): boolean {
    return decideAuthorization({ role, action, workspaceMember }).allowed;
  }
}
