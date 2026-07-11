import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContactRepository } from 'src/modules/contact/repositories/contact.repository';
import { ENUM_CONTACT_STATUS } from 'src/modules/contact/enums/contact.enum';
import { UserService } from 'src/modules/user/services/user.service';

@Injectable()
export class ContactService {
  constructor(
    private readonly contactRepository: ContactRepository,
    private readonly userService: UserService,
  ) {}

  async listFriends(userId: string) {
    const rows = await this.contactRepository.findAll({
      userId,
      status: ENUM_CONTACT_STATUS.ACCEPTED,
    });
    return Promise.all(
      rows.map(async row => {
        const user = await this.userService.findById(row.contactId);
        return {
          contactId: row._id,
          status: row.status,
          user: this.userService.toPublic(user),
        };
      }),
    );
  }

  async sendRequest(userId: string, contactUserId: string) {
    if (userId === contactUserId) {
      throw new BadRequestException('contact.error.self');
    }
    await this.userService.findById(contactUserId);

    const existing = await this.contactRepository.findOne({
      userId,
      contactId: contactUserId,
    });
    if (existing) {
      return existing;
    }

    return this.contactRepository.create({
      userId,
      contactId: contactUserId,
      status: ENUM_CONTACT_STATUS.PENDING,
      deleted: false,
    } as any);
  }

  async accept(userId: string, contactDocId: string) {
    const incoming = await this.contactRepository.findOneById(contactDocId);
    if (!incoming || incoming.contactId !== userId) {
      throw new NotFoundException('contact.error.notFound');
    }
    incoming.status = ENUM_CONTACT_STATUS.ACCEPTED;
    await this.contactRepository.save(incoming);

    const reverse = await this.contactRepository.findOne({
      userId,
      contactId: incoming.userId,
    });
    if (!reverse) {
      await this.contactRepository.create({
        userId,
        contactId: incoming.userId,
        status: ENUM_CONTACT_STATUS.ACCEPTED,
        deleted: false,
      } as any);
    } else {
      reverse.status = ENUM_CONTACT_STATUS.ACCEPTED;
      await this.contactRepository.save(reverse);
    }
    return { ok: true };
  }

  async reject(userId: string, contactDocId: string) {
    const incoming = await this.contactRepository.findOneById(contactDocId);
    if (!incoming || incoming.contactId !== userId) {
      throw new NotFoundException('contact.error.notFound');
    }
    incoming.status = ENUM_CONTACT_STATUS.REJECTED;
    await this.contactRepository.save(incoming);
    return { ok: true };
  }

  async block(userId: string, contactUserId: string) {
    let row = await this.contactRepository.findOne({
      userId,
      contactId: contactUserId,
    });
    if (!row) {
      row = await this.contactRepository.create({
        userId,
        contactId: contactUserId,
        status: ENUM_CONTACT_STATUS.BLOCKED,
        deleted: false,
      } as any);
    } else {
      row.status = ENUM_CONTACT_STATUS.BLOCKED;
      await this.contactRepository.save(row);
    }
    return { ok: true };
  }
}
