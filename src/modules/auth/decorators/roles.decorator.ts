import { SetMetadata } from '@nestjs/common';
import { ENUM_USER_ROLE } from 'src/modules/user/enums/user.enum';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: ENUM_USER_ROLE[]) =>
  SetMetadata(ROLES_KEY, roles);
