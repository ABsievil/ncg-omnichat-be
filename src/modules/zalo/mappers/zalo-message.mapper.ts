import { ThreadType } from 'zca-js';
import { ZALO_QUOTE_DEFAULT_MSG_TYPE } from 'src/modules/zalo/constants/zalo.constant';
import { ENUM_ZALO_THREAD_TYPE } from 'src/modules/zalo/enums/zalo.enum';
import {
  IZaloGroupMention,
  IZaloMessage,
  IZaloMessageQuote,
} from 'src/modules/zalo/interfaces/zalo.interface';

type ZaloRawIncomingMessage = {
  isSelf?: unknown;
  threadId?: unknown;
  type?: unknown;
  data?: unknown;
};

function asTrimmedString(value: unknown): string | undefined {
  if (typeof value === 'string' || typeof value === 'number') {
    const text = String(value).trim();
    return text || undefined;
  }
  return undefined;
}

export function mapIncomingZaloMessage(message: unknown): IZaloMessage | null {
  if (!message || typeof message !== 'object') {
    return null;
  }

  const msg = message as ZaloRawIncomingMessage;
  const data =
    msg.data && typeof msg.data === 'object'
      ? (msg.data as Record<string, unknown>)
      : {};
  const content = data.content;
  if (typeof content !== 'string' || !content.trim()) {
    return null;
  }

  const threadType =
    msg.type === ThreadType.Group || msg.type === 1
      ? ENUM_ZALO_THREAD_TYPE.GROUP
      : ENUM_ZALO_THREAD_TYPE.USER;

  return {
    isSelf: !!msg.isSelf,
    threadId: asTrimmedString(msg.threadId) ?? '',
    type: threadType,
    userId:
      asTrimmedString(data.uidFrom) ?? asTrimmedString(msg.threadId) ?? '',
    userName: extractZaloSenderName(data),
    messageContent: content.trim(),
    quote: extractZaloQuote(data),
    mentions: extractZaloMentions(data),
    raw: message,
  };
}

export function extractZaloSenderName(
  data: Record<string, unknown>,
): string | undefined {
  return (
    asTrimmedString(data.dName) ??
    asTrimmedString(data.displayName) ??
    asTrimmedString(data.zaloName)
  );
}

export function extractZaloQuote(
  data: Record<string, unknown>,
): IZaloMessageQuote | undefined {
  const msgIdValue = asTrimmedString(data.msgId) ?? asTrimmedString(data.msgID);
  const uidFromValue = asTrimmedString(data.uidFrom);
  if (!msgIdValue || !uidFromValue) {
    return undefined;
  }

  const content = data.content;
  const msgType =
    asTrimmedString(data.msgType) ??
    (typeof content === 'string' ? ZALO_QUOTE_DEFAULT_MSG_TYPE : undefined);

  return {
    content,
    msgType,
    propertyExt: data.propertyExt,
    uidFrom: uidFromValue,
    msgId: msgIdValue,
    cliMsgId: asTrimmedString(data.cliMsgId),
    ts: typeof data.ts === 'number' ? data.ts : asTrimmedString(data.ts),
    ttl: typeof data.ttl === 'number' ? data.ttl : undefined,
  };
}

export function extractZaloMentions(
  data: Record<string, unknown>,
): IZaloGroupMention[] | undefined {
  const fromArray = parseMentionList(data.mentions);
  if (fromArray.length) {
    return fromArray;
  }

  if (typeof data.mentionInfo === 'string' && data.mentionInfo.trim()) {
    try {
      const parsed: unknown = JSON.parse(data.mentionInfo);
      const fromInfo = parseMentionList(parsed);
      if (fromInfo.length) {
        return fromInfo;
      }
    } catch {
      return undefined;
    }
  }

  return undefined;
}

function parseMentionList(raw: unknown): IZaloGroupMention[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const mentions: IZaloGroupMention[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const row = item as Record<string, unknown>;
    const uid = asTrimmedString(row.uid);
    const pos = toFiniteNumber(row.pos);
    const len = toFiniteNumber(row.len);
    if (!uid || pos == null || len == null || len <= 0) {
      continue;
    }
    mentions.push({ uid, pos, len });
  }
  return mentions;
}

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function buildGroupMentionReply(input: {
  reply: string;
  senderName?: string;
  userId: string;
}): { message: string; mentions?: IZaloGroupMention[] } {
  const name = input.senderName?.trim();
  if (!name || !input.userId) {
    return { message: input.reply };
  }

  const mentionLabel = `@${name}`;
  return {
    message: `${mentionLabel} ${input.reply}`,
    mentions: [
      {
        pos: 0,
        uid: input.userId,
        len: mentionLabel.length,
      },
    ],
  };
}
