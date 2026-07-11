import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ConversationMemberRepository,
  ConversationRepository,
} from 'src/modules/conversation/repositories/conversation.repository';
import { ConversationEntity } from 'src/modules/conversation/entities/conversation.entity';
import {
  ENUM_CONVERSATION_TYPE,
  ENUM_MEMBER_ROLE,
} from 'src/modules/conversation/enums/conversation.enum';
import { UserService } from 'src/modules/user/services/user.service';

@Injectable()
export class ConversationService {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly memberRepository: ConversationMemberRepository,
    private readonly userService: UserService,
  ) {}

  private directKey(a: string, b: string) {
    return [a, b].sort().join(':');
  }

  async listForUser(userId: string) {
    const members = await this.memberRepository.findAll({ userId });
    const result: Array<{
      _id: string;
      type: ENUM_CONVERSATION_TYPE;
      name: string | null | undefined;
      avatarUrl: string | null | undefined;
      lastMessage: ConversationEntity['lastMessage'];
      lastMessageAt?: Date;
      unreadCount: number;
      isPinned: boolean;
      isMuted: boolean;
    }> = [];
    for (const member of members) {
      const conversation = await this.conversationRepository.findOneById(
        member.conversationId,
      );
      if (!conversation) continue;

      let title = conversation.name;
      let avatarUrl = conversation.avatarUrl;
      if (conversation.type === ENUM_CONVERSATION_TYPE.DIRECT) {
        const peerId = conversation.memberIds.find(id => id !== userId);
        if (peerId) {
          const peer = await this.userService.findById(peerId);
          title = peer.displayName;
          avatarUrl = peer.avatarUrl;
        }
      }

      result.push({
        _id: conversation._id,
        type: conversation.type,
        name: title,
        avatarUrl,
        lastMessage: conversation.lastMessage,
        lastMessageAt: conversation.lastMessageAt,
        unreadCount: member.unreadCount ?? 0,
        isPinned: member.isPinned ?? false,
        isMuted: member.isMuted ?? false,
      });
    }

    return result.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bt - at;
    });
  }

  async getOrCreateDirect(userId: string, peerUserId: string) {
    await this.userService.findById(peerUserId);
    const key = this.directKey(userId, peerUserId);
    let conversation = await this.conversationRepository.findOne({
      directKey: key,
    });
    if (conversation) {
      return conversation;
    }

    conversation = await this.conversationRepository.create({
      type: ENUM_CONVERSATION_TYPE.DIRECT,
      memberIds: [userId, peerUserId],
      directKey: key,
      name: null,
      avatarUrl: null,
      lastMessage: null,
      pinnedMessageIds: [],
      settings: {},
      deleted: false,
    } as any);

    const now = new Date();
    await this.memberRepository.createMany([
      {
        conversationId: conversation._id,
        userId,
        role: ENUM_MEMBER_ROLE.MEMBER,
        joinedAt: now,
        unreadCount: 0,
        deleted: false,
      },
      {
        conversationId: conversation._id,
        userId: peerUserId,
        role: ENUM_MEMBER_ROLE.MEMBER,
        joinedAt: now,
        unreadCount: 0,
        deleted: false,
      },
    ] as any);

    return conversation;
  }

  async createGroup(
    userId: string,
    name: string,
    memberIds: string[],
  ) {
    const uniqueMembers = Array.from(new Set([userId, ...memberIds]));
    const conversation = await this.conversationRepository.create({
      type: ENUM_CONVERSATION_TYPE.GROUP,
      memberIds: uniqueMembers,
      name,
      avatarUrl: null,
      lastMessage: null,
      pinnedMessageIds: [],
      settings: {
        onlyAdminCanSend: false,
        onlyAdminCanAddMembers: true,
      },
      deleted: false,
    } as any);

    const now = new Date();
    await this.memberRepository.createMany(
      uniqueMembers.map(id => ({
        conversationId: conversation._id,
        userId: id,
        role:
          id === userId ? ENUM_MEMBER_ROLE.ADMIN : ENUM_MEMBER_ROLE.MEMBER,
        joinedAt: now,
        unreadCount: 0,
        deleted: false,
      })) as any,
    );

    return conversation;
  }

  async assertMember(conversationId: string, userId: string) {
    const member = await this.memberRepository.findOne({
      conversationId,
      userId,
    });
    if (!member) {
      throw new ForbiddenException('conversation.error.notMember');
    }
    return member;
  }

  async findById(conversationId: string) {
    const conversation =
      await this.conversationRepository.findOneById(conversationId);
    if (!conversation) {
      throw new NotFoundException('conversation.error.notFound');
    }
    return conversation;
  }
}
