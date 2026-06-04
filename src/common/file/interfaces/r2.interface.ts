import { IFile } from 'src/common/file/interfaces/file.interface';

export interface IR2Service {
    uploadFile(file: IFile, path: string, pathPrefix: string): Promise<string>;
    uploadMultipleFiles(
        files: IFile[],
        path: string,
        pathPrefix: string[]
    ): Promise<string[]>;
    deleteFile(fileUrl: string): Promise<void>;
    deleteMultipleFiles(fileUrls: string[]): Promise<void>;
    fastUploadMultipleFiles(
        files: IFile[],
        path: string,
        pathPrefix: string[]
    ): Promise<string[]>;
    deleteMultipleFilesWithBatch(fileUrls: string[]): Promise<void>;
}
