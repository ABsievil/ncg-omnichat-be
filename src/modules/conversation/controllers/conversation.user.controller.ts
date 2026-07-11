import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { AuthUser } from 'src/modules/auth/decorators/auth.user.decorator';
import type { IAuthUser } from 'src/modules/auth/interfaces/auth.user.interface';
import { ConversationService } from 'src/modules/conversation/services/conversation.service';

class CreateDirectDto {
  @IsString()
  @IsNotEmpty()
  peerUserId: string;
}

class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  memberIds: string[];
}

@Controller({ path: 'conversations', version: '1' })
export class ConversationUserController {
  constructor(private readonly conversationService: ConversationService) {}

  @Get()
  list(@AuthUser() user: IAuthUser) {
    return this.conversationService.listForUser(user.userId);
  }

  @Post('direct')
  createDirect(@AuthUser() user: IAuthUser, @Body() dto: CreateDirectDto) {
    return this.conversationService.getOrCreateDirect(
      user.userId,
      dto.peerUserId,
    );
  }

  @Post('group')
  createGroup(@AuthUser() user: IAuthUser, @Body() dto: CreateGroupDto) {
    return this.conversationService.createGroup(
      user.userId,
      dto.name,
      dto.memberIds,
    );
  }
}
