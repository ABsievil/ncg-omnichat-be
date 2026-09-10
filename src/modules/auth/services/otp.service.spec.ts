import { BadRequestException } from '@nestjs/common';
import {
  AUTH_OTP_DAILY_LIMIT,
  AUTH_REDIS_KEYS,
} from 'src/modules/auth/constants/auth.constant';
import { OtpService } from 'src/modules/auth/services/otp.service';

describe('OtpService', () => {
  const redis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    ttl: jest.fn(),
  };
  const service = new OtpService(redis as never);

  beforeEach(() => {
    jest.clearAllMocks();
    redis.ttl.mockResolvedValue(-1);
    redis.get.mockResolvedValue(null);
  });

  it('stores otp and increments daily counter', async () => {
    await service.requestOtp('+84900000000');
    expect(redis.set).toHaveBeenCalledWith(
      AUTH_REDIS_KEYS.otp('+84900000000'),
      expect.objectContaining({ attempts: 0 }),
      expect.any(Number),
    );
    expect(redis.set).toHaveBeenCalledWith(
      AUTH_REDIS_KEYS.otpDaily('+84900000000'),
      1,
      expect.any(Number),
    );
  });

  it('rejects when daily limit is reached', async () => {
    redis.get.mockResolvedValue(AUTH_OTP_DAILY_LIMIT);
    await expect(service.requestOtp('+84900000000')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
