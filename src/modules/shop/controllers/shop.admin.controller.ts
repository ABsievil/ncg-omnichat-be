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
import { ShopCreateRequestDto } from 'src/modules/shop/dtos/request/shop.create.request.dto';
import { ShopUpdateRequestDto } from 'src/modules/shop/dtos/request/shop.update.request.dto';
import { ShopDeleteResponseDataDto } from 'src/modules/shop/dtos/response/shop.delete.response.data.dto';
import { ShopGetResponseDataDto } from 'src/modules/shop/dtos/response/shop.get.response.data.dto';
import { ShopListResponseDataDto } from 'src/modules/shop/dtos/response/shop.list.response.data.dto';
import { ShopService } from 'src/modules/shop/services/shop.service';

@Controller({ version: '1', path: '/shops' })
export class ShopAdminController {
  constructor(private readonly shopService: ShopService) {}

  @Response('shop.list')
  @Get()
  async list(): Promise<IResponse<ShopListResponseDataDto>> {
    const shops = await this.shopService.list();
    return { data: this.shopService.mapListData(shops) };
  }

  @Response('shop.get')
  @Get('/:shopId')
  async get(
    @Param('shopId') shopId: string,
  ): Promise<IResponse<ShopGetResponseDataDto>> {
    const shop = await this.shopService.getById(shopId);
    return { data: this.shopService.mapGetData(shop) };
  }

  @Response('shop.create')
  @Post()
  async create(
    @Body() dto: ShopCreateRequestDto,
  ): Promise<IResponse<ShopGetResponseDataDto>> {
    const shop = await this.shopService.create(dto);
    return { data: this.shopService.mapGetData(shop) };
  }

  @Response('shop.update')
  @Patch('/:shopId')
  async update(
    @Param('shopId') shopId: string,
    @Body() dto: ShopUpdateRequestDto,
  ): Promise<IResponse<ShopGetResponseDataDto>> {
    const shop = await this.shopService.update(shopId, dto);
    return { data: this.shopService.mapGetData(shop) };
  }

  @Response('shop.delete')
  @Delete('/:shopId')
  async remove(
    @Param('shopId') shopId: string,
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
