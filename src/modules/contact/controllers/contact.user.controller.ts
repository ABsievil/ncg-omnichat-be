import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsNotEmpty, IsString } from 'class-validator';
import { AuthUser } from 'src/modules/auth/decorators/auth.user.decorator';
import type { IAuthUser } from 'src/modules/auth/interfaces/auth.user.interface';
import { ContactService } from 'src/modules/contact/services/contact.service';

class ContactRequestDto {
  @IsString()
  @IsNotEmpty()
  contactId: string;
}

@Controller({ path: 'contacts', version: '1' })
export class ContactUserController {
  constructor(private readonly contactService: ContactService) {}

  @Get()
  list(@AuthUser() user: IAuthUser) {
    return this.contactService.listFriends(user.userId);
  }

  @Post('request')
  request(@AuthUser() user: IAuthUser, @Body() dto: ContactRequestDto) {
    return this.contactService.sendRequest(user.userId, dto.contactId);
  }

  @Post(':id/accept')
  accept(@AuthUser() user: IAuthUser, @Param('id') id: string) {
    return this.contactService.accept(user.userId, id);
  }

  @Post(':id/reject')
  reject(@AuthUser() user: IAuthUser, @Param('id') id: string) {
    return this.contactService.reject(user.userId, id);
  }

  @Post(':id/block')
  block(@AuthUser() user: IAuthUser, @Param('id') id: string) {
    return this.contactService.block(user.userId, id);
  }
}
