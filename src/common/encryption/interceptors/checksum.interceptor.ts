import {
    BadRequestException,
    CallHandler,
    ExecutionContext,
    HttpStatus,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { HelperHashService } from 'src/common/helper/services/helper.hash.service';

@Injectable()
export class ChecksumInterceptor implements NestInterceptor {
    constructor(
        private readonly configService: ConfigService,
        private readonly helperHashService: HelperHashService
    ) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const { data, checksum } = req.body;

        if (!checksum) {
            throw new BadRequestException({
                statusCode: HttpStatus.BAD_REQUEST,
                message: 'auth.error.checksumRequired',
            });
        }

        const secret =
            this.configService.get<string>('app.clientAppKey') ?? '';

        if (
            !secret ||
            !this.helperHashService.isValidDataChecksum(
                data,
                checksum,
                secret,
            )
        ) {
            throw new BadRequestException({
                statusCode: HttpStatus.BAD_REQUEST,
                message: 'auth.error.checksumInvalid',
            });
        }

        return next.handle();
    }
}
