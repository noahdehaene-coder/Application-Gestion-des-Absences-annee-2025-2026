import { Module } from '@nestjs/common';
import { ProfessorPreferenceService } from './professor_preference.service';
import { ProfessorPreferenceController } from './professor_preference.controller';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProfessorPreferenceController],
  providers: [ProfessorPreferenceService],
  exports: [ProfessorPreferenceService],
})
export class ProfessorPreferenceModule {}
