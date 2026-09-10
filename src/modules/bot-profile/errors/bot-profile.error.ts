import { Injectable, NotFoundException } from '@nestjs/common';
import { ENUM_BOT_PROFILE_STATUS_CODE } from 'src/modules/bot-profile/enums/bot-profile.status-code.enum';
import { IBotWorkingHours } from 'src/modules/bot-profile/interfaces/bot-profile.interface';

@Injectable()
export class BotProfileError {
  throwNotFound(): never {
    throw new NotFoundException({
      statusCode: ENUM_BOT_PROFILE_STATUS_CODE.NOT_FOUND,
      message: 'botProfile.error.notFound',
    });
  }

  static parseHmToMinutes(value: string): number | null {
    const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
    if (!match) {
      return null;
    }
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours === 24 && minutes === 0) {
      return 24 * 60;
    }
    if (hours > 23 || minutes > 59) {
      return null;
    }
    return hours * 60 + minutes;
  }

  static minutesInTimezone(now: Date, timezone: string): number {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone || 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
    const hour = Number(parts.find(part => part.type === 'hour')?.value ?? 0);
    const minute = Number(
      parts.find(part => part.type === 'minute')?.value ?? 0,
    );
    return hour * 60 + minute;
  }

  static isWithinWorkingHours(
    hours: IBotWorkingHours | undefined,
    now: Date = new Date(),
  ): boolean {
    if (!hours?.enabled) {
      return true;
    }
    const start = BotProfileError.parseHmToMinutes(hours.start);
    const end = BotProfileError.parseHmToMinutes(hours.end);
    if (start === null || end === null) {
      return true;
    }
    const current = BotProfileError.minutesInTimezone(
      now,
      hours.timezone || 'Asia/Ho_Chi_Minh',
    );
    if (start === end) {
      return true;
    }
    if (start < end) {
      return current >= start && current < end;
    }
    return current >= start || current < end;
  }
}
