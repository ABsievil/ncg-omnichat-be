import { Body, Controller, Headers, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'src/common/response/decorators/response.decorator';
import { IResponse } from 'src/common/response/interfaces/response.interface';
import { Public } from 'src/modules/auth/decorators/auth.public.decorator';
import { AuthLoginPasswordRequestDto } from 'src/modules/auth/dtos/request/auth.login-password.request.dto';
import { AuthRefreshRequestDto } from 'src/modules/auth/dtos/request/auth.refresh.request.dto';
import { AuthRegisterRequestDto } from 'src/modules/auth/dtos/request/auth.register.request.dto';
import { AuthRequestOtpRequestDto } from 'src/modules/auth/dtos/request/auth.request-otp.request.dto';
import { AuthVerifyOtpRequestDto } from 'src/modules/auth/dtos/request/auth.verify-otp.request.dto';
import { AuthOtpResponseDataDto } from 'src/modules/auth/dtos/response/auth.otp.response.data.dto';
import { AuthTokenResponseDataDto } from 'src/modules/auth/dtos/response/auth.token.response.data.dto';
import { AuthService } from 'src/modules/auth/services/auth.service';

@Public()
@Controller({ path: 'auth', version: '1' })
export class AuthPublicController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Response('auth.otpRequest')
  @Post('otp/request')
  async requestOtp(
    @Body() dto: AuthRequestOtpRequestDto,
  ): Promise<IResponse<AuthOtpResponseDataDto>> {
    return { data: await this.authService.requestOtp(dto.phone) };
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Response('auth.otpVerify')
  @Post('otp/verify')
  async verifyOtp(
    @Body() dto: AuthVerifyOtpRequestDto,
    @Headers('user-agent') userAgent?: string,
  ): Promise<IResponse<AuthTokenResponseDataDto>> {
    return { data: await this.authService.verifyOtpLogin(dto, userAgent) };
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Response('auth.register')
  @Post('register')
  async register(
    @Body() dto: AuthRegisterRequestDto,
    @Headers('user-agent') userAgent?: string,
  ): Promise<IResponse<AuthTokenResponseDataDto>> {
    return { data: await this.authService.register(dto, userAgent) };
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Response('auth.login')
  @Post('login')
  async login(
    @Body() dto: AuthLoginPasswordRequestDto,
    @Headers('user-agent') userAgent?: string,
  ): Promise<IResponse<AuthTokenResponseDataDto>> {
    return { data: await this.authService.loginPassword(dto, userAgent) };
  }

  @Response('auth.refresh')
  @Post('refresh')
  async refresh(
    @Body() dto: AuthRefreshRequestDto,
  ): Promise<IResponse<AuthTokenResponseDataDto>> {
    return { data: await this.authService.refresh(dto.refreshToken) };
  }
}
