import { Injectable } from '@nestjs/common';
import type { ConnectionProvider } from './connection-catalog';

export type ConnectionValidationRequest = Readonly<{
  workspaceId: string;
  connectionId: string;
  provider: ConnectionProvider;
  credentials: Readonly<Record<string, string>>;
}>;

export type ConnectionValidationResult = Readonly<{
  outcome: 'succeeded' | 'failed';
}>;

/**
 * Provider-independent validation port. Future provider adapters may implement
 * this contract; W2-S01-c deliberately does not invoke any provider runtime.
 */
export interface ConnectionValidator {
  validate(request: ConnectionValidationRequest): Promise<ConnectionValidationResult>;
}

export const CONNECTION_VALIDATOR = Symbol('CONNECTION_VALIDATOR');

/**
 * Current validation contract is deterministic and local: Vault supplied
 * non-empty configured material. It performs no network or provider I/O.
 */
@Injectable()
export class DeterministicConnectionValidator implements ConnectionValidator {
  async validate(request: ConnectionValidationRequest): Promise<ConnectionValidationResult> {
    const fields = Object.values(request.credentials);
    return {
      outcome:
        fields.length > 0 && fields.every((value) => value.trim() !== '') ? 'succeeded' : 'failed',
    };
  }
}
