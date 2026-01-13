-- CreateTable
CREATE TABLE "ProfessorPreference" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "professorId" INTEGER NOT NULL,
    "courseMaterialId" INTEGER NOT NULL,
    CONSTRAINT "ProfessorPreference_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfessorPreference_courseMaterialId_fkey" FOREIGN KEY ("courseMaterialId") REFERENCES "course_material" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfessorPreference_professorId_courseMaterialId_key" ON "ProfessorPreference"("professorId", "courseMaterialId");
