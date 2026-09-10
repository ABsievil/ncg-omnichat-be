import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ENUM_AUTH_STATUS_CODE } from 'src/modules/auth/enums/auth.status-code.enum';

@Injectable()
export class AuthError {
  static throwForbidden(): never {
    throw new ForbiddenException({
      statusCode: ENUM_AUTH_STATUS_CODE.FORBIDDEN,
      message: 'auth.error.forbidden',
    });
  }

  static throwShopRequired(): never {
    throw new ForbiddenException({
      statusCode: ENUM_AUTH_STATUS_CODE.SHOP_REQUIRED,
      message: 'auth.error.shopRequired',
    });
  }

  static throwCrossShop(): never {
    throw new ForbiddenException({
      statusCode: ENUM_AUTH_STATUS_CODE.CROSS_SHOP,
      message: 'auth.error.crossShop',
    });
  }

  static throwOtpDailyLimit(): never {
    throw new BadRequestException({
      statusCode: ENUM_AUTH_STATUS_CODE.OTP_DAILY_LIMIT,
      message: 'auth.error.otpDailyLimit',
    });
  }
}
