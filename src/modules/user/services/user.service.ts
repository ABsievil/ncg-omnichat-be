import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from 'src/modules/user/repositories/user.repository';
import { UpdateProfileDto } from 'src/modules/user/dtos/user.update-profile.dto';
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
    dto: UpdateProfileDto,
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

  toPublic(user: UserDoc) {
    return {
      _id: user._id,
      phone: user.phone,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl ?? null,
      coverUrl: user.coverUrl ?? null,
      bio: user.bio ?? '',
      gender: user.gender,
      dob: user.dob ?? null,
      statusText: user.statusText ?? '',
      lastActiveAt: user.lastActiveAt ?? null,
      createdAt: user.createdAt,
    };
  }
}
