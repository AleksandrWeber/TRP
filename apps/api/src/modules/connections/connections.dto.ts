import { IsIn, IsObject, IsString, Length, Matches } from 'class-validator';
import { CONNECTION_PROVIDERS } from './connection-catalog';

const PROVIDER_IDS = CONNECTION_PROVIDERS.map((provider) => provider.id);

export class CreateConnectionMetadataDto {
  @IsString()
  @Length(1, 120)
  @Matches(/\S/, { message: 'displayName must contain a non-whitespace character' })
  displayName!: string;

  @IsIn(PROVIDER_IDS)
  provider!: string;
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
