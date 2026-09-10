import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IRequestApp } from 'src/common/request/interfaces/request.interface';
import { REQUIRE_TENANT_SHOP_KEY } from 'src/modules/auth/decorators/require-tenant-shop.decorator';
import { AuthError } from 'src/modules/auth/errors/auth.error';
import { IAuthUser } from 'src/modules/auth/interfaces/auth.user.interface';
import { ENUM_USER_ROLE } from 'src/modules/user/enums/user.enum';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<IRequestApp>();
    const user = request.user as IAuthUser | undefined;
    if (!user) {
      AuthError.throwForbidden();
    }

    const requireShop = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_TENANT_SHOP_KEY,
      [context.getHandler(), context.getClass()],
    );
    const requestedShopId = TenantGuard.extractRequestedShopId(request);
    const isAdmin = user.role === ENUM_USER_ROLE.ADMIN;

    if (!isAdmin) {
      if (requestedShopId && requestedShopId !== user.shopId) {
        AuthError.throwCrossShop();
      }

      request.tenantShopId = user.shopId ?? undefined;
      if (requireShop && !request.tenantShopId) {
        AuthError.throwShopRequired();
      }
      return true;
    }

    request.tenantShopId = requestedShopId;
    if (requireShop && !request.tenantShopId) {
      AuthError.throwShopRequired();
    }
    return true;
  }

  static extractRequestedShopId(request: IRequestApp): string | undefined {
    const params = request.params as Record<string, string | undefined>;
    const query = request.query as Record<string, unknown>;
    const body = request.body as Record<string, unknown> | undefined;

    const candidates = [params?.shopId, query?.shopId, body?.shopId];
    for (const value of candidates) {
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    return undefined;
  }
}
