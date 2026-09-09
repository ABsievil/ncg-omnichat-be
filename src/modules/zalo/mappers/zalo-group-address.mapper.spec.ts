import {
  extractAccountProfileNames,
  isGroupBotAddressed,
  stripBotAddressFromContent,
} from 'src/modules/zalo/mappers/zalo-group-address.mapper';

describe('zalo-group-address.mapper', () => {
  const identity = {
    ownId: 'bot-1',
    names: ['SmartGo Bot', 'Cường Bot'],
  };

  describe('isGroupBotAddressed', () => {
    it('returns true when the mention uid is the bot account', () => {
      expect(
        isGroupBotAddressed({
          messageContent: 'cho hỏi trạm',
          mentions: [{ uid: 'bot-1', pos: 0, len: 4 }],
          identity,
        }),
      ).toBe(true);
    });

    it('returns true when the text contains the bot display name', () => {
      expect(
        isGroupBotAddressed({
          messageContent: 'SmartGo Bot ơi trạm nào gần nhất',
          identity,
        }),
      ).toBe(true);
    });

    it('returns true for @name with different case and diacritics', () => {
      expect(
        isGroupBotAddressed({
          messageContent: '@cuong bot giúp mình với',
          identity,
        }),
      ).toBe(true);
    });

    it('returns true when the text contains a short account name like Ncg', () => {
      expect(
        isGroupBotAddressed({
          messageContent: 'Ncg có đó k',
          identity: { ownId: 'bot-1', names: ['Ncg'] },
        }),
      ).toBe(true);
    });

    it('returns false for unrelated group chat', () => {
      expect(
        isGroupBotAddressed({
          messageContent: 'đi ăn không',
          mentions: [{ uid: 'someone-else', pos: 0, len: 3 }],
          identity,
        }),
      ).toBe(false);
    });

    it('returns false when identity is empty', () => {
      expect(
        isGroupBotAddressed({
          messageContent: '@bot hello',
          identity: { names: [] },
        }),
      ).toBe(false);
    });
  });

  describe('stripBotAddressFromContent', () => {
    it('strips a leading @name so the AI gets the actual question', () => {
      expect(
        stripBotAddressFromContent('@SmartGo Bot trạm nào gần nhất', [
          'SmartGo Bot',
        ]),
      ).toBe('trạm nào gần nhất');
    });

    it('keeps the original text when stripping would leave it empty', () => {
      expect(stripBotAddressFromContent('@SmartGo Bot', ['SmartGo Bot'])).toBe(
        '@SmartGo Bot',
      );
    });
  });

  describe('extractAccountProfileNames', () => {
    it('reads nested profile.displayName from fetchAccountInfo', () => {
      expect(
        extractAccountProfileNames({
          profile: {
            userId: 'bot-1',
            displayName: 'Ncg',
            zaloName: 'Ncg Zalo',
            username: 'ncg',
          },
        }),
      ).toEqual({
        userId: 'bot-1',
        displayName: 'Ncg',
        zaloName: 'Ncg Zalo',
        username: 'ncg',
      });
    });
  });
});
