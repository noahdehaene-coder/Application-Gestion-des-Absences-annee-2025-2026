<template>
  <nav class="navigation-bar">
    
    <a @click="goHome" class="title-navigation-bar" style="cursor: pointer;">
      Gestion des Absences MIASHS
    </a>
    
    <div class="navigation-router-link" v-if="isAuthenticated && userRole === 'GESTIONNAIRE'">
      <RouterLink to="/recapitulatifs" class="summary-navigation">Voir le récapitulatif des absences</RouterLink>
      <RouterLink to="/selection/etudiant" class="modification-navigation">Modifier étudiant.e</RouterLink>
      <RouterLink to="/selection/groupe" class="modification-navigation">Modifier groupe</RouterLink>
      
      <button @click="handleLogout" class="button logout-button">Déconnexion</button>
    </div>

    <div class="navigation-router-link" v-else-if="isAuthenticated">
       <button @click="handleLogout" class="button logout-button">Déconnexion</button>
    </div>

    </nav>
</template>

<script setup>
import { RouterLink, useRouter } from 'vue-router';


import { computed } from 'vue';
import { useAuth } from '../../store/auth'; 
const router = useRouter();
const auth = useAuth();

const isAuthenticated = computed(() => auth.isAuthenticated.value);
const userRole = computed(() => auth.userRole.value);


/**
 * Redirige vers la page d'accueil (tableau de bord selon le rôle).
 */
function goHome() {
  if (userRole.value === 'GESTIONNAIRE') {
    router.push({ name: 'AdminDashboard' });
  } else {
    router.push({ name: 'ProfessorDashboard' });
  }
}

/**
 * Déconnecte l'utilisateur et le redirige vers la page de connexion.
 */
function handleLogout() {
  auth.logout();
  router.push({ name: 'Login' });
}
</script>


<style>

@import url("../shared.css");

/* Style pour la barre de navigation */
.navigation-bar {
  background-color: var(--color-2);
  padding: 10rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0;
  padding: 1rem;
  padding-top: 1.25rem;
  padding-bottom: 1.25rem;
}

/*Style pour le titre de la barre de navigation */
.title-navigation-bar {
  text-decoration: none;
  font-size: 1.6rem;
  margin: 0;
  color: white;
}

/* Conteneur pour les RouterLink pour les mettre à droite */
.navigation-router-link {
  display: flex;
  gap: 0.7rem;
  align-items: stretch;
}

/* Style commun pour TOUS les boutons (liens et button) */
.summary-navigation,
.modification-navigation,
.students-management,
.drop-down-btn,
.logout-button {
  text-decoration: none;
  color: black;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  font-family: inherit;
  
  display: flex;         
  align-items: center;
  justify-content: center;
  box-sizing: border-box; 
  min-width: 140px;        
  text-align: center;      
  line-height: 1.2;        
}

.summary-navigation,
.drop-down-btn {
  background-color: var(--color-1);
}

.modification-navigation,
.students-management {
  background-color: var(--color-4);
}

.logout-button {
  background-color: var(--color-4);
  transition: all 0.15s ease;
}

/* Effet au survol */
.title-navigation-bar:hover {
  color: var(--color-4);
}

.summary-navigation:hover,
.modification-navigation:hover,
.students-management:hover,
.drop-down-btn:hover {
  background-color: var(--color-5);
}

.logout-button:hover,
.logout-button:focus {
  background-color: var(--color-5);
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  outline: 2px solid #254e70ff;
  outline-offset: 2px;
}
</style>