import { Global, Module } from '@nestjs/common';
import { UserModule } from 'src/modules/user/user.module';
import { ShopModule } from 'src/modules/shop/shop.module';
import { BotProfileModule } from 'src/modules/bot-profile/bot-profile.module';
import { AuthService } from 'src/modules/auth/services/auth.service';
import { AuthSessionService } from 'src/modules/auth/services/auth.session.service';
import { OtpService } from 'src/modules/auth/services/otp.service';
import { AuthError } from 'src/modules/auth/errors/auth.error';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt.auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { TenantGuard } from 'src/modules/auth/guards/tenant.guard';

@Global()
@Module({
  imports: [UserModule, ShopModule, BotProfileModule],
  providers: [
    AuthService,
    AuthSessionService,
    OtpService,
    AuthError,
    JwtAuthGuard,
    RolesGuard,
    TenantGuard,
  ],
  exports: [
    AuthService,
    AuthSessionService,
    OtpService,
    AuthError,
    JwtAuthGuard,
    RolesGuard,
    TenantGuard,
  ],
})
export class AuthModule {}
