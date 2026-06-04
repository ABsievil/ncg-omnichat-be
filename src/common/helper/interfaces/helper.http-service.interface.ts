export interface IHelperHttpService {
    throwInternalServerError(
        error: Error,
        context: string,
        message?: string
    ): never;
}
