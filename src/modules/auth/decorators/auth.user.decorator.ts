import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IRequestApp } from 'src/common/request/interfaces/request.interface';
import { IAuthUser } from 'src/modules/auth/interfaces/auth.user.interface';

export const AuthUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): IAuthUser => {
    const request = ctx.switchToHttp().getRequest<IRequestApp>();
    return request.user as IAuthUser;
  },
);
