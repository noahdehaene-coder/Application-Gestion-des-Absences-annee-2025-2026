import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Prisma, student, UserRole } from '@prisma/client';

@Injectable()
export class StudentService {
  constructor(private prisma: PrismaService) {}

  async get(id: Prisma.studentWhereUniqueInput): Promise<student | null> {
    return this.prisma.student.findUnique({
      where: id,
    });
  }

  async getByGroup(groupId: number) {
    return this.prisma.student.findMany({
      where: {
        student_inscription: {
          some: {
            group_id: groupId,
          },
        },
      },
    });
  }

  async getByOtherGroups(groupId: number) {
    // 1. Récupérer le groupe de base et son semestre
    const baseGroup = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { group_semester: true },
    });
    if (!baseGroup) {
      throw new Error('Groupe non trouvé');
    }

    const semesterId = baseGroup.group_semester.id;

    // 2. Logique existante : Trouver les étudiants dans les autres groupes du semestre
    const otherGroups = await this.prisma.group.findMany({
      where: {
        semester_id: semesterId,
        name: {
          not: baseGroup.name,
        },
      },
    });

    const similarGroupsIds = otherGroups
      .filter((group) => this.isOneCharDifferent(baseGroup.name, group.name))
      .map((group) => group.id);

    let studentsInOtherGroups: any[] = [];

    if (similarGroupsIds.length > 0) {
      const inscriptions = await this.prisma.inscription.findMany({
        where: {
          group_id: { in: similarGroupsIds },
        },
        include: {
          inscription_student: true,
          inscription_group: true,
        },
      });

      studentsInOtherGroups = inscriptions.map((i) => ({
        ...i.inscription_student,
        originalGroupId: i.inscription_group.id,
        originalGroupName: i.inscription_group.name,
      }));
    } else {
      const allSemesterInscriptions = await this.prisma.inscription.findMany({
        where: {
          group_id: { not: baseGroup.id },
          inscription_group: {
            semester_id: semesterId,
          },
        },
        include: {
          inscription_student: true,
          inscription_group: true,
        },
      });

      const uniqueMap = new Map();
      for (const i of allSemesterInscriptions) {
        if (!uniqueMap.has(i.inscription_student.id)) {
          uniqueMap.set(i.inscription_student.id, {
             ...i.inscription_student,
             originalGroupId: i.inscription_group.id,
             originalGroupName: i.inscription_group.name,
          });
        }
      }
      studentsInOtherGroups = Array.from(uniqueMap.values());
    }

    const studentsWithoutGroup = await this.prisma.student.findMany({
      where: {
        student_inscription: {
          none: {
            inscription_group: {
              semester_id: semesterId,
            },
          },
        },
      },
    });

    return [...studentsInOtherGroups, ...studentsWithoutGroup];
  }

  private isOneCharDifferent(s1: string, s2: string) {
    if (s1.length === s2.length) {
      let diff = 0;
      let i: number;
      for (i = 0; i < s1.length; i++) {
        if (s1[i] !== s2[i]) {
          diff++;
        }
        if (diff > 1) {
          return false;
        }
      }
      return diff === 1;
    }
  }

  async getByCourseMaterial(courseMaterialId: number) {
    const courseMaterialSemester = await this.prisma.course_material.findUnique(
      {
        where: {
          id: courseMaterialId,
        },
      },
    );
    const groups = await this.prisma.group.findMany({
      where: {
        semester_id: courseMaterialSemester?.semester_id,
      },
    });
    const groupIds = groups.map((group) => group.id);
    const inscriptions = await this.prisma.inscription.findMany({
      where: {
        group_id: { in: groupIds },
      },
    });
    const inscriptionStudentIds = Array.from(
      new Set(inscriptions.map((inscription) => inscription.student_id)),
    );
    const students = await this.prisma.student.findMany({
      where: {
        id: {
          in: inscriptionStudentIds,
        },
      },
    });
    return students;
  }

  async getByCourseWithPresence(courseId: number) {
  const absences = await this.prisma.presence.findMany({
    where: {
      presence_slot: {
        slot_session_type: {
          course_material_id: courseId,
        },
      },
    },
    include: {
      presence_student: {
        select: {
          name: true,
          student_number: true,
        },
      },
      presence_slot: {
        select: {
          date: true,
          slot_session_type: {
            select: {
              sessionTypeGlobal: {
                select: { name: true },
              },
              session_type_course_material: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const simplified = absences.map((a) => ({
    name: a.presence_student.name,
    student_number: a.presence_student.student_number,
    date: a.presence_slot.date,
    session_type: a.presence_slot.slot_session_type.sessionTypeGlobal.name,
    course_material: a.presence_slot.slot_session_type.session_type_course_material.name,
    justified: a.justified,
    student_id: a.student_id,
    slot_id: a.slot_id,
  }));
  
  return simplified;
}

  async getAll(): Promise<student[]> {
    return this.prisma.student.findMany();
  }

  async findByStudentNumber(student_num: string[]): Promise<student[]> {
    return this.prisma.student.findMany({
      where: {
        student_number: {
          in: student_num,
        },
      },
    });
  }

  async post(data: any): Promise<student> {
    const { password, ...studentData } = data;

    if (password) {

      const nameSlug = studentData.name
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '.');

      const email = `${nameSlug}@etu.univ-grenoble-alpes.fr`;

      return this.prisma.student.create({
        data: {
          ...studentData,
          user: {
            create: {
              email: email,
              name: studentData.name,
              password: password,
              role: UserRole.ETUDIANT,
            },
          },
        },
      });
    }

    return this.prisma.student.create({
      data: studentData,
    });
  }

  async put(
    id: number,
    data: Prisma.studentUpdateInput,
  ): Promise<student | null> {
    return this.prisma.student.update({
      where: { id },
      data: data,
    });
  }

  async delete(id: Prisma.studentWhereUniqueInput): Promise<student> {
    return this.prisma.student.delete({
      where: id,
    });
  }

  async deleteMany() {
    return this.prisma.student.deleteMany();
  }
}
