import { IsIn, IsObject, IsOptional, IsString, Length, Matches } from 'class-validator';
import { CONNECTION_PROVIDERS } from './connection-catalog';
import { CONNECTION_TRADING_ENVIRONMENTS } from './connection-environment';

const PROVIDER_IDS = CONNECTION_PROVIDERS.map((provider) => provider.id);
const CONNECTION_ENVIRONMENTS = [...CONNECTION_TRADING_ENVIRONMENTS];

export class CreateConnectionMetadataDto {
  @IsString()
  @Length(1, 120)
  @Matches(/\S/, { message: 'displayName must contain a non-whitespace character' })
  displayName!: string;

  @IsIn(PROVIDER_IDS)
  provider!: string;

  /**
   * ENV1 Connection environments only: live | testnet.
   * Required for EXCHANGE (validated in service). Optional for notification/AI.
   * DEMO is not accepted.
   */
  @IsOptional()
  @IsIn(CONNECTION_ENVIRONMENTS)
  environment?: string;
}

export class RenameConnectionMetadataDto {
  @IsString()
  @Length(1, 120)
  @Matches(/\S/, { message: 'displayName must contain a non-whitespace character' })
  displayName!: string;
}

/**
 * Credential values are write-only transport data. They are passed directly to
 * Vault and never returned by Connection Management.
 */
export class StoreConnectionCredentialsDto {
  @IsObject()
  credentials!: Record<string, string>;
}
