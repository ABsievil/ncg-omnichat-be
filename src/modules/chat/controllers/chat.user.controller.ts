import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { AuthUser } from 'src/modules/auth/decorators/auth.user.decorator';
import type { IAuthUser } from 'src/modules/auth/interfaces/auth.user.interface';
import { ChatService } from 'src/modules/chat/services/chat.service';
import { ENUM_MESSAGE_TYPE } from 'src/modules/chat/enums/chat.enum';

class SendMessageDto {
  @IsOptional()
  @IsEnum(ENUM_MESSAGE_TYPE)
  type?: ENUM_MESSAGE_TYPE;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsString()
  replyToMessageId?: string;

  @IsOptional()
  @IsString()
  clientMsgId?: string;
}

class MarkReadDto {
  @IsString()
  @IsNotEmpty()
  lastReadMessageId: string;
}

@Controller({ path: 'conversations', version: '1' })
export class ChatUserController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':id/messages')
  listMessages(
    @AuthUser() user: IAuthUser,
    @Param('id') conversationId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.listMessages(conversationId, user.userId, {
      cursor,
      limit: limit ? Number(limit) : 30,
    });
  }

  @Post(':id/messages')
  sendMessage(
    @AuthUser() user: IAuthUser,
    @Param('id') conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage({
      conversationId,
      senderId: user.userId,
      ...dto,
    });
  }

  @Post(':id/read')
  markRead(
    @AuthUser() user: IAuthUser,
    @Param('id') conversationId: string,
    @Body() dto: MarkReadDto,
  ) {
    return this.chatService.markSeen(
      conversationId,
      user.userId,
      dto.lastReadMessageId,
    );
  }
}
