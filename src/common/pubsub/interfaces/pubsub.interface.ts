export interface IPubSubMessage {
    id: string;
    attributes: Record<string, string>;
    data: Buffer;
    publishTime: Date;
}

export interface IPubSubPublishOptions {
    attributes?: Record<string, string>;
}

export interface IPubSubPublishRetryOptions {
    maxRetries?: number;
    retryDelayMs?: number;
}

export interface IPubSubSubscribeOptions {
    flowControl?: {
        maxMessages?: number;
        allowExcessMessages?: boolean;
    };
}
