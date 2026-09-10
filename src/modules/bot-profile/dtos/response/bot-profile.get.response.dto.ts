import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DatabaseDto } from 'src/common/database/dtos/database.dto';
import { ENUM_BOT_PROFILE_TONE } from 'src/modules/bot-profile/enums/bot-profile.enum';
import type { IBotWorkingHours } from 'src/modules/bot-profile/interfaces/bot-profile.interface';

export class BotProfileGetResponseDto extends DatabaseDto {
  @ApiProperty()
  shopId!: string;

  @ApiProperty()
  botName!: string;

  @ApiProperty({ enum: ENUM_BOT_PROFILE_TONE })
  tone!: ENUM_BOT_PROFILE_TONE;

  @ApiProperty()
  systemPromptExtra!: string;

  @ApiProperty()
  fallbackMessage!: string;

  @ApiProperty()
  workingHours!: IBotWorkingHours;

  @ApiProperty()
  replyToStrangers!: boolean;

  @ApiProperty()
  pauseMinutes!: number;

  @ApiProperty()
  enabled!: boolean;

  @ApiProperty({ type: [String] })
  mutedThreadIds!: string[];

  @ApiProperty()
  showAiLabel!: boolean;

  @ApiPropertyOptional()
  zaloRiskAcceptedAt?: Date | null;
}
