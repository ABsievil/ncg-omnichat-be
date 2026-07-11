import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from 'src/modules/auth/decorators/auth.public.decorator';

@Public()
@SkipThrottle()
@Controller({ path: 'health', version: '1' })
export class HealthController {
  @Get()
  ping(): { ok: boolean } {
    return { ok: true };
  }
}
