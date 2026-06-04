import {
    HttpException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { ENUM_APP_STATUS_CODE_ERROR } from 'src/app/enums/app.status-code.enum';
import { HTTP_DEFAULT_MESSAGE } from 'src/common/helper/constants/http.constants';
import { IHelperHttpService } from 'src/common/helper/interfaces/helper.http-service.interface';

@Injectable()
export class HelperHttpService implements IHelperHttpService {
    throwInternalServerError(
        error: unknown,
        context: string,
        message: string = HTTP_DEFAULT_MESSAGE
    ): never {
        if (error instanceof HttpException) {
            throw error;
        }

        console.error(context, error);

        const normalizedError =
            error instanceof Error ? error : new Error('Unknown error');

        throw new InternalServerErrorException({
            statusCode: ENUM_APP_STATUS_CODE_ERROR.UNKNOWN,
            message,
            _error: normalizedError.message,
        });
    }
}
