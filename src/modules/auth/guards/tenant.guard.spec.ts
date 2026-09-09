import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IRequestApp } from 'src/common/request/interfaces/request.interface';
import { TenantGuard } from 'src/modules/auth/guards/tenant.guard';
import { IAuthUser } from 'src/modules/auth/interfaces/auth.user.interface';
import { ENUM_USER_ROLE } from 'src/modules/user/enums/user.enum';

function createContext(input: {
  user?: Partial<IAuthUser>;
  params?: Record<string, string>;
  query?: Record<string, string>;
  body?: Record<string, unknown>;
}): { context: ExecutionContext; request: IRequestApp } {
  const request = {
    user: input.user,
    params: input.params ?? {},
    query: input.query ?? {},
    body: input.body ?? {},
  } as IRequestApp;

  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => function handler() {
      return undefined;
    },
    getClass: () => class TestController {},
  } as unknown as ExecutionContext;

  return { context, request };
}

function activate(input: {
  user?: Partial<IAuthUser>;
  params?: Record<string, string>;
  query?: Record<string, string>;
  body?: Record<string, unknown>;
  requireShop?: boolean;
}) {
  const { context, request } = createContext(input);
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(input.requireShop === true),
  };
  const guard = new TenantGuard(reflector as unknown as Reflector);
  return { allowed: guard.canActivate(context), request };
}

describe('TenantGuard', () => {
  const owner: Partial<IAuthUser> = {
    userId: 'user-a',
    shopId: 'shop-a',
    role: ENUM_USER_ROLE.OWNER,
    phone: '+840000',
    sessionId: 'sid',
  };

  it('binds JWT shop for the owner and ignores matching query shopId', () => {
    const { request } = activate({
      user: owner,
      query: { shopId: 'shop-a' },
    });
    expect(request.tenantShopId).toBe('shop-a');
  });

  it('rejects owner access to another shop', () => {
    expect(() =>
      activate({
        user: owner,
        params: { shopId: 'shop-b' },
      }),
    ).toThrow(ForbiddenException);
  });

  it('rejects owner query shopId of another shop', () => {
    expect(() =>
      activate({
        user: owner,
        query: { shopId: 'shop-b' },
      }),
    ).toThrow(ForbiddenException);
  });

  it('rejects owner body shopId of another shop', () => {
    expect(() =>
      activate({
        user: owner,
        body: { shopId: 'shop-b' },
      }),
    ).toThrow(ForbiddenException);
  });

  it('lets admin list without shopId', () => {
    const { request } = activate({
      user: {
        ...owner,
        shopId: null,
        role: ENUM_USER_ROLE.ADMIN,
      },
    });
    expect(request.tenantShopId).toBeUndefined();
  });

  it('lets admin target a specific shop', () => {
    const { request } = activate({
      user: {
        ...owner,
        shopId: null,
        role: ENUM_USER_ROLE.ADMIN,
      },
      params: { shopId: 'shop-b' },
    });
    expect(request.tenantShopId).toBe('shop-b');
  });

  it('requires shopId for admin when metadata is set', () => {
    expect(() =>
      activate({
        user: {
          ...owner,
          shopId: null,
          role: ENUM_USER_ROLE.ADMIN,
        },
        requireShop: true,
      }),
    ).toThrow(ForbiddenException);
  });

  it('requires shop for owner when they have none and metadata is set', () => {
    expect(() =>
      activate({
        user: { ...owner, shopId: null },
        requireShop: true,
      }),
    ).toThrow(ForbiddenException);
  });
});
