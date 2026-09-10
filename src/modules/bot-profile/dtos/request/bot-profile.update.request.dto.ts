import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ENUM_BOT_PROFILE_TONE } from 'src/modules/bot-profile/enums/bot-profile.enum';

export class BotProfileWorkingHoursRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ example: 'Asia/Ho_Chi_Minh' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @ApiPropertyOptional({ example: '08:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$|^24:00$/)
  start?: string;

  @ApiPropertyOptional({ example: '22:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$|^24:00$/)
  end?: string;
}

export class BotProfileUpdateRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  botName?: string;

  @ApiPropertyOptional({ enum: ENUM_BOT_PROFILE_TONE })
  @IsOptional()
  @IsEnum(ENUM_BOT_PROFILE_TONE)
  tone?: ENUM_BOT_PROFILE_TONE;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  systemPromptExtra?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  fallbackMessage?: string;

  @ApiPropertyOptional({ type: BotProfileWorkingHoursRequestDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BotProfileWorkingHoursRequestDto)
  workingHours?: BotProfileWorkingHoursRequestDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  replyToStrangers?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(180)
  pauseMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsString({ each: true })
  mutedThreadIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showAiLabel?: boolean;
}
