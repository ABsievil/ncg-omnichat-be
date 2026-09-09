import { ENUM_ZALO_THREAD_TYPE } from 'src/modules/zalo/enums/zalo.enum';

export interface IZaloSessionCredentials {
  cookie: string;
  imei: string;
  userAgent: string;
  proxy?: string;
}

export interface IZaloMessageQuote {
  content: unknown;
  msgType?: string;
  propertyExt?: unknown;
  uidFrom: string;
  msgId: string;
  cliMsgId?: string;
  ts?: string | number;
  ttl?: number;
}

export interface IZaloGroupMention {
  pos: number;
  uid: string;
  len: number;
}

export interface IZaloMessage {
  isSelf: boolean;
  threadId: string;
  type: ENUM_ZALO_THREAD_TYPE;
  userId: string;
  userName?: string;
  messageContent: string;
  quote?: IZaloMessageQuote;
  mentions?: IZaloGroupMention[];
  raw?: unknown;
}

export interface IZaloSendMessageInput {
  shopId: string;
  threadId: string;
  message: string;
  type?: ENUM_ZALO_THREAD_TYPE;
  quote?: IZaloMessageQuote;
  mentions?: IZaloGroupMention[];
}

export interface IZaloBotIdentity {
  ownId?: string;
  names: string[];
}

export interface IZaloGroupAddressInput {
  messageContent: string;
  mentions?: IZaloGroupMention[];
  identity: IZaloBotIdentity;
}

export interface IZaloResolveSenderNameInput {
  shopId: string;
  userId: string;
  type: ENUM_ZALO_THREAD_TYPE;
  userName?: string;
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
