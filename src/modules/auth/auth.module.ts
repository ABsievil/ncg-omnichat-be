import { Global, Module } from '@nestjs/common';
import { UserModule } from 'src/modules/user/user.module';
import { AuthService } from 'src/modules/auth/services/auth.service';
import { AuthSessionService } from 'src/modules/auth/services/auth.session.service';
import { OtpService } from 'src/modules/auth/services/otp.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt.auth.guard';

@Global()
@Module({
  imports: [UserModule],
  providers: [AuthService, AuthSessionService, OtpService, JwtAuthGuard],
  exports: [AuthService, AuthSessionService, OtpService, JwtAuthGuard],
})
export class AuthModule {}
