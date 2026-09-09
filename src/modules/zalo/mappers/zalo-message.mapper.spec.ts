import { ENUM_ZALO_THREAD_TYPE } from 'src/modules/zalo/enums/zalo.enum';
import {
  buildGroupMentionReply,
  extractZaloQuote,
  extractZaloSenderName,
  mapIncomingZaloMessage,
} from 'src/modules/zalo/mappers/zalo-message.mapper';

describe('zalo-message.mapper', () => {
  describe('mapIncomingZaloMessage', () => {
    it('maps a group text message with sender name and quote payload', () => {
      const mapped = mapIncomingZaloMessage({
        isSelf: false,
        threadId: 'group-1',
        type: 1,
        data: {
          uidFrom: 'user-9',
          dName: 'An Nguyen',
          content: 'Cho mình hỏi trạm gần nhất',
          msgId: 'msg-11',
          cliMsgId: 'cli-11',
          msgType: 'webchat',
          ts: '1710000000000',
          ttl: 0,
        },
      });

      expect(mapped).toMatchObject({
        isSelf: false,
        threadId: 'group-1',
        type: ENUM_ZALO_THREAD_TYPE.GROUP,
        userId: 'user-9',
        userName: 'An Nguyen',
        messageContent: 'Cho mình hỏi trạm gần nhất',
        quote: {
          uidFrom: 'user-9',
          msgId: 'msg-11',
          cliMsgId: 'cli-11',
          msgType: 'webchat',
          content: 'Cho mình hỏi trạm gần nhất',
        },
      });
      expect(mapped?.mentions).toBeUndefined();
    });

    it('maps group mentions from data.mentions', () => {
      const mapped = mapIncomingZaloMessage({
        isSelf: false,
        threadId: 'group-1',
        type: 1,
        data: {
          uidFrom: 'user-9',
          dName: 'An',
          content: '@Bot hỏi trạm',
          msgId: 'msg-12',
          mentions: [{ uid: 'bot-1', pos: 0, len: 4, type: 0 }],
        },
      });

      expect(mapped?.mentions).toEqual([{ uid: 'bot-1', pos: 0, len: 4 }]);
    });

    it('maps a direct message sender name from displayName fallback', () => {
      const mapped = mapIncomingZaloMessage({
        isSelf: false,
        threadId: 'user-2',
        type: 0,
        data: {
          uidFrom: 'user-2',
          displayName: 'Binh',
          content: 'hello',
          msgId: 'msg-2',
        },
      });

      expect(mapped?.type).toBe(ENUM_ZALO_THREAD_TYPE.USER);
      expect(mapped?.userName).toBe('Binh');
    });

    it('skips non-text content', () => {
      expect(
        mapIncomingZaloMessage({
          threadId: 'group-1',
          type: 1,
          data: { content: { href: 'https://x' }, uidFrom: '1' },
        }),
      ).toBeNull();
    });
  });

  describe('extractZaloSenderName', () => {
    it('prefers dName over other fields', () => {
      expect(
        extractZaloSenderName({
          dName: 'An',
          displayName: 'Other',
        }),
      ).toBe('An');
    });

    it('returns undefined for blank names', () => {
      expect(extractZaloSenderName({ dName: '   ' })).toBeUndefined();
    });
  });

  describe('extractZaloQuote', () => {
    it('returns undefined when msgId is missing', () => {
      expect(extractZaloQuote({ uidFrom: '1', content: 'hi' })).toBeUndefined();
    });
  });

  describe('buildGroupMentionReply', () => {
    it('prefixes @name and builds a mention span', () => {
      expect(
        buildGroupMentionReply({
          reply: 'Trạm gần bạn là A01.',
          senderName: 'An Nguyen',
          userId: 'user-9',
        }),
      ).toEqual({
        message: '@An Nguyen Trạm gần bạn là A01.',
        mentions: [{ pos: 0, uid: 'user-9', len: '@An Nguyen'.length }],
      });
    });

    it('keeps the original reply when sender name is missing', () => {
      expect(
        buildGroupMentionReply({
          reply: 'ok',
          userId: 'user-9',
        }),
      ).toEqual({ message: 'ok' });
    });
  });
});
