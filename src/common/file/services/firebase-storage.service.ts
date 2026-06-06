import type { Bucket } from '@google-cloud/storage';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { extname } from 'path';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import {
    FILE_STORAGE_CONFIG_PATH,
    FILE_STORAGE_DEFAULTS,
} from 'src/common/file/constants/file-storage.constant';
import type { IFile } from 'src/common/file/interfaces/file.interface';
import type { IFileStorageService } from 'src/common/file/interfaces/file-storage.interface';

@Injectable()
export class FirebaseStorageService implements IFileStorageService {
    private readonly logger = new Logger(FirebaseStorageService.name);
    private bucket?: Bucket;
    private bucketUrl = '';
    private storageInitialized = false;

    constructor(private readonly configService: ConfigService) {
        this.initializeStorage();
    }

    private initializeStorage(): void {
        try {
            const storageBucket = this.configService.get<string>(
                FILE_STORAGE_CONFIG_PATH.FIREBASE.STORAGE_BUCKET,
            );
            const bucketUrl = this.configService.get<string>(
                FILE_STORAGE_CONFIG_PATH.FIREBASE.STORAGE_BUCKET_URL,
            );

            if (!storageBucket || !bucketUrl) {
                this.logger.warn(
                    'Firebase storage is not configured (bucket or public URL missing)',
                );
                return;
            }

            this.bucketUrl = bucketUrl.replace(/\/$/, '');

            if (!admin.apps.length) {
                const projectId = this.configService.get<string>(
                    FILE_STORAGE_CONFIG_PATH.FIREBASE.PROJECT_ID,
                );
                const clientEmail = this.configService.get<string>(
                    FILE_STORAGE_CONFIG_PATH.FIREBASE.CLIENT_EMAIL,
                );
                const privateKey = this.configService.get<string>(
                    FILE_STORAGE_CONFIG_PATH.FIREBASE.PRIVATE_KEY,
                );

                if (!projectId || !clientEmail || !privateKey) {
                    this.logger.warn(
                        'Firebase credentials are incomplete. Storage uploads are disabled.',
                    );
                    return;
                }

                const formattedPrivateKey = privateKey.includes('\\n')
                    ? privateKey.replace(/\\n/g, '\n')
                    : privateKey;

                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId,
                        clientEmail,
                        privateKey: formattedPrivateKey,
                    }),
                    storageBucket,
                });
            }

            this.bucket = admin.storage().bucket(storageBucket);
            this.storageInitialized = true;
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error);
            this.logger.error(
                `Failed to initialize Firebase Storage: ${message}`,
            );
        }
    }

    private assertReady(): void {
        if (!this.storageInitialized || !this.bucket) {
            throw new Error('Firebase Storage is not initialized');
        }
    }

    private generateObjectKey(
        originalName: string,
        path: string,
        pathPrefix: string,
    ): string {
        return `${path}/${pathPrefix}/${uuidv4()}${extname(originalName)}`;
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
        const fileRef = this.bucket!.file(objectKey);

        const stream = Readable.from(file.buffer);
        const writeStream = fileRef.createWriteStream({
            metadata: {
                contentType: file.mimetype,
                cacheControl: 'public, max-age=31536000',
                metadata: {
                    originalName: file.originalname,
                    uploadTimestamp: String(Date.now()),
                },
            },
            resumable: file.buffer.length > FILE_STORAGE_DEFAULTS.CHUNK_SIZE_BYTES,
            chunkSize: FILE_STORAGE_DEFAULTS.CHUNK_SIZE_BYTES,
            public: true,
        });

        await new Promise<void>((resolve, reject) => {
            stream
                .pipe(writeStream)
                .on('error', reject)
                .on('finish', () => resolve());
        });

        return `${this.bucketUrl}/${objectKey}`;
    }

    async uploadMultipleFiles(
        files: IFile[],
        path: string,
        pathPrefix: string[] = [],
    ): Promise<string[]> {
        return this.processBatchedUploads(files, (file, index) => {
            const prefix =
                pathPrefix.length > 1
                    ? (pathPrefix[index] ?? FILE_STORAGE_DEFAULTS.PATH_PREFIX)
                    : (pathPrefix[0] ?? FILE_STORAGE_DEFAULTS.PATH_PREFIX);

            return this.uploadFile(file, path, prefix);
        });
    }

    async fastUploadMultipleFiles(
        files: IFile[],
        path: string,
        pathPrefix: string[] = [],
    ): Promise<string[]> {
        if (!files.length) {
            return [];
        }

        return Promise.all(
            files.map((file, index) =>
                this.uploadFile(
                    file,
                    path,
                    pathPrefix[index] ?? FILE_STORAGE_DEFAULTS.PATH_PREFIX,
                ),
            ),
        ).then(results =>
            results.filter((url): url is string => Boolean(url)),
        );
    }

    async deleteFile(fileUrl: string): Promise<void> {
        this.assertReady();

        if (!fileUrl) {
            return;
        }

        const objectKey = fileUrl.replace(`${this.bucketUrl}/`, '');
        const fileRef = this.bucket!.file(objectKey);
        const [exists] = await fileRef.exists();

        if (!exists) {
            this.logger.warn(`Firebase object not found: ${objectKey}`);
            return;
        }

        await fileRef.delete();
    }

    async deleteMultipleFiles(fileUrls: string[]): Promise<void> {
        if (!fileUrls.length) {
            return;
        }

        await this.processBatchedDeletes(fileUrls, url => this.deleteFile(url));
    }

    private async processBatchedUploads(
        files: IFile[],
        uploadFn: (file: IFile, index: number) => Promise<string | undefined>,
    ): Promise<string[]> {
        if (!files.length) {
            return [];
        }

        const results: string[] = [];
        const batchSize = FILE_STORAGE_DEFAULTS.PARALLEL_BATCH_SIZE;

        for (let offset = 0; offset < files.length; offset += batchSize) {
            const batch = files.slice(offset, offset + batchSize);
            const batchResults = await Promise.all(
                batch.map((file, batchIndex) =>
                    uploadFn(file, offset + batchIndex),
                ),
            );

            batchResults.forEach((url, batchIndex) => {
                if (url) {
                    results[offset + batchIndex] = url;
                }
            });
        }

        return results.filter(Boolean);
    }

    private async processBatchedDeletes(
        fileUrls: string[],
        deleteFn: (fileUrl: string) => Promise<void>,
    ): Promise<void> {
        const batchSize = FILE_STORAGE_DEFAULTS.PARALLEL_BATCH_SIZE;

        for (let offset = 0; offset < fileUrls.length; offset += batchSize) {
            const batch = fileUrls.slice(offset, offset + batchSize);
            await Promise.all(batch.map(url => deleteFn(url)));
        }
    }
}
