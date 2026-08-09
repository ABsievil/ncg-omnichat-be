import { ENUM_ZALO_THREAD_TYPE } from 'src/modules/zalo/enums/zalo.enum';

export interface IZaloSessionCredentials {
  cookie: string;
  imei: string;
  userAgent: string;
  proxy?: string;
}

export interface IZaloMessage {
  isSelf: boolean;
  threadId: string;
  type: ENUM_ZALO_THREAD_TYPE;
  userId: string;
  userName?: string;
  messageContent: string;
  raw?: unknown;
}

export interface IZaloSendMessageInput {
  shopId: string;
  threadId: string;
  message: string;
  type?: ENUM_ZALO_THREAD_TYPE;
}

export interface IZaloQrEvent {
  type: number;
  data?: {
    image?: string;
    display_name?: string;
    avatar?: string;
    cookie?: unknown;
    imei?: string;
    userAgent?: string;
    code?: string;
  };
}
