import {
    DeleteObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { extname } from 'path';
import { PARALLEL_PROCESSES_LIMIT } from 'src/common/file/constants/r2.constant';
import { IFile } from 'src/common/file/interfaces/file.interface';
import { IR2Service } from 'src/common/file/interfaces/r2.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class R2Service implements IR2Service {
    private readonly s3: S3Client;
    private readonly bucket: string;
    private readonly logger = new Logger(R2Service.name);
    constructor(private readonly configService: ConfigService) {
        const accessKeyId = this.configService.get('r2.accessKeyId');
        const secretAccessKey = this.configService.get('r2.secretAccessKey');
        const endpoint = this.configService.get('r2.endpoint');
        const bucket = this.configService.get('r2.bucket');
        this.s3 = new S3Client({
            region: 'auto',
            endpoint: endpoint,
            credentials: {
                accessKeyId: accessKeyId,
                secretAccessKey: secretAccessKey,
            },
        });
        this.bucket = bucket;
    }

    async uploadFile(
        file: IFile,
        path: string = 'uploads',
        pathPrefix: string = 'uploads'
    ): Promise<string> {
        if (!file || !file.buffer) {
            return;
        }
        try {
            const key = this.generateFileName(
                file.originalname,
                path,
                pathPrefix
            );

            await this.s3.send(
                new PutObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                })
            );
            const publicEndpoint = this.configService.get('r2.publicEndpoint');
            const fileUrl = `${publicEndpoint.replace(/\/$/, '')}/${key}`;
            return fileUrl;
        } catch (error) {
            this.logger.error(`Error uploading file: ${error.message}`);
            throw new Error(`File upload failed: ${error.message}`);
        }
    }

    async uploadMultipleFiles(
        files: IFile[],
        path: string,
        pathPrefix: string[] = []
    ): Promise<string[]> {
        if (!files || files.length === 0) {
            return [];
        }
        const results: string[] = [];
        const errors: Error[] = [];
        for (let i = 0; i < files.length; i += PARALLEL_PROCESSES_LIMIT) {
            const batch = files.slice(i, i + PARALLEL_PROCESSES_LIMIT);
            const batchPromises = batch.map((file, index) => {
                const actualIndex = i + index;
                const prefix =
                    pathPrefix.length > 1
                        ? pathPrefix[i + index]
                        : pathPrefix[0];
                return this.uploadFile(file, path, prefix)
                    .then(url => (results[actualIndex] = url))
                    .catch(error => {
                        errors.push(error);
                        return null;
                    });
            });

            await Promise.all(batchPromises);
        }
        if (errors.length > 0) {
            this.logger.warn(
                `${errors.length} files failed to upload out of ${files.length}`
            );
        }
        return results;
    }

    async deleteFile(fileUrl: string): Promise<void> {
        try {
            if (!fileUrl) {
                return;
            }

            const url = new URL(fileUrl);
            const key = url.pathname.substring(1);

            await this.s3.send(
                new DeleteObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                })
            );
        } catch (error) {
            this.logger.error('Delete failed:', error);
            throw new Error(`Delete failed: ${error.message}`);
        }
    }

    async deleteMultipleFiles(fileUrls: string[]): Promise<void> {
        await Promise.all(fileUrls.map(url => this.deleteFile(url)));
    }

    async deleteMultipleFilesWithBatch(fileUrls: string[]): Promise<void> {
        if (!fileUrls || fileUrls.length === 0) {
            return;
        }
        const errors: Error[] = [];
        for (let i = 0; i < fileUrls.length; i += PARALLEL_PROCESSES_LIMIT) {
            const batch = fileUrls.slice(i, i + PARALLEL_PROCESSES_LIMIT);
            await Promise.all(
                batch.map(url =>
                    this.deleteFile(url).catch(error => {
                        errors.push(error);
                        return null;
                    })
                )
            );
        }
        if (errors.length > 0) {
            this.logger.warn(
                `${errors.length} files failed to delete out of ${fileUrls.length}`
            );
        }
    }

    async fastUploadMultipleFiles(
        files: IFile[],
        path: string,
        pathPrefix: string[]
    ): Promise<string[]> {
        return Promise.all(
            files.map((file, idx) =>
                this.uploadFile(file, path, pathPrefix[idx] || '')
            )
        );
    }

    private generateFileName(
        originalName: string,
        path: string,
        pathPrefix: string
    ): string {
        const fileExtension = extname(originalName);
        return `${path}/${pathPrefix}/${uuidv4()}${fileExtension}`;
    }
}
