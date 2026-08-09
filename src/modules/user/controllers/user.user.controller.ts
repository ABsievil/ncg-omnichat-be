import {
  Controller,
  Get,
  Patch,
  Body,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from 'src/modules/user/services/user.service';
import { UpdateProfileDto } from 'src/modules/user/dtos/user.update-profile.dto';
import { AuthUser } from 'src/modules/auth/decorators/auth.user.decorator';
import type { IAuthUser } from 'src/modules/auth/interfaces/auth.user.interface';

@Controller({ path: 'users', version: '1' })
export class UserUserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async me(@AuthUser() authUser: IAuthUser) {
    const user = await this.userService.findById(authUser.userId);
    return this.userService.toPublic(user);
  }

  @Patch('me')
  async updateMe(
    @AuthUser() authUser: IAuthUser,
    @Body() dto: UpdateProfileDto,
  ) {
    const user = await this.userService.updateProfile(authUser.userId, dto);
    return this.userService.toPublic(user);
  }

  @Get('search')
  async search(@Query('phone') phone: string) {
    if (!phone) {
      throw new NotFoundException('user.error.phoneRequired');
    }
    const user = await this.userService.findByPhone(phone);
    if (!user) {
      throw new NotFoundException('user.error.notFound');
    }
    return this.userService.toPublic(user);
  }
}
