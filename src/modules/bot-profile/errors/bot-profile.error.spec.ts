import { BotProfileError } from 'src/modules/bot-profile/errors/bot-profile.error';
import { IBotWorkingHours } from 'src/modules/bot-profile/interfaces/bot-profile.interface';

describe('BotProfileError.isWithinWorkingHours', () => {
  const hours = (overrides: Partial<IBotWorkingHours> = {}): IBotWorkingHours => ({
    enabled: true,
    timezone: 'Asia/Ho_Chi_Minh',
    start: '08:00',
    end: '22:00',
    ...overrides,
  });

  it('is always on when working hours are disabled', () => {
    const now = new Date('2026-09-09T16:00:00.000Z'); // 23:00 VN
    expect(
      BotProfileError.isWithinWorkingHours(
        hours({ enabled: false, start: '08:00', end: '09:00' }),
        now,
      ),
    ).toBe(true);
    expect(BotProfileError.isWithinWorkingHours(undefined, now)).toBe(true);
  });

  it('is inside a same-day window', () => {
    const inside = new Date('2026-09-09T04:00:00.000Z'); // 11:00 VN
    const outside = new Date('2026-09-09T16:00:00.000Z'); // 23:00 VN
    expect(BotProfileError.isWithinWorkingHours(hours(), inside)).toBe(true);
    expect(BotProfileError.isWithinWorkingHours(hours(), outside)).toBe(false);
  });

  it('wraps overnight windows', () => {
    const overnight = hours({ start: '22:00', end: '06:00' });
    const late = new Date('2026-09-09T16:00:00.000Z'); // 23:00 VN
    const early = new Date('2026-09-08T20:00:00.000Z'); // 03:00 VN
    const midday = new Date('2026-09-09T04:00:00.000Z'); // 11:00 VN
    expect(BotProfileError.isWithinWorkingHours(overnight, late)).toBe(true);
    expect(BotProfileError.isWithinWorkingHours(overnight, early)).toBe(true);
    expect(BotProfileError.isWithinWorkingHours(overnight, midday)).toBe(false);
  });
});
