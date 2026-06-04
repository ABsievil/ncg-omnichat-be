import { Bucket } from '@google-cloud/storage';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { extname } from 'path';
import { IFile } from 'src/common/file/interfaces/file.interface';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';

const CHUNK_SIZE = 5 * 1024 * 1024;
const PARALLEL_UPLOAD_LIMIT = 5;

@Injectable()
export class FirebaseStorageService {
    private readonly logger = new Logger(FirebaseStorageService.name);
    private bucket: Bucket;
    private storageInitialized = false;
    private bucketUrl: string;

    constructor(private configService: ConfigService) {
        this.initializeStorage();
    }

    private initializeStorage() {
        try {
            const storageBucket = this.configService.get<string>(
                'firebase.storageBucket'
            );
            this.bucketUrl = this.configService.get<string>(
                'firebase.storageBucketUrl'
            );

            if (!storageBucket) {
                this.logger.warn('Firebase storage bucket is not configured');
                return;
            }

            if (!admin.apps.length) {
                const projectId =
                    this.configService.get<string>('firebase.projectId');
                const clientEmail = this.configService.get<string>(
                    'firebase.clientEmail'
                );
                const privateKey = this.configService.get<string>(
                    'firebase.privateKey'
                );

                if (!projectId || !clientEmail || !privateKey) {
                    this.logger.warn(
                        'Firebase credentials are incomplete. Firebase storage will not work.'
                    );
                    return;
                }

                const formattedPrivateKey = privateKey.includes('\\n')
                    ? privateKey.replace(/\\n/g, '\n')
                    : privateKey;

                try {
                    admin.initializeApp({
                        credential: admin.credential.cert({
                            projectId,
                            clientEmail,
                            privateKey: formattedPrivateKey,
                        }),
                        storageBucket: storageBucket,
                    });
                    // this.logger.log(
                    //     'Firebase Admin SDK initialized successfully'
                    // );
                } catch (error) {
                    this.logger.error(
                        `Failed to initialize Firebase: ${error.message}`
                    );
                    return;
                }
            }

            this.bucket = admin.storage().bucket(storageBucket);
            this.storageInitialized = true;
        } catch (error) {
            this.logger.error(
                `Failed to initialize Firebase Storage: ${error.message}`
            );
        }
    }

    private checkStorageInitialized(): void {
        if (!this.storageInitialized || !this.bucket) {
            throw new Error('Firebase Storage not initialized');
        }
    }

    private generateFileName(
        originalName: string,
        path: string,
        pathPrefix: string
    ): string {
        const fileExtension = extname(originalName);
        return `${path}/${pathPrefix}/${uuidv4()}${fileExtension}`;
    }

    async uploadFile(
        file: IFile,
        path: string = 'uploads',
        pathPrefix: string = 'uploads'
    ): Promise<string> {
        this.checkStorageInitialized();
        if (!file || !file.buffer) {
            return;
        }

        try {
            const fileName = this.generateFileName(
                file.originalname,
                path,
                pathPrefix
            );
            const fileRef = this.bucket.file(fileName);

            const metadata = {
                contentType: file.mimetype,
                cacheControl: 'public, max-age=31536000',
                metadata: {
                    originalName: file.originalname,
                    uploadTimestamp: Date.now(),
                },
            };

            const options = {
                metadata,
                resumable: file.buffer.length > CHUNK_SIZE,
                chunkSize: CHUNK_SIZE,
                public: true,
            };

            const stream = Readable.from(file.buffer);
            const writeStream = fileRef.createWriteStream(options);

            await new Promise((resolve, reject) => {
                stream
                    .pipe(writeStream)
                    .on('error', error => {
                        this.logger.error(`Stream error: ${error.message}`);
                        reject(error);
                    })
                    .on('finish', resolve);
            });

            const publicUrl = `${this.bucketUrl}/${fileName}`;
            return publicUrl;
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

        for (let i = 0; i < files.length; i += PARALLEL_UPLOAD_LIMIT) {
            const batch = files.slice(i, i + PARALLEL_UPLOAD_LIMIT);
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

    async fastUploadMultipleFiles(
        files: IFile[],
        path: string,
        pathPrefix: string[] = []
    ): Promise<string[]> {
        if (!files || files.length === 0) {
            return [];
        }

        const uploadPromises = files.map((file, index) => {
            const prefix = pathPrefix[index] || 'uploads';
            return this.uploadFile(file, path, prefix);
        });

        return Promise.all(uploadPromises);
    }

    async deleteFile(fileUrl: string): Promise<void> {
        this.checkStorageInitialized();
        if (!fileUrl) {
            return;
        }

        try {
            const fileName = fileUrl.replace(`${this.bucketUrl}/`, '');

            const [exists] = await this.bucket.file(fileName).exists();
            if (!exists) {
                this.logger.warn(`File ${fileName} does not exist`);
                return;
            }

            await this.bucket.file(fileName).delete();
        } catch (error) {
            this.logger.error(`Error deleting file: ${error.message}`);
            throw new Error(`File deletion failed: ${error.message}`);
        }
    }

    async deleteMultipleFiles(fileUrls: string[]): Promise<void> {
        if (!fileUrls || fileUrls.length === 0) {
            return;
        }

        const errors: Error[] = [];

        for (let i = 0; i < fileUrls.length; i += PARALLEL_UPLOAD_LIMIT) {
            const batch = fileUrls.slice(i, i + PARALLEL_UPLOAD_LIMIT);
            const batchPromises = batch.map(url =>
                this.deleteFile(url).catch(error => {
                    errors.push(error);
                    return null;
                })
            );

            await Promise.all(batchPromises);
        }

        if (errors.length > 0) {
            this.logger.warn(
                `${errors.length} files failed to delete out of ${fileUrls.length}`
            );
        } else {
            this.logger.log(`${fileUrls.length} files deleted successfully`);
        }
    }
}
