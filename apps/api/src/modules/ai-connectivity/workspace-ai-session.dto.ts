import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateWorkspaceAiSessionDto {
  @IsString()
  @Length(1, 120)
  @Matches(/\S/, { message: 'displayName must contain a non-whitespace character' })
  displayName!: string;
}

export class RenameWorkspaceAiSessionDto {
  @IsString()
  @Length(1, 120)
  @Matches(/\S/, { message: 'displayName must contain a non-whitespace character' })
  displayName!: string;
}

/**
 * Extends W2-S05-b request body with optional session grouping (W2-S05-c).
 * sessionId is metadata only — it never becomes model context.
 */
export class WorkspaceAiRequestDto {
  @IsString()
  @Length(1, 4000)
  @Matches(/\S/, { message: 'prompt must contain a non-whitespace character' })
  prompt!: string;

  @IsOptional()
  @IsString()
  @Length(1, 64)
  sessionId?: string;
}
