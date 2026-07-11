import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from 'src/common/redis/services/redis.service';
import {
  AUTH_DEV_OTP_CODE,
  AUTH_OTP_TTL_SECONDS,
  AUTH_REDIS_KEYS,
} from 'src/modules/auth/constants/auth.constant';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(private readonly redisService: RedisService) {}

  async requestOtp(phone: string): Promise<{ expiresIn: number }> {
    const code =
      process.env.NODE_ENV === 'production'
        ? String(Math.floor(100000 + Math.random() * 900000))
        : AUTH_DEV_OTP_CODE;

    await this.redisService.set(
      AUTH_REDIS_KEYS.otp(phone),
      { code, attempts: 0 },
      AUTH_OTP_TTL_SECONDS,
    );

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
}
