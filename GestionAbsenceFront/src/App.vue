<template>
  <NavigationBar />
  
  <div class="main-layout-container">
    <Breadcrumb :steps="breadcrumbSteps" />
    <RouterView />
  </div>
  
</template>


<script setup>
import Breadcrumb from './shared/components/Breadcrumb.vue';
import NavigationBar from './shared/components/NavigationBar.vue';
import { RouterView, useRoute } from 'vue-router';
import { computed } from 'vue';

const route = useRoute();

//Toutes les localisations possibles pour le fil d'Ariane :
const breadcrumbSteps = computed(() => {
  const name = route.name

  switch (name) {
    case 'Slot':
      return [
        { label: 'Accueil', to: null }
      ]

    case 'CreateCallPage':
      return [
        { label: 'Accueil', to: '/' },
        { label: 'Création d\'un appel', to: null }
      ]  

    case 'SelectGroupCall':
      return [
        { label: 'Accueil', to: '/' },
        { label: 'Groupe du créneau', to: null }
      ]

    case 'CallPage':
      return [
        { label: 'Accueil', to: '/' },
        { label: 'Création d\'un appel', to: '/call/new' },
        { label: 'Appel', to: null }
      ]

    case 'Summary':
      return [
        { label: 'Accueil', to: '/' },
        { label: 'Récapitulatif des absences', to: null }
      ]

    case 'CourseSummary':
      return [
        { label: 'Accueil', to: '/' },
        { label: 'Récapitulatif des absences', to: '/recapitulatifs' },
        { label: 'Récap. matière', to: null }
      ]

    case 'StudentSummary':
      return [
        { label: 'Accueil', to: '/' },
        { label: 'Récapitulatif des absences', to: '/recapitulatifs' },
        { label: 'Récap. étudiant.e', to: null }
      ]

    case 'SelectStudentModification':
      return [
        { label: 'Accueil', to: '/' },
        { label: 'Sélection étudiant.e à modifier', to: null }
      ]

    case 'StudentModification':
      return [
        { label: 'Accueil', to: '/' },
        { label: 'Sélection étudiant.e à modifier', to: '/selection/etudiant' },
        { label: 'Modification d’un.e étudiant.e', to: null }
      ]

    case 'SelectGroupModification':
      return [
        { label: 'Accueil', to: '/' },
        { label: 'Sélection groupe à modifier', to: null }
      ]

    case 'GroupModification':
      return [
        { label: 'Accueil', to: '/' },
        { label: 'Sélection groupe à modifier', to: '/selection/groupe' },
        { label: 'Modification d’un groupe', to: null }
      ]

    case 'ManageProfessors':
      return [
        { label: 'Accueil', to: '/' },
        { label: 'Gestion des professeurs', to: null }
      ]  

    case 'StudentsManagement':
      return [
        { label: 'Accueil', to: '/' },
        { label: 'Gestion des données des étudiant.e.s', to: null }
      ]

    default:
      return []
  }
})
</script>

<style>
.main-layout-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  box-sizing: border-box;
}
</style>