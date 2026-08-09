import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { Response } from 'src/common/response/decorators/response.decorator';
import { IResponse } from 'src/common/response/interfaces/response.interface';
import { AuthUser } from 'src/modules/auth/decorators/auth.user.decorator';
import type { IAuthUser } from 'src/modules/auth/interfaces/auth.user.interface';
import { AuthSessionListResponseDataDto } from 'src/modules/auth/dtos/response/auth.session.list.response.data.dto';
import { AuthService } from 'src/modules/auth/services/auth.service';

@Controller({ path: 'auth', version: '1' })
export class AuthUserController {
  constructor(private readonly authService: AuthService) {}

  @Response('auth.logout')
  @Post('logout')
  async logout(
    @AuthUser() user: IAuthUser,
  ): Promise<IResponse<{ _id: string }>> {
    return {
      data: await this.authService.logout(user.userId, user.sessionId),
    };
  }

  @Response('auth.sessionList')
  @Get('sessions')
  async sessions(
    @AuthUser() user: IAuthUser,
  ): Promise<IResponse<AuthSessionListResponseDataDto>> {
    return { data: await this.authService.listSessions(user.userId) };
  }

  @Response('auth.sessionRevoke')
  @Delete('sessions/:sessionId')
  async revokeSession(
    @AuthUser() user: IAuthUser,
    @Param('sessionId') sessionId: string,
  ): Promise<IResponse<{ _id: string }>> {
    return {
      data: await this.authService.revokeSession(user.userId, sessionId),
    };
  }
}
