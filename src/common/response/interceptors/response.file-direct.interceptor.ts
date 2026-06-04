import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
    StreamableFile,
} from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { Reflector } from '@nestjs/core';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_FILE_OPTIONS_META_KEY } from 'src/common/response/constants/response.constant';
import { ENUM_MIME_TYPE } from 'src/common/response/enums/response.enum';
import {
    IResponseFile,
    IResponseFileOptions,
} from 'src/common/response/interfaces/response.interface';

@Injectable()
export class ResponseFileDirectInterceptor
    implements NestInterceptor<Promise<any>>
{
    constructor(private readonly reflector: Reflector) {}

    intercept(
        context: ExecutionContext,
        next: CallHandler
    ): Observable<Promise<StreamableFile>> {
        if (context.getType() === 'http') {
            return next.handle().pipe(
                map(async (res: Promise<IResponseFile>) => {
                    const ctx: HttpArgumentsHost = context.switchToHttp();
                    const response: Response = ctx.getResponse();

                    const options: IResponseFileOptions =
                        this.reflector.get<IResponseFileOptions>(
                            RESPONSE_FILE_OPTIONS_META_KEY,
                            context.getHandler()
                        ) || {};

                    // set default response
                    const responseData = (await res) as IResponseFile;

                    if (!responseData) {
                        throw new Error(
                            'ResponseFile must instanceof IResponseFile'
                        );
                    } else if (
                        !responseData.file ||
                        !Buffer.isBuffer(responseData.file)
                    ) {
                        throw new Error('Field file must be a Buffer');
                    }

                    // Use filename from response data or options or default
                    const filename =
                        responseData.filename || options.filename || 'download';

                    // Use contentType from response data or options or default
                    const contentType =
                        responseData.contentType ||
                        options.contentType ||
                        ENUM_MIME_TYPE.APPLICATION_OCTET_STREAM;

                    // set headers
                    response
                        .setHeader('Content-Type', contentType)
                        .setHeader(
                            'Content-Disposition',
                            `attachment; filename=${filename}`
                        )
                        .setHeader('Content-Length', responseData.file.length);

                    return new StreamableFile(responseData.file);
                })
            );
        }

        return next.handle();
    }
}
