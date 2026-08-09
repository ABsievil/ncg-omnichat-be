import {
  Controller,
  Get,
  Patch,
  Body,
  Query,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'src/common/response/decorators/response.decorator';
import { IResponse } from 'src/common/response/interfaces/response.interface';
import { AuthUser } from 'src/modules/auth/decorators/auth.user.decorator';
import type { IAuthUser } from 'src/modules/auth/interfaces/auth.user.interface';
import { UserUpdateRequestDto } from 'src/modules/user/dtos/request/user.update.request.dto';
import { UserGetResponseDataDto } from 'src/modules/user/dtos/response/user.get.response.data.dto';
import { UserService } from 'src/modules/user/services/user.service';

@Controller({ path: 'users', version: '1' })
export class UserUserController {
  constructor(private readonly userService: UserService) {}

  @Response('user.get')
  @Get('me')
  async me(
    @AuthUser() authUser: IAuthUser,
  ): Promise<IResponse<UserGetResponseDataDto>> {
    const user = await this.userService.findById(authUser.userId);
    return { data: this.userService.mapGetData(user) };
  }

  @Response('user.update')
  @Patch('me')
  async updateMe(
    @AuthUser() authUser: IAuthUser,
    @Body() dto: UserUpdateRequestDto,
  ): Promise<IResponse<UserGetResponseDataDto>> {
    const user = await this.userService.updateProfile(authUser.userId, dto);
    return { data: this.userService.mapGetData(user) };
  }

  @Response('user.get')
  @Get('search')
  async search(
    @Query('phone') phone: string,
  ): Promise<IResponse<UserGetResponseDataDto>> {
    if (!phone) {
      throw new BadRequestException('user.error.phoneRequired');
    }
    const user = await this.userService.findByPhone(phone);
    if (!user) {
      throw new NotFoundException('user.error.notFound');
    }
    return { data: this.userService.mapGetData(user) };
  }
}
