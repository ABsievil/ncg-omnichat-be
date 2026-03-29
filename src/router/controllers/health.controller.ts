import { Controller, Get } from '@nestjs/common';

@Controller({ path: 'health', version: '1' })
export class HealthController {
  @Get()
  ping(): { ok: boolean } {
    return { ok: true };
  }
}
