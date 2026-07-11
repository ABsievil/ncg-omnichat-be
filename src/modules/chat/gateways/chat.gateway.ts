import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { HelperEncryptionService } from 'src/common/helper/services/helper.encryption.service';
import { RedisService } from 'src/common/redis/services/redis.service';
import { AUTH_REDIS_KEYS } from 'src/modules/auth/constants/auth.constant';
import { IAuthTokenPayload } from 'src/modules/auth/interfaces/auth.user.interface';
import { AuthSessionService } from 'src/modules/auth/services/auth.session.service';
import { CHAT_WS_EVENTS } from 'src/modules/chat/constants/chat.ws.constant';
import { ChatService } from 'src/modules/chat/services/chat.service';
import { ENUM_MESSAGE_TYPE } from 'src/modules/chat/enums/chat.enum';

type AuthedSocket = Socket & {
  data: { userId?: string; sessionId?: string };
};

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly helperEncryptionService: HelperEncryptionService,
    private readonly configService: ConfigService,
    private readonly authSessionService: AuthSessionService,
    private readonly redisService: RedisService,
  ) {}

  async handleConnection(client: AuthedSocket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.headers.authorization as string)?.replace(
          'Bearer ',
          '',
        );
      if (!token) {
        client.disconnect(true);
        return;
      }

      const secret =
        this.configService.get<string>('helper.jwt.defaultSecretKey') ??
        'omnichat-default-secret';
      const valid = this.helperEncryptionService.jwtVerify(token, {
        secretKey: secret,
        audience: 'omnichat',
        issuer: 'omnichat',
        subject: 'access',
        ignoreExpiration: false,
      });
      if (!valid) {
        client.disconnect(true);
        return;
      }

      const payload =
        this.helperEncryptionService.jwtDecrypt<IAuthTokenPayload>(token);
      if (!payload?.sub || payload.typ !== 'access') {
        client.disconnect(true);
        return;
      }

      const session = await this.authSessionService.getSession(
        payload.sub,
        payload.sid,
      );
      if (!session) {
        client.disconnect(true);
        return;
      }

      client.data.userId = payload.sub;
      client.data.sessionId = payload.sid;
      await client.join(`user:${payload.sub}`);
      await this.redisService.set(AUTH_REDIS_KEYS.presence(payload.sub), {
        status: 'online',
        lastActiveAt: new Date().toISOString(),
      });
      await this.redisService.set(
        AUTH_REDIS_KEYS.socketUser(client.id),
        payload.sub,
      );

      this.server.emit(CHAT_WS_EVENTS.PRESENCE_UPDATE, {
        userId: payload.sub,
        status: 'online',
        lastActiveAt: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(error);
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: AuthedSocket) {
    const userId = client.data.userId;
    if (!userId) return;
    await this.redisService.del(AUTH_REDIS_KEYS.socketUser(client.id));
    await this.redisService.set(AUTH_REDIS_KEYS.presence(userId), {
      status: 'offline',
      lastActiveAt: new Date().toISOString(),
    });
    this.server.emit(CHAT_WS_EVENTS.PRESENCE_UPDATE, {
      userId,
      status: 'offline',
      lastActiveAt: new Date().toISOString(),
    });
  }

  @SubscribeMessage(CHAT_WS_EVENTS.JOIN_CONVERSATION)
  async joinConversation(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { conversationId: string },
  ) {
    const userId = client.data.userId!;
    await this.chatService.assertMember(body.conversationId, userId);
    await client.join(`conversation:${body.conversationId}`);
    return { ok: true };
  }

  @SubscribeMessage(CHAT_WS_EVENTS.LEAVE_CONVERSATION)
  async leaveConversation(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { conversationId: string },
  ) {
    await client.leave(`conversation:${body.conversationId}`);
    return { ok: true };
  }

  @SubscribeMessage(CHAT_WS_EVENTS.MESSAGE_SEND)
  async onSend(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody()
    body: {
      conversationId: string;
      type?: ENUM_MESSAGE_TYPE;
      content?: string;
      mediaUrl?: string;
      replyToMessageId?: string;
      clientMsgId?: string;
    },
  ) {
    const userId = client.data.userId!;
    const message = await this.chatService.sendMessage({
      conversationId: body.conversationId,
      senderId: userId,
      type: body.type,
      content: body.content,
      mediaUrl: body.mediaUrl,
      replyToMessageId: body.replyToMessageId,
      clientMsgId: body.clientMsgId,
    });

    const payload = {
      _id: message._id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      type: message.type,
      content: message.content,
      mediaUrl: message.mediaUrl,
      replyToMessageId: message.replyToMessageId,
      status: message.status,
      clientMsgId: message.clientMsgId,
      createdAt: (message as any).createdAt,
    };

    this.server
      .to(`conversation:${body.conversationId}`)
      .emit(CHAT_WS_EVENTS.MESSAGE_NEW, payload);

    this.server
      .to(`conversation:${body.conversationId}`)
      .emit(CHAT_WS_EVENTS.CONVERSATION_UPDATED, {
        conversationId: body.conversationId,
        lastMessage: {
          messageId: message._id,
          type: message.type,
          content: message.content,
          senderId: message.senderId,
          createdAt: (message as any).createdAt,
        },
      });

    return payload;
  }

  @SubscribeMessage(CHAT_WS_EVENTS.MESSAGE_SEEN)
  async onSeen(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody()
    body: { conversationId: string; lastReadMessageId: string },
  ) {
    const userId = client.data.userId!;
    const result = await this.chatService.markSeen(
      body.conversationId,
      userId,
      body.lastReadMessageId,
    );
    this.server
      .to(`conversation:${body.conversationId}`)
      .emit(CHAT_WS_EVENTS.MESSAGE_SEEN, result);
    return result;
  }

  @SubscribeMessage(CHAT_WS_EVENTS.TYPING_START)
  async onTypingStart(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { conversationId: string },
  ) {
    client.to(`conversation:${body.conversationId}`).emit(
      CHAT_WS_EVENTS.TYPING_START,
      { conversationId: body.conversationId, userId: client.data.userId },
    );
  }

  @SubscribeMessage(CHAT_WS_EVENTS.TYPING_STOP)
  async onTypingStop(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { conversationId: string },
  ) {
    client.to(`conversation:${body.conversationId}`).emit(
      CHAT_WS_EVENTS.TYPING_STOP,
      { conversationId: body.conversationId, userId: client.data.userId },
    );
  }

  @SubscribeMessage(CHAT_WS_EVENTS.SYNC_PULL)
  async onSync(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { lastSyncAt: string },
  ) {
    const userId = client.data.userId!;
    const data = await this.chatService.syncSince(
      userId,
      new Date(body.lastSyncAt),
    );
    return { event: CHAT_WS_EVENTS.SYNC_PUSH, data };
  }
}
