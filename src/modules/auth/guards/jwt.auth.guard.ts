import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { HelperEncryptionService } from 'src/common/helper/services/helper.encryption.service';
import { IRequestApp } from 'src/common/request/interfaces/request.interface';
import { IS_PUBLIC_KEY } from 'src/modules/auth/decorators/auth.public.decorator';
import {
  IAuthTokenPayload,
  IAuthUser,
} from 'src/modules/auth/interfaces/auth.user.interface';
import { AuthSessionService } from 'src/modules/auth/services/auth.session.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly helperEncryptionService: HelperEncryptionService,
    private readonly configService: ConfigService,
    private readonly authSessionService: AuthSessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<IRequestApp>();
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('auth.error.unauthorized');
    }

    const token = authHeader.slice(7);
    const secret =
      this.configService.get<string>('helper.jwt.defaultSecretKey') ??
      'omnichat-default-secret';

    const valid = this.helperEncryptionService.jwtVerify(token, {
      secretKey: secret,
      audience: 'omnichat',
      issuer: 'omnichat',
      subject: 'access',
      ignoreExpiration: false,
    });
    if (!valid) {
      throw new UnauthorizedException('auth.error.invalidToken');
    }

    const payload =
      this.helperEncryptionService.jwtDecrypt<IAuthTokenPayload>(token);
    if (!payload?.sub || payload.typ !== 'access' || !payload.sid) {
      throw new UnauthorizedException('auth.error.invalidToken');
    }

    const session = await this.authSessionService.getSession(
      payload.sub,
      payload.sid,
    );
    if (!session) {
      throw new UnauthorizedException('auth.error.sessionRevoked');
    }

    const authUser: IAuthUser = {
      userId: payload.sub,
      sessionId: payload.sid,
      phone: payload.phone,
    };
    request.user = { ...authUser, _id: payload.sub };
    return true;
  }
}
