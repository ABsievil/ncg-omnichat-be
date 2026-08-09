import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidV4 } from 'uuid';
import { HelperEncryptionService } from 'src/common/helper/services/helper.encryption.service';
import { HelperHashService } from 'src/common/helper/services/helper.hash.service';
import { AuthSessionService } from 'src/modules/auth/services/auth.session.service';
import { OtpService } from 'src/modules/auth/services/otp.service';
import { LoginPasswordDto } from 'src/modules/auth/dtos/auth.login-password.dto';
import { RegisterDto } from 'src/modules/auth/dtos/auth.register.dto';
import { VerifyOtpDto } from 'src/modules/auth/dtos/auth.verify-otp.dto';
import { UserRepository } from 'src/modules/user/repositories/user.repository';
import { UserService } from 'src/modules/user/services/user.service';
import { ENUM_USER_GENDER } from 'src/modules/user/enums/user.enum';
import { IAuthTokenPayload } from 'src/modules/auth/interfaces/auth.user.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly otpService: OtpService,
    private readonly authSessionService: AuthSessionService,
    private readonly userRepository: UserRepository,
    private readonly userService: UserService,
    private readonly helperHashService: HelperHashService,
    private readonly helperEncryptionService: HelperEncryptionService,
    private readonly configService: ConfigService,
  ) {}

  private normalizePhone(phone: string): string {
    const cleaned = phone.replace(/\s+/g, '').trim();
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    if (cleaned.startsWith('0')) {
      return `+84${cleaned.slice(1)}`;
    }
    return `+${cleaned}`;
  }

  async requestOtp(phoneRaw: string) {
    return this.otpService.requestOtp(this.normalizePhone(phoneRaw));
  }

  async register(dto: RegisterDto, userAgent?: string) {
    const phone = this.normalizePhone(dto.phone);
    const ok = await this.otpService.verifyOtp(phone, dto.otp);
    if (!ok) {
      throw new BadRequestException('auth.error.invalidOtp');
    }

    const existing = await this.userRepository.findOne({ phone });
    if (existing) {
      throw new BadRequestException('auth.error.phoneExists');
    }

    const salt = this.helperHashService.randomSalt(10);
    const passwordHash = this.helperHashService.bcrypt(dto.password, salt);
    const user = await this.userRepository.create({
      phone,
      passwordHash,
      displayName: dto.displayName,
      gender: ENUM_USER_GENDER.UNKNOWN,
      bio: '',
      statusText: '',
      deleted: false,
    } as any);

    return this.issueTokens({
      userId: user._id,
      phone,
      deviceId: dto.deviceId,
      deviceName: dto.deviceName ?? 'Unknown device',
      userAgent,
    });
  }

  async verifyOtpLogin(dto: VerifyOtpDto, userAgent?: string) {
    const phone = this.normalizePhone(dto.phone);
    const ok = await this.otpService.verifyOtp(phone, dto.otp);
    if (!ok) {
      throw new BadRequestException('auth.error.invalidOtp');
    }

    let user = await this.userRepository.findOne({ phone });
    if (!user) {
      user = await this.userRepository.create({
        phone,
        displayName: phone,
        gender: ENUM_USER_GENDER.UNKNOWN,
        bio: '',
        statusText: '',
        deleted: false,
      } as any);
    }

    return this.issueTokens({
      userId: user._id,
      phone,
      deviceId: dto.deviceId,
      deviceName: dto.deviceName ?? 'Unknown device',
      userAgent,
    });
  }

  async loginPassword(dto: LoginPasswordDto, userAgent?: string) {
    const phone = this.normalizePhone(dto.phone);
    const user = await this.userRepository.findOne(
      { phone },
      { select: { passwordHash: true, phone: true, displayName: true } },
    );
    if (!user?.passwordHash) {
      throw new UnauthorizedException('auth.error.invalidCredentials');
    }
    const match = this.helperHashService.bcryptCompare(
      dto.password,
      user.passwordHash,
    );
    if (!match) {
      throw new UnauthorizedException('auth.error.invalidCredentials');
    }

    return this.issueTokens({
      userId: user._id,
      phone,
      deviceId: dto.deviceId,
      deviceName: dto.deviceName ?? 'Unknown device',
      userAgent,
    });
  }

  async refresh(refreshToken: string) {
    const session =
      await this.authSessionService.findByRefreshToken(refreshToken);
    if (!session) {
      throw new UnauthorizedException('auth.error.invalidRefresh');
    }

    const user = await this.userRepository.findOneById(session.userId);
    if (!user) {
      throw new UnauthorizedException('auth.error.userNotFound');
    }

    const tokens = this.buildTokenPair({
      userId: user._id,
      phone: user.phone,
      sessionId: session.sessionId,
    });
    await this.authSessionService.rotateRefreshToken(
      user._id,
      session.sessionId,
      tokens.refreshToken,
    );

    return {
      ...tokens,
      user: this.userService.toPublic(user),
    };
  }

  async logout(userId: string, sessionId: string) {
    await this.authSessionService.revokeSession(userId, sessionId);
    return { ok: true };
  }

  async listSessions(userId: string) {
    const sessions = await this.authSessionService.listSessions(userId);
    return sessions.map(s => ({
      sessionId: s.sessionId,
      deviceId: s.deviceId,
      deviceName: s.deviceName,
      createdAt: s.createdAt,
      lastActiveAt: s.lastActiveAt,
    }));
  }

  async revokeSession(userId: string, sessionId: string) {
    await this.authSessionService.revokeSession(userId, sessionId);
    return { ok: true };
  }

  private async issueTokens(params: {
    userId: string;
    phone: string;
    deviceId: string;
    deviceName: string;
    userAgent?: string;
  }) {
    const sessionId = uuidV4();
    const tokens = this.buildTokenPair({
      userId: params.userId,
      phone: params.phone,
      sessionId,
    });

    await this.authSessionService.createSession({
      userId: params.userId,
      deviceId: params.deviceId,
      deviceName: params.deviceName,
      refreshToken: tokens.refreshToken,
      userAgent: params.userAgent,
      sessionId,
    });

    const user = await this.userRepository.findOneById(params.userId);
    return {
      ...tokens,
      user: this.userService.toPublic(user!),
    };
  }

  private buildTokenPair(params: {
    userId: string;
    phone: string;
    sessionId: string;
  }) {
    const secret =
      this.configService.get<string>('helper.jwt.defaultSecretKey') ??
      'omnichat-default-secret';
    const accessExpired =
      this.configService.get<string>('helper.jwt.defaultExpirationTime') ??
      '1h';

    const accessPayload: IAuthTokenPayload = {
      sub: params.userId,
      sid: params.sessionId,
      phone: params.phone,
      typ: 'access',
    };

    const accessToken = this.helperEncryptionService.jwtEncrypt(accessPayload, {
      secretKey: secret,
      expiredIn: accessExpired,
      audience: 'omnichat',
      issuer: 'omnichat',
    });

    const refreshToken = `${params.sessionId}.${uuidV4().replace(/-/g, '')}`;

    return {
      accessToken,
      refreshToken,
      expiresIn: accessExpired,
      tokenType: 'Bearer',
      sessionId: params.sessionId,
    };
  }
}
