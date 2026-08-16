import { IsEnum, IsUUID } from 'class-validator';
import { Role } from '../../modules/identity/role';

/**
 * People role-assignment DTOs (V3-S02-c).
 * Canonical Identity Role only. Unknown fields are rejected by the validation pipe.
 */
export class PeopleUserIdParamDto {
  @IsUUID('4')
  userId!: string;
}

export class AssignRoleBodyDto {
  @IsEnum(Role)
  role!: Role;
}
