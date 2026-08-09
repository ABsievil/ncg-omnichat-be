import { Body, Controller, Headers, Post } from '@nestjs/common';
import { AuthService } from 'src/modules/auth/services/auth.service';
import { RequestOtpDto } from 'src/modules/auth/dtos/auth.request-otp.dto';
import { VerifyOtpDto } from 'src/modules/auth/dtos/auth.verify-otp.dto';
import { RegisterDto } from 'src/modules/auth/dtos/auth.register.dto';
import { LoginPasswordDto } from 'src/modules/auth/dtos/auth.login-password.dto';
import { RefreshTokenDto } from 'src/modules/auth/dtos/auth.refresh.dto';
import { Public } from 'src/modules/auth/decorators/auth.public.decorator';

@Public()
@Controller({ path: 'auth', version: '1' })
export class AuthPublicController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/request')
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto.phone);
  }

  @Post('otp/verify')
  verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.verifyOtpLogin(dto, userAgent);
  }

  @Post('register')
  register(
    @Body() dto: RegisterDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.register(dto, userAgent);
  }

  @Post('login')
  login(
    @Body() dto: LoginPasswordDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.loginPassword(dto, userAgent);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }
}
