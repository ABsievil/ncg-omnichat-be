import { BadRequestException, Injectable } from '@nestjs/common';
import { ENUM_ZALO_SESSION_STATUS } from 'src/modules/zalo/enums/zalo.enum';
import { ENUM_ZALO_STATUS_CODE } from 'src/modules/zalo/enums/zalo.status-code.enum';

export interface IZaloSessionLike {
  status: ENUM_ZALO_SESSION_STATUS;
  cookieEncrypted: string;
  cookieIv?: string | null;
  imei: string;
  userAgent: string;
  proxy?: string | null;
}

@Injectable()
export class ZaloSessionError {
  static assertActive(
    session: IZaloSessionLike | null | undefined,
  ): asserts session is IZaloSessionLike {
    if (!session) {
      throw new BadRequestException({
        statusCode: ENUM_ZALO_STATUS_CODE.SESSION_NOT_FOUND,
        message: 'zalo.error.sessionNotFound',
      });
    }
    if (session.status === ENUM_ZALO_SESSION_STATUS.EXPIRED) {
      throw new BadRequestException({
        statusCode: ENUM_ZALO_STATUS_CODE.SESSION_EXPIRED,
        message: 'zalo.error.sessionExpired',
      });
    }
    if (session.status === ENUM_ZALO_SESSION_STATUS.DISABLED) {
      throw new BadRequestException({
        statusCode: ENUM_ZALO_STATUS_CODE.SESSION_EXPIRED,
        message: 'zalo.error.sessionDisabled',
      });
    }
  }

  throwLoginFailed(reason: string): never {
    throw new BadRequestException({
      statusCode: ENUM_ZALO_STATUS_CODE.LOGIN_FAILED,
      message: 'zalo.error.loginFailed',
      data: { reason },
    });
  }

  throwSendFailed(reason: string): never {
    throw new BadRequestException({
      statusCode: ENUM_ZALO_STATUS_CODE.SEND_FAILED,
      message: 'zalo.error.sendFailed',
      data: { reason },
    });
  }

  throwNotConnected(): never {
    throw new BadRequestException({
      statusCode: ENUM_ZALO_STATUS_CODE.NOT_CONNECTED,
      message: 'zalo.error.notConnected',
    });
  }

  throwSessionNotFound(): never {
    throw new BadRequestException({
      statusCode: ENUM_ZALO_STATUS_CODE.SESSION_NOT_FOUND,
      message: 'zalo.error.sessionNotFound',
    });
  }

  throwRiskNotAccepted(): never {
    throw new BadRequestException({
      statusCode: ENUM_ZALO_STATUS_CODE.RISK_NOT_ACCEPTED,
      message: 'zalo.error.riskNotAccepted',
    });
  }
}
