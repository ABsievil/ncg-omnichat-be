import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Response } from 'src/common/response/decorators/response.decorator';
import { IResponse } from 'src/common/response/interfaces/response.interface';
import { AuthUser } from 'src/modules/auth/decorators/auth.user.decorator';
import { RequireTenantShop } from 'src/modules/auth/decorators/require-tenant-shop.decorator';
import { ShopTenantProtected } from 'src/modules/auth/decorators/shop-tenant-protected.decorator';
import { TenantShopId } from 'src/modules/auth/decorators/tenant-shop.decorator';
import type { IAuthUser } from 'src/modules/auth/interfaces/auth.user.interface';
import { ShopCreateRequestDto } from 'src/modules/shop/dtos/request/shop.create.request.dto';
import { ShopUpdateRequestDto } from 'src/modules/shop/dtos/request/shop.update.request.dto';
import { ShopDeleteResponseDataDto } from 'src/modules/shop/dtos/response/shop.delete.response.data.dto';
import { ShopGetResponseDataDto } from 'src/modules/shop/dtos/response/shop.get.response.data.dto';
import { ShopListResponseDataDto } from 'src/modules/shop/dtos/response/shop.list.response.data.dto';
import { ShopError } from 'src/modules/shop/errors/shop.error';
import { ShopService } from 'src/modules/shop/services/shop.service';
import { BotProfileService } from 'src/modules/bot-profile/services/bot-profile.service';
import { ENUM_USER_ROLE } from 'src/modules/user/enums/user.enum';
import { UserService } from 'src/modules/user/services/user.service';

@ShopTenantProtected()
@Controller({ version: '1', path: '/shops' })
export class ShopAdminController {
  constructor(
    private readonly shopService: ShopService,
    private readonly shopError: ShopError,
    private readonly userService: UserService,
    private readonly botProfileService: BotProfileService,
  ) {}

  @Response('shop.list')
  @Get()
  async list(
    @TenantShopId() shopId?: string,
  ): Promise<IResponse<ShopListResponseDataDto>> {
    const shops = await this.shopService.listForTenant(shopId);
    return { data: this.shopService.mapListData(shops) };
  }

  @RequireTenantShop()
  @Response('shop.get')
  @Get('/:shopId')
  async get(
    @TenantShopId() shopId: string,
  ): Promise<IResponse<ShopGetResponseDataDto>> {
    const shop = await this.shopService.getById(shopId);
    return { data: this.shopService.mapGetData(shop) };
  }

  @Response('shop.create')
  @Post()
  async create(
    @AuthUser() user: IAuthUser,
    @Body() dto: ShopCreateRequestDto,
  ): Promise<IResponse<ShopGetResponseDataDto>> {
    if (user.role !== ENUM_USER_ROLE.ADMIN && user.shopId) {
      this.shopError.throwAlreadyHasShop();
    }

    const shop = await this.shopService.create(dto);
    await this.botProfileService.ensure(shop._id, shop.name);
    if (user.role !== ENUM_USER_ROLE.ADMIN && !user.shopId) {
      await this.userService.assignShop(user.userId, shop._id);
    }
    return { data: this.shopService.mapGetData(shop) };
  }

  @RequireTenantShop()
  @Response('shop.update')
  @Patch('/:shopId')
  async update(
    @TenantShopId() shopId: string,
    @Body() dto: ShopUpdateRequestDto,
  ): Promise<IResponse<ShopGetResponseDataDto>> {
    const shop = await this.shopService.update(shopId, dto);
    return { data: this.shopService.mapGetData(shop) };
  }

  @RequireTenantShop()
  @Response('shop.delete')
  @Delete('/:shopId')
  async remove(
    @TenantShopId() shopId: string,
  ): Promise<IResponse<ShopDeleteResponseDataDto>> {
    await this.shopService.softDelete(shopId);
    return {
      data: {
        deleted: true,
        createdBy: [],
        updatedBy: [],
      },
    };
  }
}
