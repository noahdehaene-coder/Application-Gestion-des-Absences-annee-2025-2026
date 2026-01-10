<template>
  <!-- Mode création de groupe -->
  <main class="left" v-if="isNewGroup">
    <h1>Créer un nouveau groupe</h1>
    
    <form @submit.prevent="createNewGroup" class="create-form">
      <div class="form-group">
        <label for="groupName">Nom du groupe :</label>
        <input 
          id="groupName" 
          v-model="newGroupName" 
          type="text" 
          placeholder="Ex: Groupe A, TD1, TP2..." 
          required
        />
      </div>
      
      <div class="form-group">
        <label for="semester">Semestre :</label>
        <select id="semester" v-model="newGroupSemester" required>
          <option value="" disabled>-- Choisir un semestre --</option>
          <option v-for="sem in allSemesters" :key="sem.id" :value="sem.id">
            {{ sem.name }}
          </option>
        </select>
      </div>
      
      <div class="form-actions">
        <button type="submit" class="button">Créer le groupe</button>
        <RouterLink to="/selection/groupe" class="button btn-cancel">Annuler</RouterLink>
      </div>
    </form>
  </main>

  <!-- Mode modification de groupe existant -->
  <main class="left" v-else-if="group && semester">
    <div class="container">
      
      <div class="left-container">
        <h1>Membres de {{ group.name }}</h1>
        <div class="search-container">
          <SearchIcon class="search-icon" />
          <input class="search-bar" type="search" v-model="searchQuery1" placeholder="Filtrer la liste..." />
        </div>
        <ul class="list">
          <li v-for="student in filteredStudentsInGroup" :key="student.id" class="students-list">
            <div class="student-list-container">
              <div class="student-info">
                {{ student.name }}
              </div>
              <div class="student-group-number">
                <p>{{ group.name }}</p>
              </div>
            </div>
            <button @click="deleteStudent(student)" class="button delete-btn" title="Retirer du groupe">
              ×
            </button>
          </li>
        </ul>
      </div>

      <div class="right-container">
        <h1>Autres étudiant·e·s</h1>
        
        <div class="select-container">
          <select v-model="selectedSource" @change="loadRightList" class="group-select">
            <option value="" disabled>-- Choisir une source --</option>
            <option value="no_extra_group">Étudiant·e·s sans groupe</option>
            <option disabled>--- Groupes de l'année ---</option>
            <option v-for="g in baseYearGroups" :key="g.id" :value="g.id">
              {{ g.name }}
            </option>
          </select>
        </div>

        <div class="search-container">
          <SearchIcon class="search-icon" />
          <input class="search-bar" type="search" v-model="searchQuery2" placeholder="Rechercher un.e étudiant.e" />
        </div>

        <div v-if="loadingRight" class="loading-text">Chargement...</div>

        <ul v-else class="list">
          <li v-for="student in filteredStudentsInOtherGroups" :key="student.id" class="students-list">
            <div class="student-list-container">
              <div class="student-info">
                <span class="student-name">{{ student.name }}</span>
                <span class="student-groups" v-if="student.groupNames && student.groupNames.length > 0">
                  {{ student.groupNames.join(', ') }}
                </span>
                <span class="student-groups" v-else>
                  étudiant sans groupe
                </span>
              </div>
            </div>
            
            <button 
              @click="addStudent(student)" 
              class="button add-btn" 
              title="Ajouter au groupe"
            >
              +
            </button>
          </li>
          <li v-if="filteredStudentsInOtherGroups.length === 0 && selectedSource" class="empty-msg">
            Aucun·e étudiant·e disponible dans cette source.
          </li>
        </ul>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import SearchIcon from '@/shared/assets/icon/SearchIcon.vue';

import { getGroupById, getAllGroupsBySemester, postGroupWithSemesterName, getGroupsByStudentId } from '../shared/fetchers/groups';
import { getStudentsByGroupId, getStudents } from '../shared/fetchers/students';
import { getSemesterById, getAllSemesters } from '../shared/fetchers/semesters';
import { postInscription, deleteInscriptionById, putInscriptionAndDeleteOldInscription, getInscriptions } from '../shared/fetchers/inscriptions';

const route = useRoute();
const router = useRouter();
const currentGroupId = parseInt(route.params.id);
const isNewGroup = computed(() => currentGroupId === 0);

const group = ref(null);
const semester = ref(null);
const studentsInGroup = ref([]);

// Pour la création de groupe
const allSemesters = ref([]);
const newGroupName = ref('');
const newGroupSemester = ref('');

const sourceGroups = ref([]);
const baseYearGroups = ref([]);
const selectedSource = ref('');
const studentsInRightList = ref([]);
const loadingRight = ref(false);

const searchQuery1 = ref('');
const searchQuery2 = ref('');

onMounted(async () => {
  if (isNewGroup.value) {
    allSemesters.value = await getAllSemesters();
  } else {
    await loadMainData();
  }
});

async function createNewGroup() {
  if (!newGroupName.value.trim() || !newGroupSemester.value) {
    alert("Veuillez remplir tous les champs.");
    return;
  }
  
  try {
    const semester = allSemesters.value.find(s => s.id === parseInt(newGroupSemester.value));
    const semesterName = semester ? semester.name : '';
    
    const createdGroup = await postGroupWithSemesterName(semesterName, newGroupName.value);
    alert(`✅ Groupe "${newGroupName.value}" créé avec succès !`);
    router.push(`/modification/groupe/${createdGroup.id}`);
  } catch (error) {
    console.error("Erreur lors de la création du groupe:", error);
    alert("❌ Erreur : " + (error.message || "Impossible de créer le groupe"));
  }
}

async function loadMainData() {
  if (!currentGroupId) return;

  try {
    group.value = await getGroupById(currentGroupId);
    semester.value = await getSemesterById(group.value.semester_id);

    const studentsIn = await getStudentsByGroupId(currentGroupId);
    studentsInGroup.value = studentsIn.map(s => ({ ...s, name: s.name }));

    const allGroupsInSemester = await getAllGroupsBySemester(group.value.semester_id);
    sourceGroups.value = allGroupsInSemester.filter(g => g.id !== parseInt(currentGroupId));
    
    // Groupes de base de l'année (L1S1, L1S2, etc.)
    const excludedGroupNames = ['L1S1', 'L1S2', 'L2S3', 'L2S4', 'L3S5', 'L3S6'];
    baseYearGroups.value = allGroupsInSemester.filter(g => 
      excludedGroupNames.includes(g.name) && g.id !== parseInt(currentGroupId)
    );

    if (selectedSource.value) {
      await loadRightList();
    }

  } catch (error) {
    console.error("Erreur chargement principal:", error);
  }
}


async function loadRightList() {
  if (!selectedSource.value) return;
  
  loadingRight.value = true;
  studentsInRightList.value = [];

  try {
    let rawStudents = [];
    
    if (selectedSource.value === 'no_extra_group') {
      // Étudiants sans groupe supplémentaire (seulement dans les groupes de base)
      const [allInscriptions, allStudents] = await Promise.all([
        getInscriptions(),
        getStudents()
      ]);
      
      const excludedGroupNames = ['L1S1', 'L1S2', 'L2S3', 'L2S4', 'L3S5', 'L3S6'];
      const baseGroupIds = sourceGroups.value
        .filter(g => excludedGroupNames.includes(g.name))
        .map(g => g.id);
      
      // Trouver les étudiants qui n'ont des inscriptions QUE dans les groupes de base
      const studentGroupCounts = {};
      allInscriptions.forEach(ins => {
        if (!studentGroupCounts[ins.student_id]) {
          studentGroupCounts[ins.student_id] = { base: 0, other: 0 };
        }
        if (baseGroupIds.includes(ins.group_id)) {
          studentGroupCounts[ins.student_id].base++;
        } else {
          studentGroupCounts[ins.student_id].other++;
        }
      });
      
      const studentIdsOnlyBase = Object.keys(studentGroupCounts)
        .filter(id => studentGroupCounts[id].other === 0)
        .map(id => parseInt(id));
      
      rawStudents = allStudents.filter(s => studentIdsOnlyBase.includes(s.id));
      
    } else {
      // Groupe spécifique
      const groupId = selectedSource.value;
      rawStudents = await getStudentsByGroupId(groupId);
    }
    
    // Enrichir avec les groupes de chaque étudiant
    const studentsWithGroups = await Promise.all(
      rawStudents.map(async (s) => {
        const groups = await getGroupsByStudentId(s.id);
        const excludedNames = ['L1S1', 'L1S2', 'L2S3', 'L2S4', 'L3S5', 'L3S6'];
        const extraGroups = groups.filter(g => !excludedNames.includes(g.name));
        
        return {
          ...s,
          name: s.name,
          groupNames: extraGroups.map(g => g.name)
        };
      })
    );
    
    studentsInRightList.value = studentsWithGroups;

  } catch (error) {
    console.error("Erreur chargement liste droite:", error);
  } finally {
    loadingRight.value = false;
  }
}


const filteredStudentsInGroup = computed(() => {
  return studentsInGroup.value
    .filter(s => s.name.toLowerCase().includes(searchQuery1.value.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));
});

const filteredStudentsInOtherGroups = computed(() => {
  const currentMemberIds = new Set(studentsInGroup.value.map(s => s.id));

  return studentsInRightList.value
    .filter(s => {
      if (currentMemberIds.has(s.id)) return false;
      return s.name.toLowerCase().includes(searchQuery2.value.toLowerCase());
    })
    .sort((a, b) => a.name.localeCompare(b.name));
});


async function deleteStudent(student) {
  if (!confirm(`Retirer ${student.name} du groupe ?`)) return;
  try {
    await deleteInscriptionById(student.id, currentGroupId);
    await loadMainData();
  } catch (e) {
    console.error(e);
    alert("Erreur suppression.");
  }
}


async function addStudent(student) {
  try {
    await postInscription(student.id, currentGroupId);
    await loadMainData();
  } catch (e) {
    console.error(e);
    alert("❌ Erreur lors de l'ajout de l'étudiant·e.");
  }
}
</script>

<style scoped>
@import url("../shared/shared.css");

.container {
  display: grid;
  grid-template-columns: 50% 50%;
  gap: 2rem;

}

/* Styles du Select */
.select-container {
  margin-bottom: 1rem;
  width: 100%; /* S'aligne avec la barre de recherche */
}

.group-select {
  width: 80%; /* Même largeur que search-container */
  padding: 0.7rem;
  border: 1px solid var(--color-3);
  border-radius: 8px;
  background-color: white;
  font-size: 1rem;
  color: black;
  outline: none;
  cursor: pointer;
}

.search-container {
  display: flex; align-items: center; background-color: white;
  border: 1px solid var(--color-3); border-radius: 8px;
  padding: 0.5rem 1rem; margin-bottom: 1rem; width: 80%;
}

.list {
  width: 80%;
}

.student-list-container {
  margin-bottom: 0;
  font-size: 1.15rem;
}

.students-list {
  list-style-type: none;
  border: solid lightgray;
  background-color: var(--color-6);
  border-radius: 5px;
  margin-bottom: 1rem;
  padding: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.student-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: flex-start;
}

.student-name {
  font-weight: bold;
  font-size: 1.15rem;
}

.student-groups {
  font-size: 0.8rem;
  color: #888;
  align-self: flex-start;
}

.student-group-number {
  font-size: 0.9rem;
  color: #666;
}

.action-buttons {
  display: flex;
  gap: 0.5rem; /* Espace entre les boutons */
}

.button {
  cursor: pointer;
  border: none;
  border-radius: 5px;
  width: 30px;
  height: 30px;
  color: white;
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 0;
}

.button:hover {
  opacity: 0.9;
}

.add-btn {
  background-color: #388e3c; /* Vert pour Ajouter */
}

.move-btn {
  background-color: rgb(218, 116, 14);
}

/* Bouton rouge pour la suppression (colonne de gauche) */
.left-container .button {
  background-color: rgb(255, 0, 0); 
}


.search-container {
  display: flex;
  align-items: center;
  background-color: white;
  border: 1px solid var(--color-3);
  border-radius: 8px;
  padding: 0.5rem 0.5rem;
  margin-bottom: 1rem;
}

.search-icon {
  width: 20px;
  height: 20px;
  color: var(--color-2);
  margin-right: 0.5rem;
  margin-top: 0.7rem;
}

.search-bar {
  border: none;
  outline: none;
  width: 100%;
  color: black;
  font-size: 1rem;
  margin-bottom: 0rem;
}

/* Styles pour le formulaire de création */
.create-form {
  max-width: 500px;
  padding: 2rem;
  background-color: var(--color-6);
  border-radius: 8px;
  border: 2px solid var(--color-3);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: var(--color-2);
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 2px solid var(--color-3);
  border-radius: 5px;
  box-sizing: border-box;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.form-actions .button {
  width: auto;
  padding: 0.75rem 1.5rem;
  height: auto;
}

.btn-cancel {
  background-color: var(--color-7) !important;
  color: white;
  text-decoration: none;
  display: inline-block;
}
</style>