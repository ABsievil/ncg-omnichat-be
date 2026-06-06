import type { IFile } from 'src/common/file/interfaces/file.interface';

export interface IFileStorageService {
    uploadFile(
        file: IFile,
        path?: string,
        pathPrefix?: string,
    ): Promise<string | undefined>;

    uploadMultipleFiles(
        files: IFile[],
        path: string,
        pathPrefix?: string[],
    ): Promise<string[]>;

    fastUploadMultipleFiles(
        files: IFile[],
        path: string,
        pathPrefix?: string[],
    ): Promise<string[]>;

    deleteFile(fileUrl: string): Promise<void>;

    deleteMultipleFiles(fileUrls: string[]): Promise<void>;
}
