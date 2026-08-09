import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from 'src/modules/user/repositories/user.repository';
import { UserUpdateRequestDto } from 'src/modules/user/dtos/request/user.update.request.dto';
import { UserGetResponseDto } from 'src/modules/user/dtos/response/user.get.response.dto';
import { UserGetResponseDataDto } from 'src/modules/user/dtos/response/user.get.response.data.dto';
import { UserDoc } from 'src/modules/user/entities/user.entity';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findById(userId: string): Promise<UserDoc> {
    const user = await this.userRepository.findOneById(userId);
    if (!user) {
      throw new NotFoundException('user.error.notFound');
    }
    return user;
  }

  async findByPhone(phone: string): Promise<UserDoc | null> {
    return this.userRepository.findOne({ phone });
  }

  async updateProfile(
    userId: string,
    dto: UserUpdateRequestDto,
  ): Promise<UserDoc> {
    const user = await this.findById(userId);
    Object.assign(user, {
      ...(dto.displayName !== undefined && { displayName: dto.displayName }),
      ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      ...(dto.coverUrl !== undefined && { coverUrl: dto.coverUrl }),
      ...(dto.bio !== undefined && { bio: dto.bio }),
      ...(dto.gender !== undefined && { gender: dto.gender }),
      ...(dto.dob !== undefined && { dob: dto.dob ? new Date(dto.dob) : null }),
      ...(dto.statusText !== undefined && { statusText: dto.statusText }),
    });
    return this.userRepository.save(user);
  }

  mapGet(user: UserDoc): UserGetResponseDto {
    return {
      _id: String(user._id),
      createdAt: user.createdAt as Date,
      updatedAt: (user.updatedAt as Date) ?? (user.createdAt as Date),
      createdBy: user.createdBy,
      updatedBy: user.updatedBy,
      deleted: !!user.deleted,
      deletedAt: user.deletedAt,
      deletedBy: user.deletedBy,
      phone: user.phone,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl ?? null,
      coverUrl: user.coverUrl ?? null,
      bio: user.bio ?? '',
      gender: user.gender,
      dob: user.dob ?? null,
      statusText: user.statusText ?? '',
      lastActiveAt: user.lastActiveAt ?? null,
    };
  }

  mapGetData(user: UserDoc): UserGetResponseDataDto {
    return {
      user: this.mapGet(user),
      createdBy: [],
      updatedBy: [],
    };
  }
}
