import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { toNumber } from '@/common/utils/bigint.util';
import { RenamePetDto } from './dto/rename-pet.dto';

const RENAME_COOLDOWN_DAYS = 7;
const PET_NICKNAME_MAX_CHARS = 4;
const NICKNAME_PATTERN = /^[\u4e00-\u9fa5a-zA-Z0-9_\- ·.]+$/;

@Injectable()
export class StudentPetsService {
  constructor(private readonly prisma: PrismaService) {}

  async rename(studentPetId: number, dto: RenamePetDto) {
    const nickname = dto.nickname.trim();
    const nicknameLength = Array.from(nickname).length;
    if (nicknameLength < 1 || nicknameLength > PET_NICKNAME_MAX_CHARS) {
      throw new BadRequestException(`昵称长度需在1-${PET_NICKNAME_MAX_CHARS}个字符之间`);
    }
    if (!NICKNAME_PATTERN.test(nickname)) {
      throw new BadRequestException('昵称包含不允许的字符，仅支持中英文、数字、空格和常见符号');
    }

    const studentPet = await this.prisma.studentPet.findUnique({
      where: { id: BigInt(studentPetId) },
    });
    if (!studentPet) throw new NotFoundException('宠物不存在');

    if (studentPet.lastRenameAt) {
      const cooldownMs = RENAME_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
      const nextAllowedAt = new Date(studentPet.lastRenameAt.getTime() + cooldownMs);
      if (new Date() < nextAllowedAt) {
        const daysLeft = Math.ceil((nextAllowedAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
        throw new BadRequestException(`改名冷却中，${daysLeft}天后可再次修改`);
      }
    }

    const updated = await this.prisma.studentPet.update({
      where: { id: BigInt(studentPetId) },
      data: {
        nickname,
        lastRenameAt: new Date(),
      },
    });

    return {
      code: 0,
      message: 'ok',
      data: {
        studentPetId: toNumber(updated.id),
        nickname: updated.nickname,
        lastRenameAt: updated.lastRenameAt,
      },
    };
  }
}
