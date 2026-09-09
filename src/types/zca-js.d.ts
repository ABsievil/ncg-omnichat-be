declare module 'zca-js' {
  export enum ThreadType {
    User = 0,
    Group = 1,
  }

  export type Credentials = {
    imei: string;
    cookie: unknown;
    userAgent: string;
    language?: string;
  };

  export type LoginQRCallback = (event: {
    type: number;
    data?: Record<string, any>;
  }) => void;

  export class API {
    listener: {
      on(event: 'message', handler: (message: unknown) => void | Promise<void>): void;
      off(event: string, handler: (...args: any[]) => void): void;
      onConnected(handler: () => void): void;
      onClosed(handler: () => void): void;
      onError(handler: (error: unknown) => void): void;
      start(): void;
      stop(): void;
    };
    sendMessage(
      message: { msg: string; [key: string]: unknown },
      threadId: string,
      type: ThreadType,
    ): Promise<unknown>;
    sendTypingEvent(threadId: string, type: ThreadType): Promise<unknown>;
    getOwnId?(): string | number;
    getContext?(): Record<string, unknown>;
    getGroupMembersInfo?(memberId: string | string[]): Promise<{
      profiles?: Record<string, { displayName?: string; zaloName?: string }>;
    }>;
    fetchAccountInfo?(): Promise<{
      profile?: {
        userId?: string;
        username?: string;
        displayName?: string;
        zaloName?: string;
      };
      userId?: string;
      username?: string;
      displayName?: string;
      zaloName?: string;
    }>;
    context?: Record<string, unknown>;
  }

  export class Zalo {
    constructor(options?: Record<string, unknown>);
    login(credentials: Credentials): Promise<API>;
    loginQR(
      options?: {
        userAgent?: string;
        language?: string;
        qrPath?: string;
      },
      callback?: LoginQRCallback,
    ): Promise<API>;
  }
}
