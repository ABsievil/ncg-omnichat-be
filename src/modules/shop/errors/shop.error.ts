import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ENUM_SHOP_STATUS } from 'src/modules/shop/enums/shop.enum';
import { ENUM_SHOP_STATUS_CODE } from 'src/modules/shop/enums/shop.status-code.enum';

@Injectable()
export class ShopError {
  throwNotFound(): never {
    throw new NotFoundException({
      statusCode: ENUM_SHOP_STATUS_CODE.NOT_FOUND,
      message: 'shop.error.notFound',
    });
  }

  throwCodeExists(): never {
    throw new BadRequestException({
      statusCode: ENUM_SHOP_STATUS_CODE.CODE_EXISTS,
      message: 'shop.error.codeExists',
    });
  }

  throwDisabled(): never {
    throw new BadRequestException({
      statusCode: ENUM_SHOP_STATUS_CODE.DISABLED,
      message: 'shop.error.disabled',
    });
  }

  throwShopIdRequired(): never {
    throw new BadRequestException({
      statusCode: ENUM_SHOP_STATUS_CODE.SHOP_ID_REQUIRED,
      message: 'shop.error.shopIdRequired',
    });
  }

  assertActive(status?: ENUM_SHOP_STATUS | null): void {
    if (status === ENUM_SHOP_STATUS.DISABLED) {
      this.throwDisabled();
    }
  }
}
