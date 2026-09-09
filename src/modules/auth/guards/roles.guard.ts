import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IRequestApp } from 'src/common/request/interfaces/request.interface';
import { ROLES_KEY } from 'src/modules/auth/decorators/roles.decorator';
import { AuthError } from 'src/modules/auth/errors/auth.error';
import { IAuthUser } from 'src/modules/auth/interfaces/auth.user.interface';
import { ENUM_USER_ROLE } from 'src/modules/user/enums/user.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<ENUM_USER_ROLE[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!roles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<IRequestApp>();
    const user = request.user as IAuthUser | undefined;
    if (!user?.role || !roles.includes(user.role)) {
      AuthError.throwForbidden();
    }

    return true;
  }
}
