import { SetMetadata } from '@nestjs/common';

export const REQUIRE_TENANT_SHOP_KEY = 'requireTenantShop';

export const RequireTenantShop = () =>
  SetMetadata(REQUIRE_TENANT_SHOP_KEY, true);
