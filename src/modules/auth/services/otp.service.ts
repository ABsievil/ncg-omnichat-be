import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from 'src/common/redis/services/redis.service';
import {
  AUTH_DEV_OTP_CODE,
  AUTH_OTP_DAILY_LIMIT,
  AUTH_OTP_DAILY_TTL_SECONDS,
  AUTH_OTP_TTL_SECONDS,
  AUTH_REDIS_KEYS,
} from 'src/modules/auth/constants/auth.constant';
import { AuthError } from 'src/modules/auth/errors/auth.error';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(private readonly redisService: RedisService) {}

  async requestOtp(phone: string): Promise<{ expiresIn: number }> {
    await this.assertDailyLimit(phone);

    const code =
      process.env.NODE_ENV === 'production'
        ? String(Math.floor(100000 + Math.random() * 900000))
        : AUTH_DEV_OTP_CODE;

    await this.redisService.set(
      AUTH_REDIS_KEYS.otp(phone),
      { code, attempts: 0 },
      AUTH_OTP_TTL_SECONDS,
    );
    await this.incrementDailyCount(phone);

    // Mock SMS provider — replace with Twilio/etc later
    this.logger.log(`[MockOTP] phone=${phone} code=${code}`);

    return { expiresIn: AUTH_OTP_TTL_SECONDS };
  }

  async verifyOtp(phone: string, otp: string): Promise<boolean> {
    const stored = await this.redisService.get<{
      code: string;
      attempts: number;
    }>(AUTH_REDIS_KEYS.otp(phone));

    if (!stored) {
      return false;
    }

    if (stored.attempts >= 5) {
      await this.redisService.del(AUTH_REDIS_KEYS.otp(phone));
      return false;
    }

    if (stored.code !== otp) {
      await this.redisService.set(
        AUTH_REDIS_KEYS.otp(phone),
        { ...stored, attempts: stored.attempts + 1 },
        AUTH_OTP_TTL_SECONDS,
      );
      return false;
    }

    await this.redisService.del(AUTH_REDIS_KEYS.otp(phone));
    return true;
  }

  private async assertDailyLimit(phone: string): Promise<void> {
    const count = await this.readDailyCount(phone);
    if (count >= AUTH_OTP_DAILY_LIMIT) {
      AuthError.throwOtpDailyLimit();
    }
  }

  private async incrementDailyCount(phone: string): Promise<void> {
    const key = AUTH_REDIS_KEYS.otpDaily(phone);
    const count = await this.readDailyCount(phone);
    const ttl = await this.redisService.ttl(key);
    await this.redisService.set(
      key,
      count + 1,
      ttl > 0 ? ttl : AUTH_OTP_DAILY_TTL_SECONDS,
    );
  }

  private async readDailyCount(phone: string): Promise<number> {
    const stored = await this.redisService.get<number>(
      AUTH_REDIS_KEYS.otpDaily(phone),
    );
    if (typeof stored === 'number' && Number.isFinite(stored)) {
      return stored;
    }
    const parsed = Number(stored);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
