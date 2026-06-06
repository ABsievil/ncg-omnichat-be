import {
    DeleteObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
    FILE_STORAGE_CONFIG_PATH,
    FILE_STORAGE_DEFAULTS,
} from 'src/common/file/constants/file-storage.constant';
import type { IFile } from 'src/common/file/interfaces/file.interface';
import type { IR2Service } from 'src/common/file/interfaces/r2.interface';

@Injectable()
export class R2Service implements IR2Service {
    private readonly logger = new Logger(R2Service.name);
    private readonly s3?: S3Client;
    private readonly bucket: string;
    private readonly publicEndpoint: string;
    private readonly configured: boolean;

    constructor(private readonly configService: ConfigService) {
        const accessKeyId = this.configService.get<string>(
            FILE_STORAGE_CONFIG_PATH.R2.ACCESS_KEY_ID,
        );
        const secretAccessKey = this.configService.get<string>(
            FILE_STORAGE_CONFIG_PATH.R2.SECRET_ACCESS_KEY,
        );
        const endpoint = this.configService.get<string>(
            FILE_STORAGE_CONFIG_PATH.R2.ENDPOINT,
        );
        const bucket =
            this.configService.get<string>(
                FILE_STORAGE_CONFIG_PATH.R2.BUCKET,
            ) ?? '';
        const publicEndpoint =
            this.configService.get<string>(
                FILE_STORAGE_CONFIG_PATH.R2.PUBLIC_ENDPOINT,
            ) ?? '';

        this.bucket = bucket;
        this.publicEndpoint = publicEndpoint.replace(/\/$/, '');
        this.configured = Boolean(
            accessKeyId &&
                secretAccessKey &&
                endpoint &&
                bucket &&
                publicEndpoint,
        );

        if (!this.configured) {
            this.logger.warn('R2 storage is not fully configured');
            return;
        }

        this.s3 = new S3Client({
            region: 'auto',
            endpoint,
            credentials: {
                accessKeyId: accessKeyId!,
                secretAccessKey: secretAccessKey!,
            },
        });
    }

    private assertReady(): void {
        if (!this.configured || !this.s3) {
            throw new Error('R2 storage is not configured');
        }
    }

    private generateObjectKey(
        originalName: string,
        path: string,
        pathPrefix: string,
    ): string {
        return `${path}/${pathPrefix}/${uuidv4()}${extname(originalName)}`;
    }

    private buildPublicUrl(objectKey: string): string {
        return `${this.publicEndpoint}/${objectKey}`;
    }

    async uploadFile(
        file: IFile,
        path: string = FILE_STORAGE_DEFAULTS.UPLOAD_PATH,
        pathPrefix: string = FILE_STORAGE_DEFAULTS.PATH_PREFIX,
    ): Promise<string | undefined> {
        this.assertReady();

        if (!file?.buffer) {
            return undefined;
        }

        const objectKey = this.generateObjectKey(
            file.originalname,
            path,
            pathPrefix,
        );

        await this.s3!.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: objectKey,
                Body: file.buffer,
                ContentType: file.mimetype,
            }),
        );

        return this.buildPublicUrl(objectKey);
    }

    async uploadMultipleFiles(
        files: IFile[],
        path: string,
        pathPrefix: string[] = [],
    ): Promise<string[]> {
        if (!files.length) {
            return [];
        }

        const results: string[] = [];
        const batchSize = FILE_STORAGE_DEFAULTS.PARALLEL_BATCH_SIZE;

        for (let offset = 0; offset < files.length; offset += batchSize) {
            const batch = files.slice(offset, offset + batchSize);
            const batchResults = await Promise.all(
                batch.map((file, batchIndex) => {
                    const index = offset + batchIndex;
                    const prefix =
                        pathPrefix.length > 1
                            ? (pathPrefix[index] ??
                              FILE_STORAGE_DEFAULTS.PATH_PREFIX)
                            : (pathPrefix[0] ??
                              FILE_STORAGE_DEFAULTS.PATH_PREFIX);

                    return this.uploadFile(file, path, prefix);
                }),
            );

            batchResults.forEach((url, batchIndex) => {
                if (url) {
                    results[offset + batchIndex] = url;
                }
            });
        }

        return results.filter(Boolean);
    }

    async fastUploadMultipleFiles(
        files: IFile[],
        path: string,
        pathPrefix: string[] = [],
    ): Promise<string[]> {
        if (!files.length) {
            return [];
        }

        const uploads = await Promise.all(
            files.map((file, index) =>
                this.uploadFile(
                    file,
                    path,
                    pathPrefix[index] ?? FILE_STORAGE_DEFAULTS.PATH_PREFIX,
                ),
            ),
        );

        return uploads.filter((url): url is string => Boolean(url));
    }

    async deleteFile(fileUrl: string): Promise<void> {
        this.assertReady();

        if (!fileUrl) {
            return;
        }

        const objectKey = new URL(fileUrl).pathname.replace(/^\//, '');

        await this.s3!.send(
            new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: objectKey,
            }),
        );
    }

    async deleteMultipleFiles(fileUrls: string[]): Promise<void> {
        if (!fileUrls.length) {
            return;
        }

        const batchSize = FILE_STORAGE_DEFAULTS.PARALLEL_BATCH_SIZE;

        for (let offset = 0; offset < fileUrls.length; offset += batchSize) {
            const batch = fileUrls.slice(offset, offset + batchSize);
            await Promise.all(batch.map(url => this.deleteFile(url)));
        }
    }
}
