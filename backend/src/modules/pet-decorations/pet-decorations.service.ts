import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthService } from '@/modules/auth/auth.service';
import { AuthUser } from '@/common/auth/auth-user.interface';
import { toNumber } from '@/common/utils/bigint.util';
import { resolvePetDecoChangeCost } from '@/common/utils/pet-growth.util';
import { syncUnlockedDecorationsForLevel } from '@/common/utils/pet-decoration-unlock.util';
import { isPetDecorationLevelLocked } from '@/common/utils/pet-decoration-access.util';
import {
  describeThemeFreeRule,
  isThemeFreeActive,
} from '@/common/utils/pet-decoration-theme-free.util';
import {
  getThemeDisplayName,
  LEGACY_THEME_LAYER_TYPES,
  resolveThemeComposition,
  THEME_BACKDROP_TYPE,
} from '@/common/utils/pet-decoration-theme-composition.util';
import { EquipDecorationDto } from './dto/equip-decoration.dto';
import { EquipThemeDto } from './dto/equip-theme.dto';

const THEME_QUERY_TYPES = [...LEGACY_THEME_LAYER_TYPES, THEME_BACKDROP_TYPE] as const;

@Injectable()
export class PetDecorationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async listByClass(classId: number) {
    const classroom = await this.prisma.classroom.findFirst({
      where: { id: BigInt(classId), deletedAt: null, status: 'enabled' },
      select: { schoolId: true },
    });
    if (!classroom) {
      return { code: 0, message: 'ok', data: [] };
    }

    const rows = await this.prisma.petDecoration.findMany({
      where: { schoolId: classroom.schoolId, status: 'enabled' },
      orderBy: [{ unlockLevel: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
    });

    return {
      code: 0,
      message: 'ok',
      data: rows.map((row) => ({
        id: toNumber(row.id),
        code: row.code,
        name: row.name,
        type: row.type,
        imageUrl: row.imageUrl,
        previewUrl: row.previewUrl,
        unlockLevel: row.unlockLevel,
        sortOrder: row.sortOrder,
        themeGroup: row.themeGroup,
        themeFreeRule: row.themeFreeRule,
        themeFreeActive: isThemeFreeActive(row.themeFreeRule),
        themeFreeLabel: describeThemeFreeRule(row.themeFreeRule),
      })),
    };
  }

  async listUnlocked(studentPetId: number) {
    const studentPet = await this.prisma.studentPet.findUnique({
      where: { id: BigInt(studentPetId) },
      include: { student: { select: { schoolId: true } } },
    });
    if (!studentPet) throw new NotFoundException('宠物不存在');

    await this.prisma.$transaction(async (tx) => {
      await syncUnlockedDecorationsForLevel(
        tx,
        studentPet.id,
        studentPet.student.schoolId,
        studentPet.currentLevel,
      );
    });

    const rows = await this.prisma.studentPetDecoration.findMany({
      where: { studentPetId: BigInt(studentPetId) },
      include: { decoration: true },
      orderBy: [{ decoration: { unlockLevel: 'asc' } }, { id: 'asc' }],
    });

    return {
      code: 0,
      message: 'ok',
      data: rows.map((row) => ({
        id: toNumber(row.id),
        decorationId: toNumber(row.decorationId),
        code: row.decoration.code,
        name: row.decoration.name,
        type: row.decoration.type,
        imageUrl: row.decoration.imageUrl,
        previewUrl: row.decoration.previewUrl,
        unlockLevel: row.decoration.unlockLevel,
        themeGroup: row.decoration.themeGroup,
        isEquipped: row.isEquipped,
        unlockedAt: row.unlockedAt,
      })),
    };
  }

  async getChangePolicy(studentPetId: number) {
    const studentPet = await this.loadStudentPetContext(studentPetId);
    const profile = studentPet.student.profile;
    const changeCost = resolvePetDecoChangeCost(studentPet.student.school.petDecoChangeCost);

    return {
      code: 0,
      message: 'ok',
      data: {
        changeCost,
        freeAvailable: this.hasFreeDecoChange(studentPet),
        freeChangeKind: this.resolveFreeChangeKind(studentPet),
        currentScore: profile?.currentScore ?? 0,
        currentLevel: studentPet.currentLevel,
      },
    };
  }

  async equip(authorization: string | undefined, studentPetId: number, dto: EquipDecorationDto) {
    const user = await this.getOptionalAuthUser(authorization);
    const studentPet = await this.loadStudentPetContext(studentPetId);

    const decoration = await this.prisma.petDecoration.findFirst({
      where: {
        id: BigInt(dto.decorationId),
        schoolId: studentPet.student.schoolId,
        status: 'enabled',
      },
    });
    if (!decoration) throw new NotFoundException('装饰不存在');

    if (isPetDecorationLevelLocked(decoration.unlockLevel, studentPet.currentLevel)) {
      throw new BadRequestException(`该主题装饰需萌宠达到 Lv.${decoration.unlockLevel} 后可用`);
    }

    let studentDeco = await this.prisma.studentPetDecoration.findFirst({
      where: {
        studentPetId: BigInt(studentPetId),
        decorationId: BigInt(dto.decorationId),
      },
    });

    const decoType = decoration.type;
    let costPaid = 0;
    let usedFreeChange = false;
    let usedThemeFreePromo = false;
    let freeChangeKindUsed: 'levelup' | 'welcome' | null = null;
    let currentScore = studentPet.student.profile?.currentScore ?? 0;

    await this.prisma.$transaction(async (tx) => {
      const freshPet = await tx.studentPet.findUniqueOrThrow({
        where: { id: BigInt(studentPetId) },
        include: {
          student: {
            include: {
              profile: true,
              school: { select: { petDecoChangeCost: true } },
              classroom: { select: { semesterId: true } },
              groupRel: { select: { classGroupId: true } },
            },
          },
        },
      });

      const changeCost = resolvePetDecoChangeCost(freshPet.student.school.petDecoChangeCost);

      if (dto.action === 'equip') {
        if (!studentDeco) {
          studentDeco = await tx.studentPetDecoration.create({
            data: {
              studentPetId: BigInt(studentPetId),
              decorationId: BigInt(dto.decorationId),
              isEquipped: false,
            },
          });
        }

        const alreadyEquipped = studentDeco.isEquipped;
        if (alreadyEquipped) {
          return;
        }

        const themeFreeToday =
          !!decoration.themeGroup && isThemeFreeActive(decoration.themeFreeRule);
        const useFree = !themeFreeToday && this.hasFreeDecoChange(freshPet);
        if (themeFreeToday) {
          usedThemeFreePromo = true;
        } else if (useFree) {
          freeChangeKindUsed = this.resolveFreeChangeKind(freshPet);
          await tx.studentPet.update({
            where: { id: BigInt(studentPetId) },
            data: this.buildFreeChangeConsumeData(freshPet),
          });
          usedFreeChange = true;
        } else if (changeCost > 0) {
          const profile = freshPet.student.profile;
          if (!profile || profile.currentScore < changeCost) {
            throw new BadRequestException(`积分不足，更换装扮需要 ${changeCost} 积分`);
          }
          const operator = await this.resolveDecoChangeOperator(
            tx,
            freshPet.student.schoolId,
            freshPet.student.classId,
            user,
          );

          const rule = await this.ensureDecoChangeScoreRule(
            tx,
            freshPet.student.schoolId,
            freshPet.student.classId,
            changeCost,
          );
          await tx.studentProfile.update({
            where: { studentId: freshPet.studentId },
            data: {
              currentScore: { decrement: changeCost },
              negativeCount7d: { increment: 1 },
              lastScoreAt: new Date(),
            },
          });

          await tx.scoreRecord.create({
            data: {
              schoolId: freshPet.student.schoolId,
              semesterId: freshPet.student.classroom.semesterId,
              classId: freshPet.student.classId,
              studentId: freshPet.studentId,
              classGroupId: freshPet.student.groupRel?.classGroupId ?? null,
              ruleId: rule.id,
              subjectCode: rule.subjectCode,
              sceneCode: rule.sceneCode,
              dimension: rule.dimension,
              tag: rule.tag,
              sentiment: rule.sentiment,
              scoreDelta: -changeCost,
              remark: `更换装扮：${decoration.name}`,
              sourceTerminal: 'display',
              sourceRole: operator.sourceRole,
              operatorId: operator.operatorId,
              operatorName: operator.operatorName,
            },
          });

          costPaid = changeCost;
          currentScore = profile.currentScore - changeCost;
        }

        await tx.studentPetDecoration.updateMany({
          where: {
            studentPetId: BigInt(studentPetId),
            isEquipped: true,
            decoration: { type: decoType },
          },
          data: { isEquipped: false },
        });
        if (dto.action === 'equip') {
          await this.unequipBackdropExclusiveLayers(tx, studentPetId, decoration.type);
        }
        await tx.studentPetDecoration.update({
          where: { id: studentDeco.id },
          data: { isEquipped: true },
        });
      } else {
        if (!studentDeco?.isEquipped) {
          return;
        }
        await tx.studentPetDecoration.update({
          where: { id: studentDeco.id },
          data: { isEquipped: false },
        });
      }
    });

    const updatedPet = await this.prisma.studentPet.findUnique({
      where: { id: BigInt(studentPetId) },
    });

    return {
      code: 0,
      message: 'ok',
      data: {
        studentPetId,
        decorationId: dto.decorationId,
        action: dto.action,
        costPaid,
        usedFreeChange,
        usedThemeFreePromo,
        freeChangeKindUsed,
        currentScore,
        freeAvailable: updatedPet ? this.hasFreeDecoChange(updatedPet) : false,
        freeChangeKind: updatedPet ? this.resolveFreeChangeKind(updatedPet) : null,
      },
    };
  }

  async equipTheme(authorization: string | undefined, studentPetId: number, dto: EquipThemeDto) {
    const user = await this.getOptionalAuthUser(authorization);
    const studentPet = await this.loadStudentPetContext(studentPetId);

    const themeDecorations = await this.prisma.petDecoration.findMany({
      where: {
        schoolId: studentPet.student.schoolId,
        themeGroup: dto.themeGroup,
        status: 'enabled',
        type: { in: [...THEME_QUERY_TYPES] },
      },
      orderBy: [{ sortOrder: 'asc' }, { type: 'asc' }, { id: 'asc' }],
    });

    const composition = resolveThemeComposition(themeDecorations);
    if (!composition) {
      throw new NotFoundException('主题皮肤不存在或素材不完整');
    }

    const themePieces = composition.pieces;

    for (const decoration of themePieces) {
      if (isPetDecorationLevelLocked(decoration.unlockLevel, studentPet.currentLevel)) {
        throw new BadRequestException(`该主题皮肤需萌宠达到 Lv.${decoration.unlockLevel} 后可用`);
      }
    }

    const themeName = getThemeDisplayName(themePieces, dto.themeGroup);

    let costPaid = 0;
    let usedFreeChange = false;
    let usedThemeFreePromo = false;
    let freeChangeKindUsed: 'levelup' | 'welcome' | null = null;
    let currentScore = studentPet.student.profile?.currentScore ?? 0;

    const themeFreeToday = isThemeFreeActive(themePieces[0]?.themeFreeRule);

    await this.prisma.$transaction(async (tx) => {
      const freshPet = await tx.studentPet.findUniqueOrThrow({
        where: { id: BigInt(studentPetId) },
        include: {
          student: {
            include: {
              profile: true,
              school: { select: { petDecoChangeCost: true } },
              classroom: { select: { semesterId: true } },
              groupRel: { select: { classGroupId: true } },
            },
          },
        },
      });

      const equippedRows = await tx.studentPetDecoration.findMany({
        where: { studentPetId: BigInt(studentPetId), isEquipped: true },
        include: { decoration: true },
      });

      const themeIdSet = new Set(themePieces.map((item) => item.id.toString()));

      if (dto.action === 'unequip') {
        const toUnequip = equippedRows.filter((row) => themeIdSet.has(row.decorationId.toString()));
        if (toUnequip.length === 0) {
          return;
        }
        await tx.studentPetDecoration.updateMany({
          where: { id: { in: toUnequip.map((row) => row.id) } },
          data: { isEquipped: false },
        });
        return;
      }

      const alreadyFullyEquipped = themePieces.every((piece) =>
        equippedRows.some(
          (row) => row.decorationId === piece.id && row.isEquipped,
        ),
      );
      if (alreadyFullyEquipped) {
        return;
      }

      const changeCost = resolvePetDecoChangeCost(freshPet.student.school.petDecoChangeCost);
      const useFree = !themeFreeToday && this.hasFreeDecoChange(freshPet);
      if (themeFreeToday) {
        usedThemeFreePromo = true;
      } else if (useFree) {
        freeChangeKindUsed = this.resolveFreeChangeKind(freshPet);
        await tx.studentPet.update({
          where: { id: BigInt(studentPetId) },
          data: this.buildFreeChangeConsumeData(freshPet),
        });
        usedFreeChange = true;
      } else if (changeCost > 0) {
        const profile = freshPet.student.profile;
        if (!profile || profile.currentScore < changeCost) {
          throw new BadRequestException(`积分不足，更换主题皮肤需要 ${changeCost} 积分`);
        }
        const operator = await this.resolveDecoChangeOperator(
          tx,
          freshPet.student.schoolId,
          freshPet.student.classId,
          user,
        );

        const rule = await this.ensureDecoChangeScoreRule(
          tx,
          freshPet.student.schoolId,
          freshPet.student.classId,
          changeCost,
        );
        await tx.studentProfile.update({
          where: { studentId: freshPet.studentId },
          data: {
            currentScore: { decrement: changeCost },
            negativeCount7d: { increment: 1 },
            lastScoreAt: new Date(),
          },
        });

        await tx.scoreRecord.create({
          data: {
            schoolId: freshPet.student.schoolId,
            semesterId: freshPet.student.classroom.semesterId,
            classId: freshPet.student.classId,
            studentId: freshPet.studentId,
            classGroupId: freshPet.student.groupRel?.classGroupId ?? null,
            ruleId: rule.id,
            subjectCode: rule.subjectCode,
            sceneCode: rule.sceneCode,
            dimension: rule.dimension,
            tag: rule.tag,
            sentiment: rule.sentiment,
            scoreDelta: -changeCost,
            remark: `更换主题皮肤：${themeName}`,
            sourceTerminal: 'display',
            sourceRole: operator.sourceRole,
            operatorId: operator.operatorId,
            operatorName: operator.operatorName,
          },
        });

        costPaid = changeCost;
        currentScore = profile.currentScore - changeCost;
      }

      for (const decoration of themePieces) {
        let studentDeco = await tx.studentPetDecoration.findFirst({
          where: {
            studentPetId: BigInt(studentPetId),
            decorationId: decoration.id,
          },
        });
        if (!studentDeco) {
          studentDeco = await tx.studentPetDecoration.create({
            data: {
              studentPetId: BigInt(studentPetId),
              decorationId: decoration.id,
              isEquipped: false,
            },
          });
        }

        await tx.studentPetDecoration.updateMany({
          where: {
            studentPetId: BigInt(studentPetId),
            isEquipped: true,
            decoration: { type: decoration.type },
          },
          data: { isEquipped: false },
        });
        await tx.studentPetDecoration.update({
          where: { id: studentDeco.id },
          data: { isEquipped: true },
        });
      }

      if (composition.mode === 'composite') {
        await tx.studentPetDecoration.updateMany({
          where: {
            studentPetId: BigInt(studentPetId),
            isEquipped: true,
            decoration: { type: { in: ['background', 'frame'] } },
          },
          data: { isEquipped: false },
        });
      }
    });

    const updatedPet = await this.prisma.studentPet.findUnique({
      where: { id: BigInt(studentPetId) },
    });

    return {
      code: 0,
      message: 'ok',
      data: {
        studentPetId,
        themeGroup: dto.themeGroup,
        action: dto.action,
        themeMode: composition.mode,
        decorationIds: themePieces.map((item) => toNumber(item.id)),
        costPaid,
        usedFreeChange,
        usedThemeFreePromo,
        themeFreeActive: themeFreeToday,
        freeChangeKindUsed,
        currentScore,
        freeAvailable: updatedPet ? this.hasFreeDecoChange(updatedPet) : false,
        freeChangeKind: updatedPet ? this.resolveFreeChangeKind(updatedPet) : null,
      },
    };
  }

  private async unequipBackdropExclusiveLayers(
    tx: Prisma.TransactionClient,
    studentPetId: number,
    incomingType: string,
  ) {
    if (incomingType === THEME_BACKDROP_TYPE) {
      await tx.studentPetDecoration.updateMany({
        where: {
          studentPetId: BigInt(studentPetId),
          isEquipped: true,
          decoration: { type: { in: ['background', 'frame'] } },
        },
        data: { isEquipped: false },
      });
      return;
    }
    if (incomingType === 'background' || incomingType === 'frame') {
      await tx.studentPetDecoration.updateMany({
        where: {
          studentPetId: BigInt(studentPetId),
          isEquipped: true,
          decoration: { type: THEME_BACKDROP_TYPE },
        },
        data: { isEquipped: false },
      });
    }
  }

  private hasLevelUpFreeChange(studentPet: {
    currentLevel: number;
    decoFreeChangeLevel: number | null;
  }) {
    return (
      studentPet.decoFreeChangeLevel != null &&
      studentPet.decoFreeChangeLevel === studentPet.currentLevel
    );
  }

  private hasWelcomeFreeChange(studentPet: { decoFreeChangeUsed: boolean }) {
    return !studentPet.decoFreeChangeUsed;
  }

  private hasFreeDecoChange(studentPet: {
    currentLevel: number;
    decoFreeChangeLevel: number | null;
    decoFreeChangeUsed: boolean;
  }) {
    return this.hasLevelUpFreeChange(studentPet) || this.hasWelcomeFreeChange(studentPet);
  }

  private resolveFreeChangeKind(studentPet: {
    currentLevel: number;
    decoFreeChangeLevel: number | null;
    decoFreeChangeUsed: boolean;
  }): 'levelup' | 'welcome' | null {
    if (this.hasLevelUpFreeChange(studentPet)) return 'levelup';
    if (this.hasWelcomeFreeChange(studentPet)) return 'welcome';
    return null;
  }

  private buildFreeChangeConsumeData(studentPet: {
    currentLevel: number;
    decoFreeChangeLevel: number | null;
    decoFreeChangeUsed: boolean;
  }) {
    if (this.hasLevelUpFreeChange(studentPet)) {
      return { decoFreeChangeLevel: null };
    }
    return { decoFreeChangeUsed: true };
  }

  private async getOptionalAuthUser(authorization?: string) {
    if (!authorization?.trim()) return null;
    return this.authService.getAuthUserFromAuthorization(authorization).catch(() => null);
  }

  private async resolveDecoChangeOperator(
    tx: Prisma.TransactionClient,
    schoolId: bigint,
    classId: bigint,
    user: AuthUser | null,
  ) {
    if (user) {
      return {
        operatorId: user.id,
        operatorName: user.name,
        sourceRole: user.roleCode,
      };
    }

    const classroom = await tx.classroom.findUnique({
      where: { id: classId },
      select: {
        homeroomTeacher: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    if (classroom?.homeroomTeacher) {
      return {
        operatorId: classroom.homeroomTeacher.id,
        operatorName: classroom.homeroomTeacher.name,
        sourceRole: 'student_self_service',
      };
    }

    const fallbackUser = await tx.user.findFirst({
      where: {
        schoolId,
        deletedAt: null,
        status: 'enabled',
        role: { code: { in: ['super_admin', 'school_admin', 'academic_admin', 'moral_admin'] } },
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: { id: 'asc' },
    });
    if (!fallbackUser) {
      throw new ForbiddenException('当前班级缺少可归属的操作账号，暂不能更换装扮');
    }
    return {
      operatorId: fallbackUser.id,
      operatorName: fallbackUser.name,
      sourceRole: 'student_self_service',
    };
  }

  private async loadStudentPetContext(studentPetId: number) {
    const studentPet = await this.prisma.studentPet.findUnique({
      where: { id: BigInt(studentPetId) },
      include: {
        student: {
          include: {
            profile: true,
            school: { select: { petDecoChangeCost: true } },
            classroom: { select: { semesterId: true } },
            groupRel: { select: { classGroupId: true } },
          },
        },
      },
    });
    if (!studentPet) throw new NotFoundException('宠物不存在');
    return studentPet;
  }

  private async ensureDecoChangeScoreRule(
    tx: Prisma.TransactionClient,
    schoolId: bigint,
    classId: bigint,
    changeCost: number,
  ) {
    const classroom = await tx.classroom.findUnique({
      where: { id: classId },
      select: { semesterId: true },
    });
    if (!classroom) {
      throw new ForbiddenException('班级不存在');
    }

    const existing = await tx.scoreRule.findFirst({
      where: {
        schoolId,
        semesterId: classroom.semesterId,
        sceneCode: 'pet_deco',
        code: 'PET_DECO_CHANGE',
        deletedAt: null,
      },
    });
    if (existing) {
      if (existing.scoreValue !== changeCost) {
        return tx.scoreRule.update({
          where: { id: existing.id },
          data: { scoreValue: changeCost },
        });
      }
      return existing;
    }

    return tx.scoreRule.create({
      data: {
        schoolId,
        semesterId: classroom.semesterId,
        moduleType: 'general',
        sceneCode: 'pet_deco',
        code: 'PET_DECO_CHANGE',
        name: '更换萌宠装扮',
        scoreType: 'deduct',
        scoreMode: 'fixed',
        scoreTarget: 'student',
        scoreValue: changeCost,
        dimension: '萌宠装扮',
        tag: '装扮更换',
        sentiment: 'negative',
        isHighFrequency: false,
        displayEnabled: false,
        adminEnabled: false,
        status: 'enabled',
      },
    });
  }
}
