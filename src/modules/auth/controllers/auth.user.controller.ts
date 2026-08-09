import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { AuthService } from 'src/modules/auth/services/auth.service';
import { AuthUser } from 'src/modules/auth/decorators/auth.user.decorator';
import type { IAuthUser } from 'src/modules/auth/interfaces/auth.user.interface';

@Controller({ path: 'auth', version: '1' })
export class AuthUserController {
  constructor(private readonly authService: AuthService) {}

  @Post('logout')
  logout(@AuthUser() user: IAuthUser) {
    return this.authService.logout(user.userId, user.sessionId);
  }

  @Get('sessions')
  sessions(@AuthUser() user: IAuthUser) {
    return this.authService.listSessions(user.userId);
  }

  @Delete('sessions/:sessionId')
  revokeSession(
    @AuthUser() user: IAuthUser,
    @Param('sessionId') sessionId: string,
  ) {
    return this.authService.revokeSession(user.userId, sessionId);
  }
}
