import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Named workspace create / rename body (PC-14).
 * Transport for the existing WorkspaceDomainService name field.
 */
export class WorkspaceNameBodyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;
}
