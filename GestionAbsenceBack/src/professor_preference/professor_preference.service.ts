import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ProfessorPreference } from '@prisma/client';

@Injectable()
export class ProfessorPreferenceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Récupère toutes les préférences d'un professeur
   */
  async getPreferencesForProfessor(professorId: number): Promise<number[]> {
    const preferences = await this.prisma.professorPreference.findMany({
      where: { professorId },
      select: { courseMaterialId: true },
    });
    return preferences.map((p) => p.courseMaterialId);
  }

  /**
   * Sauvegarde les préférences d'un professeur
   */
  async savePreferences(
    professorId: number,
    courseMaterialIds: number[],
  ): Promise<number[]> {
    // Supprimer toutes les préférences existantes
    await this.prisma.professorPreference.deleteMany({
      where: { professorId },
    });

    // Créer les nouvelles préférences
    if (courseMaterialIds.length > 0) {
      await this.prisma.professorPreference.createMany({
        data: courseMaterialIds.map((courseMaterialId) => ({
          professorId,
          courseMaterialId,
        })),
      });
    }

    return courseMaterialIds;
  }

  /**
   * Ajoute une préférence pour un professeur
   */
  async addPreference(
    professorId: number,
    courseMaterialId: number,
  ): Promise<ProfessorPreference> {
    return this.prisma.professorPreference.upsert({
      where: {
        professorId_courseMaterialId: { professorId, courseMaterialId },
      },
      update: {},
      create: { professorId, courseMaterialId },
    });
  }

  /**
   * Supprime une préférence
   */
  async removePreference(
    professorId: number,
    courseMaterialId: number,
  ): Promise<void> {
    await this.prisma.professorPreference.delete({
      where: {
        professorId_courseMaterialId: { professorId, courseMaterialId },
      },
    });
  }
}
