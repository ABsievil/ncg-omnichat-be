import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IRequestApp } from 'src/common/request/interfaces/request.interface';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { IAuthUser } from 'src/modules/auth/interfaces/auth.user.interface';
import { ENUM_USER_ROLE } from 'src/modules/user/enums/user.enum';

describe('RolesGuard', () => {
  function contextFor(role: ENUM_USER_ROLE): ExecutionContext {
    const request = {
      user: {
        userId: 'u1',
        role,
        shopId: 'shop-a',
        phone: '+84',
        sessionId: 's1',
      } satisfies IAuthUser,
    } as IRequestApp;

    return {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => function handler() {
        return undefined;
      },
      getClass: () => class Test {},
    } as unknown as ExecutionContext;
  }

  function guardWithRoles(roles?: ENUM_USER_ROLE[]) {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(roles),
    };
    return new RolesGuard(reflector as unknown as Reflector);
  }

  it('allows when no roles metadata is set', () => {
    expect(
      guardWithRoles(undefined).canActivate(contextFor(ENUM_USER_ROLE.USER)),
    ).toBe(true);
  });

  it('allows matching role', () => {
    expect(
      guardWithRoles([ENUM_USER_ROLE.ADMIN]).canActivate(
        contextFor(ENUM_USER_ROLE.ADMIN),
      ),
    ).toBe(true);
  });

  it('rejects owner on admin-only route', () => {
    expect(() =>
      guardWithRoles([ENUM_USER_ROLE.ADMIN]).canActivate(
        contextFor(ENUM_USER_ROLE.OWNER),
      ),
    ).toThrow(ForbiddenException);
  });
});
