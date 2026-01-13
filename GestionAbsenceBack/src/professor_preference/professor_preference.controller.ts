import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ProfessorPreferenceService } from './professor_preference.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '@prisma/client';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Préférences Professeur')
@Controller('preferences')
@UseGuards(JwtAuthGuard)
export class ProfessorPreferenceController {
  constructor(
    private readonly professorPreferenceService: ProfessorPreferenceService,
  ) {}

  /**
   * Récupère les préférences de matières du professeur connecté
   */
  @Get('my-preferences')
  @ApiOperation({ summary: 'Récupérer mes préférences de matières' })
  async getMyPreferences(@CurrentUser() user: User) {
    return this.professorPreferenceService.getPreferencesForProfessor(user.id);
  }

  /**
   * Récupère les préférences d'un professeur (par ID)
   */
  @Get(':professorId')
  @ApiOperation({ summary: 'Récupérer les préférences d\'un professeur' })
  async getPreferences(
    @Param('professorId', ParseIntPipe) professorId: number,
  ) {
    return this.professorPreferenceService.getPreferencesForProfessor(
      professorId,
    );
  }

  /**
   * Sauvegarde les préférences du professeur connecté
   */
  @Post('my-preferences')
  @ApiOperation({ summary: 'Sauvegarder mes préférences de matières' })
  async saveMyPreferences(
    @CurrentUser() user: User,
    @Body() body: { courseMaterialIds: number[] },
  ) {
    return this.professorPreferenceService.savePreferences(
      user.id,
      body.courseMaterialIds,
    );
  }

  /**
   * Ajoute une préférence pour le professeur connecté
   */
  @Post('add/:courseMaterialId')
  @ApiOperation({ summary: 'Ajouter une matière aux préférences' })
  async addPreference(
    @CurrentUser() user: User,
    @Param('courseMaterialId', ParseIntPipe) courseMaterialId: number,
  ) {
    return this.professorPreferenceService.addPreference(
      user.id,
      courseMaterialId,
    );
  }

  /**
   * Supprime une préférence du professeur connecté
   */
  @Delete('remove/:courseMaterialId')
  @ApiOperation({ summary: 'Retirer une matière des préférences' })
  async removePreference(
    @CurrentUser() user: User,
    @Param('courseMaterialId', ParseIntPipe) courseMaterialId: number,
  ) {
    await this.professorPreferenceService.removePreference(
      user.id,
      courseMaterialId,
    );
    return { message: 'Préférence supprimée' };
  }
}
