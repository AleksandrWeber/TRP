import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export const LIBRARY_MEMBERSHIP_STATUS_VALUES = [
  'uncertified',
  'certified',
  'deprecated',
  'archived',
] as const;

export const LIBRARY_ELIGIBILITY_PURPOSE_VALUES = [
  'deployment_bind',
  'session_arm',
  'selection',
] as const;

/**
 * PC-01 — Lookup list query. Transport for StrategyLibraryLookupPort.list.
 * Does not add Library authority or search SoT.
 */
export class ListStrategyLibraryQueryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  strategyFamilyId?: string;

  /** Comma-separated membership statuses. */
  @IsOptional()
  @IsString()
  statuses?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  exchangeScopeId?: string;

  @IsOptional()
  @IsString()
  includeArchived?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @IsOptional()
  @IsString()
  cursor?: string;

  /** Presentation filter over listed Lookup records (name / family / version / id). */
  @IsOptional()
  @IsString()
  q?: string;
}

/**
 * PC-01 — Eligibility check query. Transport for StrategyLibraryEligibilityPort.
 */
export class CheckStrategyLibraryEligibilityQueryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  exchangeScopeId?: string;

  @IsOptional()
  @IsIn(LIBRARY_ELIGIBILITY_PURPOSE_VALUES)
  purpose?: (typeof LIBRARY_ELIGIBILITY_PURPOSE_VALUES)[number];
}

export class LibraryEntryIdParamDto {
  @IsString()
  @MinLength(1)
  libraryEntryId!: string;
}

export class LibraryFamilyVersionParamDto {
  @IsString()
  @MinLength(1)
  strategyFamilyId!: string;

  @IsString()
  @MinLength(1)
  version!: string;
}

export class CertificationAttemptIdParamDto {
  @IsString()
  @MinLength(1)
  attemptId!: string;
}

export class ListCertificationHistoryQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

export class CertificationEvidenceSourceRefDto {
  @IsString()
  @MinLength(1)
  owner!: string;

  @IsString()
  @MinLength(1)
  id!: string;
}

export class CertificationEvidenceBodyDto {
  @IsString()
  @MinLength(1)
  evidenceId!: string;

  @IsString()
  @MinLength(1)
  type!: string;

  @ValidateNested()
  @Type(() => CertificationEvidenceSourceRefDto)
  sourceRef!: CertificationEvidenceSourceRefDto;

  @IsOptional()
  @IsString()
  summary?: string;
}

export class CertifyFamilyBodyDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  strategyFamilyId?: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  registryRef?: string;
}

export class CertifyVersionBodyDto {
  @IsString()
  @MinLength(1)
  version!: string;

  @IsString()
  @MinLength(1)
  contentHash!: string;

  @IsString()
  @MinLength(1)
  market!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  supportedExchangeScopeIds!: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  supportedTimeframes!: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportedSymbols?: string[];

  @IsOptional()
  @IsString()
  @MinLength(1)
  universeRef?: string;
}

export class CertifyMaxPositionsBodyDto {
  @IsNumber()
  min!: number;

  @IsNumber()
  max!: number;
}

export class CertifyTacticalEnvelopeBodyDto {
  @IsString()
  @MinLength(1)
  envelopeVersion!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  allowedMarkets!: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  allowedExchangeScopeIds!: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  allowedSymbols!: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  allowedTimeframes!: string[];

  @IsObject()
  riskPerTrade!: { min: number; max: number; step?: number } | { kind: 'set'; values: number[] };

  @ValidateNested()
  @Type(() => CertifyMaxPositionsBodyDto)
  maxPositions!: CertifyMaxPositionsBodyDto;
}

/**
 * PC-02 — Certify command body. Transport for StrategyLibraryCertificationPort.certify.
 * certifiedBy is taken from the authenticated operator, never from this body.
 */
export class CertifyStrategyVersionBodyDto {
  @ValidateNested()
  @Type(() => CertifyFamilyBodyDto)
  family!: CertifyFamilyBodyDto;

  @ValidateNested()
  @Type(() => CertifyVersionBodyDto)
  version!: CertifyVersionBodyDto;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CertificationEvidenceBodyDto)
  evidence!: CertificationEvidenceBodyDto[];

  @ValidateNested()
  @Type(() => CertifyTacticalEnvelopeBodyDto)
  tacticalEnvelope!: CertifyTacticalEnvelopeBodyDto;

  @IsOptional()
  @IsString()
  notes?: string;
}
