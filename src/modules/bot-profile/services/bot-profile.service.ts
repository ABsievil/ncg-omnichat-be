import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/common/redis/services/redis.service';
import {
  BOT_PROFILE_CACHE_TTL_SECONDS,
  BOT_PROFILE_DEFAULT_FALLBACK,
  BOT_PROFILE_DEFAULT_PAUSE_MINUTES,
  BOT_PROFILE_DEFAULT_WORKING_HOURS,
  botProfileCacheKey,
  buildDefaultBotProfile,
} from 'src/modules/bot-profile/constants/bot-profile.constant';
import { BotProfileUpdateRequestDto } from 'src/modules/bot-profile/dtos/request/bot-profile.update.request.dto';
import { BotProfileGetResponseDto } from 'src/modules/bot-profile/dtos/response/bot-profile.get.response.dto';
import {
  BotProfileDoc,
  BotProfileEntity,
} from 'src/modules/bot-profile/entities/bot-profile.entity';
import { ENUM_BOT_PROFILE_TONE } from 'src/modules/bot-profile/enums/bot-profile.enum';
import { IBotProfileSnapshot } from 'src/modules/bot-profile/interfaces/bot-profile.interface';
import { BotProfileRepository } from 'src/modules/bot-profile/repositories/bot-profile.repository';

@Injectable()
export class BotProfileService {
  constructor(
    private readonly botProfileRepository: BotProfileRepository,
    private readonly redisService: RedisService,
  ) {}

  async getOrCreate(
    shopId: string,
    botName?: string,
  ): Promise<IBotProfileSnapshot> {
    const cached = await this.redisService.get<IBotProfileSnapshot>(
      botProfileCacheKey(shopId),
    );
    if (cached?.shopId === shopId) {
      return cached;
    }

    let doc = await this.botProfileRepository.findOne({ shopId });
    if (!doc) {
      const entity = Object.assign(
        new BotProfileEntity(),
        this.toEntity(
          buildDefaultBotProfile(shopId, botName ?? 'Trợ lý shop'),
        ),
      );
      doc = await this.botProfileRepository.create(entity);
    }

    const snapshot = this.toSnapshot(doc);
    await this.cacheSnapshot(snapshot);
    return snapshot;
  }

  async ensure(shopId: string, botName?: string): Promise<IBotProfileSnapshot> {
    return this.getOrCreate(shopId, botName);
  }

  async update(
    shopId: string,
    dto: BotProfileUpdateRequestDto,
  ): Promise<IBotProfileSnapshot> {
    const current = await this.getOrCreate(shopId);
    const doc = await this.botProfileRepository.findOne({ shopId });
    if (!doc) {
      const created = await this.botProfileRepository.create(
        Object.assign(
          new BotProfileEntity(),
          this.toEntity(this.applyUpdate(current, dto)),
        ),
      );
      const snapshot = this.toSnapshot(created);
      await this.cacheSnapshot(snapshot);
      return snapshot;
    }

    const next = this.applyUpdate(this.toSnapshot(doc), dto);
    doc.botName = next.botName;
    doc.tone = next.tone;
    doc.systemPromptExtra = next.systemPromptExtra;
    doc.fallbackMessage = next.fallbackMessage;
    doc.workingHours = next.workingHours;
    doc.replyToStrangers = next.replyToStrangers;
    doc.pauseMinutes = next.pauseMinutes;
    doc.enabled = next.enabled;
    doc.mutedThreadIds = next.mutedThreadIds;
    doc.showAiLabel = next.showAiLabel;
    await this.botProfileRepository.save(doc);
    const snapshot = this.toSnapshot(doc);
    await this.cacheSnapshot(snapshot);
    return snapshot;
  }

  async acceptZaloRisk(shopId: string): Promise<IBotProfileSnapshot> {
    const docShop = await this.getOrCreate(shopId);
    const doc = await this.botProfileRepository.findOne({ shopId });
    if (!doc) {
      return { ...docShop, zaloRiskAcceptedAt: new Date().toISOString() };
    }
    doc.zaloRiskAcceptedAt = new Date();
    await this.botProfileRepository.save(doc);
    const snapshot = this.toSnapshot(doc);
    await this.cacheSnapshot(snapshot);
    return snapshot;
  }

  hasAcceptedZaloRisk(profile: IBotProfileSnapshot): boolean {
    return !!profile.zaloRiskAcceptedAt;
  }

  mapGet(snapshot: IBotProfileSnapshot): BotProfileGetResponseDto {
    return {
      _id: snapshot.shopId,
      createdAt: new Date(0),
      updatedAt: new Date(0),
      deleted: false,
      shopId: snapshot.shopId,
      botName: snapshot.botName,
      tone: snapshot.tone,
      systemPromptExtra: snapshot.systemPromptExtra,
      fallbackMessage: snapshot.fallbackMessage,
      workingHours: snapshot.workingHours,
      replyToStrangers: snapshot.replyToStrangers,
      pauseMinutes: snapshot.pauseMinutes,
      enabled: snapshot.enabled,
      mutedThreadIds: snapshot.mutedThreadIds,
      showAiLabel: snapshot.showAiLabel,
      zaloRiskAcceptedAt: snapshot.zaloRiskAcceptedAt
        ? new Date(snapshot.zaloRiskAcceptedAt)
        : null,
    };
  }

  mapGetFromDoc(doc: BotProfileDoc): BotProfileGetResponseDto {
    const snapshot = this.toSnapshot(doc);
    return {
      ...this.mapGet(snapshot),
      _id: String(doc._id),
      createdAt: doc.createdAt as Date,
      updatedAt: (doc.updatedAt as Date) ?? (doc.createdAt as Date),
      createdBy: doc.createdBy,
      updatedBy: doc.updatedBy,
      deleted: !!doc.deleted,
    };
  }

  mapGetData(snapshot: IBotProfileSnapshot, doc?: BotProfileDoc | null) {
    return {
      botProfile: doc ? this.mapGetFromDoc(doc) : this.mapGet(snapshot),
      createdBy: [] as [],
      updatedBy: [] as [],
    };
  }

  toSnapshot(doc: BotProfileDoc | BotProfileEntity): IBotProfileSnapshot {
    return {
      shopId: doc.shopId,
      botName: doc.botName,
      tone: doc.tone ?? ENUM_BOT_PROFILE_TONE.FRIENDLY,
      systemPromptExtra: doc.systemPromptExtra ?? '',
      fallbackMessage: doc.fallbackMessage || BOT_PROFILE_DEFAULT_FALLBACK,
      workingHours: {
        enabled: !!doc.workingHours?.enabled,
        timezone:
          doc.workingHours?.timezone ||
          BOT_PROFILE_DEFAULT_WORKING_HOURS.timezone,
        start: doc.workingHours?.start || BOT_PROFILE_DEFAULT_WORKING_HOURS.start,
        end: doc.workingHours?.end || BOT_PROFILE_DEFAULT_WORKING_HOURS.end,
      },
      replyToStrangers: doc.replyToStrangers !== false,
      pauseMinutes: doc.pauseMinutes || BOT_PROFILE_DEFAULT_PAUSE_MINUTES,
      enabled: doc.enabled !== false,
      mutedThreadIds: Array.isArray(doc.mutedThreadIds)
        ? doc.mutedThreadIds
        : [],
      showAiLabel: !!doc.showAiLabel,
      zaloRiskAcceptedAt: doc.zaloRiskAcceptedAt
        ? new Date(doc.zaloRiskAcceptedAt).toISOString()
        : null,
    };
  }

  private applyUpdate(
    current: IBotProfileSnapshot,
    dto: BotProfileUpdateRequestDto,
  ): IBotProfileSnapshot {
    return {
      ...current,
      botName: dto.botName?.trim() || current.botName,
      tone: dto.tone ?? current.tone,
      systemPromptExtra:
        dto.systemPromptExtra !== undefined
          ? dto.systemPromptExtra
          : current.systemPromptExtra,
      fallbackMessage: dto.fallbackMessage?.trim() || current.fallbackMessage,
      workingHours: {
        ...current.workingHours,
        ...(dto.workingHours ?? {}),
      },
      replyToStrangers:
        dto.replyToStrangers !== undefined
          ? dto.replyToStrangers
          : current.replyToStrangers,
      pauseMinutes: dto.pauseMinutes ?? current.pauseMinutes,
      enabled: dto.enabled !== undefined ? dto.enabled : current.enabled,
      mutedThreadIds:
        dto.mutedThreadIds !== undefined
          ? dto.mutedThreadIds
          : current.mutedThreadIds,
      showAiLabel:
        dto.showAiLabel !== undefined ? dto.showAiLabel : current.showAiLabel,
    };
  }

  private toEntity(snapshot: IBotProfileSnapshot): Partial<BotProfileEntity> {
    return {
      shopId: snapshot.shopId,
      botName: snapshot.botName,
      tone: snapshot.tone,
      systemPromptExtra: snapshot.systemPromptExtra,
      fallbackMessage: snapshot.fallbackMessage,
      workingHours: snapshot.workingHours,
      replyToStrangers: snapshot.replyToStrangers,
      pauseMinutes: snapshot.pauseMinutes,
      enabled: snapshot.enabled,
      mutedThreadIds: snapshot.mutedThreadIds,
      showAiLabel: snapshot.showAiLabel,
      zaloRiskAcceptedAt: snapshot.zaloRiskAcceptedAt
        ? new Date(snapshot.zaloRiskAcceptedAt)
        : null,
    };
  }

  private async cacheSnapshot(snapshot: IBotProfileSnapshot): Promise<void> {
    await this.redisService.set(
      botProfileCacheKey(snapshot.shopId),
      snapshot,
      BOT_PROFILE_CACHE_TTL_SECONDS,
    );
  }
}
