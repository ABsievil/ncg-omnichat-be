import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidV4 } from 'uuid';
import { HelperEncryptionService } from 'src/common/helper/services/helper.encryption.service';
import { HelperHashService } from 'src/common/helper/services/helper.hash.service';
import { AuthLoginPasswordRequestDto } from 'src/modules/auth/dtos/request/auth.login-password.request.dto';
import { AuthRegisterRequestDto } from 'src/modules/auth/dtos/request/auth.register.request.dto';
import { AuthVerifyOtpRequestDto } from 'src/modules/auth/dtos/request/auth.verify-otp.request.dto';
import { AuthOtpResponseDataDto } from 'src/modules/auth/dtos/response/auth.otp.response.data.dto';
import { AuthSessionListResponseDataDto } from 'src/modules/auth/dtos/response/auth.session.list.response.data.dto';
import { AuthTokenResponseDataDto } from 'src/modules/auth/dtos/response/auth.token.response.data.dto';
import { AuthTokenResponseDto } from 'src/modules/auth/dtos/response/auth.token.response.dto';
import { IAuthTokenPayload } from 'src/modules/auth/interfaces/auth.user.interface';
import { AuthSessionService } from 'src/modules/auth/services/auth.session.service';
import { OtpService } from 'src/modules/auth/services/otp.service';
import { ShopService } from 'src/modules/shop/services/shop.service';
import {
  ENUM_USER_GENDER,
  ENUM_USER_ROLE,
} from 'src/modules/user/enums/user.enum';
import { UserDoc } from 'src/modules/user/entities/user.entity';
import { UserRepository } from 'src/modules/user/repositories/user.repository';
import { UserService } from 'src/modules/user/services/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly otpService: OtpService,
    private readonly authSessionService: AuthSessionService,
    private readonly userRepository: UserRepository,
    private readonly userService: UserService,
    private readonly shopService: ShopService,
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

  private emptyMeta() {
    return { createdBy: [] as [], updatedBy: [] as [] };
  }

  async requestOtp(phoneRaw: string): Promise<AuthOtpResponseDataDto> {
    const otp = await this.otpService.requestOtp(
      this.normalizePhone(phoneRaw),
    );
    return {
      otp,
      ...this.emptyMeta(),
    };
  }

  async register(
    dto: AuthRegisterRequestDto,
    userAgent?: string,
  ): Promise<AuthTokenResponseDataDto> {
    const phone = this.normalizePhone(dto.phone);
    const ok = await this.otpService.verifyOtp(phone, dto.otp);
    if (!ok) {
      throw new BadRequestException('auth.error.invalidOtp');
    }

    const existing = await this.userRepository.findOne({ phone });
    if (existing) {
      throw new BadRequestException('auth.error.phoneExists');
    }

    const shopId = await this.shopService.getDefaultShopId();
    const salt = this.helperHashService.randomSalt(10);
    const passwordHash = this.helperHashService.bcrypt(dto.password, salt);
    const user = await this.userRepository.create({
      phone,
      passwordHash,
      displayName: dto.displayName,
      shopId,
      role: ENUM_USER_ROLE.USER,
      gender: ENUM_USER_GENDER.UNKNOWN,
      bio: '',
      statusText: '',
      deleted: false,
    } as any);

    return this.issueTokens(user, userAgent);
  }

  async verifyOtpLogin(
    dto: AuthVerifyOtpRequestDto,
    userAgent?: string,
  ): Promise<AuthTokenResponseDataDto> {
    const phone = this.normalizePhone(dto.phone);
    const ok = await this.otpService.verifyOtp(phone, dto.otp);
    if (!ok) {
      throw new BadRequestException('auth.error.invalidOtp');
    }

    let user = await this.userRepository.findOne({ phone });
    if (!user) {
      const shopId = await this.shopService.getDefaultShopId();
      user = await this.userRepository.create({
        phone,
        displayName: phone,
        shopId,
        role: ENUM_USER_ROLE.USER,
        gender: ENUM_USER_GENDER.UNKNOWN,
        bio: '',
        statusText: '',
        deleted: false,
      } as any);
    } else {
      user = await this.ensureUserShopAndRole(user);
    }

    return this.issueTokens(user, userAgent);
  }

  async loginPassword(
    dto: AuthLoginPasswordRequestDto,
    userAgent?: string,
  ): Promise<AuthTokenResponseDataDto> {
    const phone = this.normalizePhone(dto.phone);
    const user = await this.userRepository.findOne(
      { phone },
      {
        select: {
          passwordHash: true,
          phone: true,
          displayName: true,
          shopId: true,
          role: true,
        },
      },
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

    const ready = await this.ensureUserShopAndRole(user);
    return this.issueTokens(ready, userAgent);
  }

  async refresh(refreshToken: string): Promise<AuthTokenResponseDataDto> {
    const session =
      await this.authSessionService.findByRefreshToken(refreshToken);
    if (!session) {
      throw new UnauthorizedException('auth.error.invalidRefresh');
    }

    let user = await this.userRepository.findOneById(session.userId);
    if (!user) {
      throw new UnauthorizedException('auth.error.userNotFound');
    }
    user = await this.ensureUserShopAndRole(user);

    const tokens = this.buildTokenPair({
      userId: user._id,
      phone: user.phone,
      shopId: user.shopId ?? null,
      role: user.role,
      sessionId: session.sessionId,
    });
    await this.authSessionService.rotateRefreshToken(
      user._id,
      session.sessionId,
      tokens.refreshToken,
    );

    return this.mapTokenData({
      ...tokens,
      user: this.userService.mapGet(user),
    });
  }

  async logout(
    userId: string,
    sessionId: string,
  ): Promise<{ _id: string }> {
    await this.authSessionService.revokeSession(userId, sessionId);
    return { _id: sessionId };
  }

  async listSessions(
    userId: string,
  ): Promise<AuthSessionListResponseDataDto> {
    const sessions = await this.authSessionService.listSessions(userId);
    return {
      sessions: sessions.map(s => ({
        sessionId: s.sessionId,
        createdAt: s.createdAt,
        lastActiveAt: s.lastActiveAt,
      })),
      ...this.emptyMeta(),
    };
  }

  async revokeSession(
    userId: string,
    sessionId: string,
  ): Promise<{ _id: string }> {
    await this.authSessionService.revokeSession(userId, sessionId);
    return { _id: sessionId };
  }

  private async ensureUserShopAndRole(user: UserDoc): Promise<UserDoc> {
    let dirty = false;
    if (!user.shopId) {
      user.shopId = await this.shopService.getDefaultShopId();
      dirty = true;
    }
    if (!user.role) {
      user.role = ENUM_USER_ROLE.USER;
      dirty = true;
    }
    if (dirty) {
      await this.userRepository.save(user);
    }
    return user;
  }

  private async issueTokens(
    user: UserDoc,
    userAgent?: string,
  ): Promise<AuthTokenResponseDataDto> {
    const sessionId = uuidV4();
    const tokens = this.buildTokenPair({
      userId: user._id,
      phone: user.phone,
      shopId: user.shopId ?? null,
      role: user.role ?? ENUM_USER_ROLE.USER,
      sessionId,
    });

    await this.authSessionService.createSession({
      userId: user._id,
      refreshToken: tokens.refreshToken,
      userAgent,
      sessionId,
    });

    return this.mapTokenData({
      ...tokens,
      user: this.userService.mapGet(user),
    });
  }

  private mapTokenData(auth: AuthTokenResponseDto): AuthTokenResponseDataDto {
    return {
      auth,
      ...this.emptyMeta(),
    };
  }

  private buildTokenPair(params: {
    userId: string;
    phone: string;
    shopId: string | null;
    role: ENUM_USER_ROLE;
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
      shopId: params.shopId,
      role: params.role,
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
