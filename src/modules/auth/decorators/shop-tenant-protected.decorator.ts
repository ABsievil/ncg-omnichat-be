import { applyDecorators, UseGuards } from '@nestjs/common';
import { AUTH_SHOP_ACCESS_ROLES } from 'src/modules/auth/constants/auth.constant';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { TenantGuard } from 'src/modules/auth/guards/tenant.guard';

export function ShopTenantProtected() {
  return applyDecorators(
    UseGuards(RolesGuard, TenantGuard),
    Roles(...AUTH_SHOP_ACCESS_ROLES),
  );
}
