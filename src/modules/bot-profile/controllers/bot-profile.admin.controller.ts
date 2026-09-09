import { Body, Controller, Get, Put, Post } from '@nestjs/common';
import { Response } from 'src/common/response/decorators/response.decorator';
import { IResponse } from 'src/common/response/interfaces/response.interface';
import { RequireTenantShop } from 'src/modules/auth/decorators/require-tenant-shop.decorator';
import { ShopTenantProtected } from 'src/modules/auth/decorators/shop-tenant-protected.decorator';
import { TenantShopId } from 'src/modules/auth/decorators/tenant-shop.decorator';
import { BotProfileUpdateRequestDto } from 'src/modules/bot-profile/dtos/request/bot-profile.update.request.dto';
import { BotProfileGetResponseDataDto } from 'src/modules/bot-profile/dtos/response/bot-profile.get.response.data.dto';
import { BotProfileRepository } from 'src/modules/bot-profile/repositories/bot-profile.repository';
import { BotProfileService } from 'src/modules/bot-profile/services/bot-profile.service';

@ShopTenantProtected()
@RequireTenantShop()
@Controller({ version: '1', path: '/bot-profile' })
export class BotProfileAdminController {
  constructor(
    private readonly botProfileService: BotProfileService,
    private readonly botProfileRepository: BotProfileRepository,
  ) {}

  @Response('botProfile.get')
  @Get()
  async get(
    @TenantShopId() shopId: string,
  ): Promise<IResponse<BotProfileGetResponseDataDto>> {
    const snapshot = await this.botProfileService.getOrCreate(shopId);
    const doc = await this.botProfileRepository.findOne({ shopId });
    return { data: this.botProfileService.mapGetData(snapshot, doc) };
  }

  @Response('botProfile.update')
  @Put()
  async update(
    @TenantShopId() shopId: string,
    @Body() dto: BotProfileUpdateRequestDto,
  ): Promise<IResponse<BotProfileGetResponseDataDto>> {
    const snapshot = await this.botProfileService.update(shopId, dto);
    const doc = await this.botProfileRepository.findOne({ shopId });
    return { data: this.botProfileService.mapGetData(snapshot, doc) };
  }

  @Response('botProfile.acceptZaloRisk')
  @Post('/accept-zalo-risk')
  async acceptZaloRisk(
    @TenantShopId() shopId: string,
  ): Promise<IResponse<BotProfileGetResponseDataDto>> {
    const snapshot = await this.botProfileService.acceptZaloRisk(shopId);
    const doc = await this.botProfileRepository.findOne({ shopId });
    return { data: this.botProfileService.mapGetData(snapshot, doc) };
  }
}
