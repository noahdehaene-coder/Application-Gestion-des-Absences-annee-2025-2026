<!--Page de sélection de la matière ou de l'étudiant.e pour accéder au récapitulatif des absences-->

<template>
  <main class="left">
    <!-- Conteneur pour les boutons "Exporter" -->
    <div class="buttons-container">
      <button class="button" @click="exportAbsL1">Exporter les absences des L1</button>
      <button class="button" @click="exportAbsL2">Exporter les absences des L2</button>
      <button class="button" @click="exportAbsL3">Exporter les absences des L3</button>
    </div>

    <h1>Sélectionner la matière ou l'étudiant.e</h1>

    <div class="sections-container">

      <!-- Section Matière avec menus déroulants par semestre -->
      <div class="section">
        <h2>Matières</h2>
        <div class="courses-selector-container">
          <ul class="semesters-list-scrollable">
            <li v-for="semester in semesters" :key="semester" class="semester-item">
              <button 
                class="semester-link"
                :class="{ open: openSemesters.includes(semester) }"
                @click="toggleSemester(semester)"
              >
                <span class="semester-name">{{ semester }}</span>
                <span class="dropdown-arrow" :class="{ open: openSemesters.includes(semester) }">▼</span>
              </button>
              
              <ul v-if="openSemesters.includes(semester)" class="courses-list-inner">
                <li v-for="course in filteredCoursesBySemester(semester)" :key="course.id">
                  <RouterLink :to="`/recapitulatifs/matiere/${course.name}/${course.id}`" class="course-link">
                    <span class="course-name">{{ course.name }}</span>
                  </RouterLink>
                </li>
                <li v-if="filteredCoursesBySemester(semester).length === 0" class="no-results-inner">
                  Aucune matière
                </li>
              </ul>
            </li>
            <li v-if="semesters.length === 0" class="no-results">
              Aucun semestre
            </li>
          </ul>
        </div>
      </div>

      <!-- Section Étudiant avec liste scrollable -->
      <div class="section">
        <h2>Étudiant.e.s</h2>
        <div class="student-selector-container">
          <div class="search-container">
            <SearchIcon class="search-icon" />
            <input 
              type="search" 
              v-model="studentQuery" 
              placeholder="Rechercher un.e étudiant.e" 
              class="search-bar" 
            />
          </div>
          
          <ul class="students-list">
            <li v-for="student in filteredStudents" :key="student.id">
              <RouterLink :to="`/recapitulatifs/etudiant/${student.id}`" class="student-link">
                {{ student.name }}
              </RouterLink>
            </li>
            <li v-if="filteredStudents.length === 0" class="no-results">
              Aucun.e étudiant.e trouvé.e
            </li>
          </ul>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { RouterLink } from 'vue-router';
import SearchIcon from '@/shared/assets/icon/SearchIcon.vue';
import { getAllStudents } from '@/shared/fetchers/students';
import { getAllCourses } from '@/shared/fetchers/course_material';
import { getAbsenceByYear } from '@/shared/fetchers/presence';

const router = useRouter();

// Références pour la sélection des étudiants et matières
const students = ref([]);
const courses = ref([]);

// Recherche et sélection
const studentQuery = ref('');
const courseQuery = ref('');
const openSemesters = ref([]);

// Chargement des données
onMounted(async () => {
  students.value = await getAllStudents();
  courses.value = await getAllCourses();
});

// Filtrer les étudiants par barre de recherche
const filteredStudents = computed(() => {
  return students.value.filter((student) =>
    student.name.toLowerCase().includes(studentQuery.value.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));
});

// Obtenir les semestres uniques
const semesters = computed(() => {
  const sems = new Set(courses.value.map(c => c.semester_id));
  return Array.from(sems).sort((a, b) => a - b).map(s => `S${s}`);
});

// Filtrer les matières par semestre
const filteredCoursesBySemester = (semester) => {
  const semNum = parseInt(semester.substring(1));
  return courses.value
    .filter(c => c.semester_id === semNum)
    .sort((a, b) => a.name.localeCompare(b.name));
};

// Basculer l'ouverture/fermeture d'un semestre
const toggleSemester = (semester) => {
  if (openSemesters.value.includes(semester)) {
    openSemesters.value = openSemesters.value.filter(s => s !== semester);
  } else {
    openSemesters.value.push(semester);
  }
};

// Naviguer vers la page récapitulatif de l'étudiant
function goToStudent() {
  if (selectedStudentId.value) {
    router.push({ name: 'StudentSummaryPage', params: { id: selectedStudentId.value } });
  }
}

function formatDate(date) {
  const dateFormat = new Date(date);
  const day = String(dateFormat.getDate()).padStart(2, '0');
  const month = String(dateFormat.getMonth() + 1).padStart(2, '0');
  const year = dateFormat.getFullYear();
  return `${day}-${month}-${year}`;
}

function formatTime(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function generateCSV(abs, filename) {
  const headers = ['Session', 'Cours', 'Date','Heure', 'Numéro étudiant·e', 'Nom et Prénom'];
  const rows = abs.map(abs => {
    let timeStr = "Non défini";
    if (abs.start_time && abs.end_time) {
      timeStr = `${formatTime(abs.start_time)} - ${formatTime(abs.end_time)}`;
    }

    return [
      abs.session_type,
      abs.course_material,
      formatDate(abs.date),
      timeStr,
      abs.student_number,
      abs.name
    ];
  });

  const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
    + headers.join(';') + "\n"
    + rows.map(row => row.join(';')).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
}

async function exportAbsL1() {
  const absences = await getAbsenceByYear(1);
  if (!absences || !Array.isArray(absences)) {
    alert("Erreur : les absences sont introuvables.");
    return;
  }
  generateCSV(absences, 'Absences_L1_MIASHS.csv');
}

async function exportAbsL2() {
  const absences = await getAbsenceByYear(2);
  if (!absences || !Array.isArray(absences)) {
    alert("Erreur : les absences sont introuvables.");
    return;
  }
  generateCSV(absences, 'Absences_L2_MIASHS.csv');
}

async function exportAbsL3() {
  const absences = await getAbsenceByYear(3);
  if (!absences || !Array.isArray(absences)) {
    alert("Erreur : les absences sont introuvables.");
    return;
  }
  generateCSV(absences, 'Absences_L3_MIASHS.csv');
}
</script>

<style scoped>
@import url("../shared/shared.css");

.buttons-container {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 1rem;
  margin: 2rem 0 3rem 0;
  flex-wrap: wrap;
}

.button {
  margin-top: 0;
  padding: 0.6rem 1.2rem;
  font-size: 0.95rem;
}

main > h1 {
  margin-bottom: 2rem;
  color: #333;
}

.sections-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  max-width: 1200px;
}

@media (max-width: 900px) {
  .sections-container {
    grid-template-columns: 1fr;
  }
}

.section {
  padding: 1.5rem;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.section h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.2rem;
  color: #333;
  font-weight: 600;
}

/* Semesters Container */
.semesters-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.semester-group {
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  background: white;
}

.semester-header {
  width: 100%;
  padding: 0.75rem 1rem;
  background: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #254e70ff;
  transition: all 0.2s;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.semester-header:hover {
  background: #f5f5f5;
  border-color: #254e70ff;
}

.semester-header.open {
  background: #e3f2fd;
  border-color: #254e70ff;
}

.semester-header .arrow {
  transition: transform 0.2s;
  font-size: 12px;
  color: #666;
}

.semester-header.open .arrow {
  transform: rotate(90deg);
}

.courses-list {
  padding: 0;
  background: white;
}

.semester-search {
  padding: 0.8rem;
  margin: 0;
  border-bottom: 1px solid #eee;
}

.semester-search .search-bar {
  font-size: 0.9rem;
}

.courses-list .list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.courses-list .list li {
  margin: 0;
  border-bottom: 1px solid #f0f0f0;
}

.courses-list .list li:last-child {
  border-bottom: none;
}

.courses-list .router-link {
  display: block;
  padding: 0.8rem 1rem;
  text-decoration: none;
  color: #333;
  transition: all 0.2s;
  font-size: 0.95rem;
}

.courses-list .router-link:hover {
  background: #f9f9f9;
  color: #254e70ff;
  padding-left: 1.3rem;
}

/* Courses Selector */
.courses-selector-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.semesters-list-scrollable {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  max-height: 600px;
  overflow-y: auto;
}

.semester-item {
  margin: 0;
}

.semesters-list-scrollable .semester-item .semester-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.8rem 1rem;
  background: white !important;
  border: 2px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  color: #000 !important;
  font-weight: 600;
  transition: background-color 0.2s, color 0.2s, padding-left 0.2s;
  text-align: left;
}

.semesters-list-scrollable .semester-item .semester-link:hover {
  background: #f0f7ff !important;
  color: #254e70ff !important;
  padding-left: 1.3rem;
  border: 2px solid #ddd !important;
}

.semesters-list-scrollable .semester-item .semester-name {
  flex: 1;
  font-weight: 600;
  color: #000 !important;
}

.semesters-list-scrollable .semester-item .dropdown-arrow {
  font-size: 1rem;
  margin-left: 1rem;
  transition: transform 0.2s;
  color: #000 !important;
  flex-shrink: 0;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.courses-list-inner {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.courses-list-inner li {
  margin: 0;
}

.courses-list-inner .course-link {
  display: flex;
  align-items: center;
  padding: 0.6rem 1rem 0.6rem 2rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-decoration: none;
  color: #333;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.courses-list-inner .course-link:hover {
  background: #f0f7ff;
  color: #254e70ff;
  border-color: #254e70ff;
  padding-left: 2.3rem;
}

.no-results-inner {
  padding: 1rem;
  text-align: center;
  color: #999;
  font-size: 0.9rem;
  font-style: italic;
}

.no-results {
  padding: 2rem 1rem;
  text-align: center;
  color: #999;
  font-size: 0.9rem;
}

.search-container {
  flex-shrink: 0;
}

.search-icon {
  position: absolute;
  left: 0.8rem;
  top: 33%;
  transform: translateY(-50%);
  width: 1.2rem;
  height: 1.2rem;
  color: #999;
}

.search-bar {
  width: 100%;
  padding: 0.75rem 0.8rem 0.75rem 2.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.search-bar:focus {
  outline: none;
  border-color: #254e70ff;
  box-shadow: 0 0 0 2px rgba(37, 78, 112, 0.1);
}

.course-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.8rem 1rem;
  text-decoration: none;
  color: #333;
  transition: all 0.2s;
  font-size: 0.95rem;
}

.course-link:hover {
  background: #f0f7ff;
  color: #254e70ff;
}

.course-name {
  flex: 1;
}

.semester-badge {
  background-color: #254e70ff;
  color: white;
  font-size: 0.75rem;
  padding: 0.25rem 0.6rem;
  border-radius: 3px;
  font-weight: 600;
  margin-left: 0.5rem;
  flex-shrink: 0;
}

/* Student Selector */
.student-selector-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.students-list {
  list-style: none;
  padding: 0;
  margin: 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  overflow-y: auto;
  max-height: 400px;
  flex-shrink: 0;
}

.students-list li {
  border-bottom: 1px solid #f0f0f0;
  margin: 0;
}

.students-list li:last-child {
  border-bottom: none;
}

.student-link {
  display: block;
  padding: 0.8rem 1rem;
  text-decoration: none;
  color: #333;
  transition: all 0.2s;
  font-size: 0.95rem;
}

.student-link:hover {
  background: #f0f7ff;
  color: #254e70ff;
  padding-left: 1.3rem;
}

.student-dropdown {
  padding: 0.75rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
  background: white;
  cursor: pointer;
  color: #333;
  width: 100%;
  transition: all 0.2s;
}

.student-dropdown:hover {
  border-color: #999;
}

.student-dropdown:focus {
  outline: none;
  border-color: #254e70ff;
  box-shadow: 0 0 0 2px rgba(37, 78, 112, 0.1);
}

.no-results {
  padding: 1rem;
  color: #999;
  font-style: italic;
  text-align: center;
  font-size: 0.9rem;
}

/* Courses Selector */
.courses-selector-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.courses-list-scrollable {
  list-style: none;
  padding: 0;
  margin: 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  overflow-y: auto;
  max-height: 400px;
  flex-shrink: 0;
}

.courses-list-scrollable li {
  border-bottom: 1px solid #f0f0f0;
  margin: 0;
}

.courses-list-scrollable li:last-child {
  border-bottom: none;
}

.course-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 1rem;
  text-decoration: none;
  color: #333;
  transition: all 0.2s;
  font-size: 0.95rem;
}

.course-link:hover {
  background: #f0f7ff;
  color: #254e70ff;
}

.course-name {
  flex: 1;
}

.semester-badge {
  background-color: #254e70ff;
  color: white;
  font-size: 0.75rem;
  padding: 0.25rem 0.6rem;
  border-radius: 3px;
  font-weight: 600;
  margin-left: 0.5rem;
  flex-shrink: 0;
}

/* Student Selector */
.student-selector-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-container {
  flex-shrink: 0;
}

.students-list {
  list-style: none;
  padding: 0;
  margin: 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  overflow-y: auto;
  max-height: 400px;
  flex-shrink: 0;
}

.students-list li {
  border-bottom: 1px solid #f0f0f0;
  margin: 0;
}

.students-list li:last-child {
  border-bottom: none;
}

.student-link {
  display: block;
  padding: 0.8rem 1rem;
  text-decoration: none;
  color: #333;
  transition: all 0.2s;
  font-size: 0.95rem;
}

.student-link:hover {
  background: #f0f7ff;
  color: #254e70ff;
  padding-left: 1.3rem;
}

.student-dropdown {
  padding: 0.75rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
  background: white;
  cursor: pointer;
  color: #333;
  width: 100%;
  transition: all 0.2s;
}

.student-dropdown:hover {
  border-color: #999;
}

.student-dropdown:focus {
  outline: none;
  border-color: #254e70ff;
  box-shadow: 0 0 0 2px rgba(37, 78, 112, 0.1);
}

.student-dropdown option {
  padding: 0.5rem;
  color: #333;
}

.student-selector-container .button {
  width: 100%;
  padding: 0.75rem;
}
</style>