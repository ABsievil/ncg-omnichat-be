import { ApiProperty } from '@nestjs/swagger';
import { ResponseDataBaseDto } from 'src/common/response/dtos/response.data.base.dto';
import { BotProfileGetResponseDto } from 'src/modules/bot-profile/dtos/response/bot-profile.get.response.dto';

export class BotProfileGetResponseDataDto extends ResponseDataBaseDto {
  @ApiProperty({ type: BotProfileGetResponseDto })
  botProfile!: BotProfileGetResponseDto;
}
