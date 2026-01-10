<template>
  <div class="hierarchical-selector">
    <div 
      class="selector-header" 
      @click="toggleDropdown" 
      @keydown="handleSelectorKeyDown"
      :class="{ disabled: disabled }"
      :tabindex="disabled ? -1 : 0"
      role="button"
      :aria-expanded="isOpen"
    >
      <span class="selected-value">{{ displayText }}</span>
      <span class="arrow" :class="{ open: isOpen }">▼</span>
    </div>
    
    <div v-if="isOpen && !disabled" class="dropdown-content">
      <div v-for="(year, yearIndex) in yearGroups" :key="year.name" class="year-group">
        <div 
          class="year-header" 
          :class="{ focused: isFocused(flatItems.findIndex(item => item.type === 'year' && item.name === year.name)) }"
          @click="toggleYear(year.name)"
        >
          <span class="year-arrow" :class="{ open: openYears.includes(year.name) }">▶</span>
          <span class="year-label">{{ year.name }}</span>
        </div>
        
        <div v-if="openYears.includes(year.name)" class="groups-list">
          <div 
            v-for="(group, groupIndex) in year.groups" 
            :key="group.id" 
            class="group-item"
            :class="{ 
              selected: modelValue === group.id,
              focused: isFocused(flatItems.findIndex(item => item.type === 'group' && item.data?.id === group.id))
            }"
            @click="selectGroup(group)"
          >
            {{ group.name }}
          </div>
        </div>
      </div>
      
      <div v-if="yearGroups.length === 0" class="no-groups">
        Aucun groupe disponible
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';

const props = defineProps({
  groups: {
    type: Array,
    required: true
  },
  modelValue: {
    type: Number,
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  },
  placeholder: {
    type: String,
    default: '-- Choisir un groupe --'
  }
});

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(false);
const openYears = ref([]);
const focusedIndex = ref(-1);
const flatItems = ref([]);

// Organiser les groupes par année (L1, L2, L3) en fonction du semestre
const yearGroups = computed(() => {
  if (!props.groups || props.groups.length === 0) return [];
  
  // Filtrer les groupes de base année (L1S1, L2S2, etc.) car ils sont pour les CM
  const tdGroups = props.groups.filter(g => !/^[LM]\d+S\d+$/i.test(g.name));
  
  // Grouper par année en fonction du nom du semestre
  const grouped = {};
  
  tdGroups.forEach(group => {
    // Déterminer l'année à partir du semestre
    let year = 'Autres';
    
    // Le backend renvoie group_semester
    const semesterName = group.group_semester?.name || group.semester?.name;
    
    if (semesterName) {
      // S1 ou S2 → L1, S3 ou S4 → L2, S5 ou S6 → L3
      if (semesterName === 'S1' || semesterName === 'S2') {
        year = 'L1';
      } else if (semesterName === 'S3' || semesterName === 'S4') {
        year = 'L2';
      } else if (semesterName === 'S5' || semesterName === 'S6') {
        year = 'L3';
      }
    }
    
    if (!grouped[year]) {
      grouped[year] = [];
    }
    grouped[year].push(group);
  });
  
  // Convertir en tableau et trier
  const result = Object.keys(grouped)
    .sort((a, b) => {
      // Tri personnalisé : L1, L2, L3, puis "Autres"
      const order = { 'L1': 1, 'L2': 2, 'L3': 3, 'Autres': 999 };
      return (order[a] || 998) - (order[b] || 998);
    })
    .map(yearName => ({
      name: yearName,
      groups: grouped[yearName].sort((a, b) => a.name.localeCompare(b.name))
    }));
  
  return result;
});

// Texte à afficher
const displayText = computed(() => {
  if (!props.modelValue) return props.placeholder;
  const group = props.groups.find(g => g.id === props.modelValue);
  return group ? group.name : props.placeholder;
});

// Construire une liste plate des éléments pour la navigation au clavier
function buildFlatList() {
  const items = [];
  yearGroups.value.forEach(year => {
    items.push({ type: 'year', name: year.name });
    if (openYears.value.includes(year.name)) {
      year.groups.forEach(group => {
        items.push({ type: 'group', data: group, year: year.name });
      });
    }
  });
  flatItems.value = items;
}

function toggleDropdown() {
  if (!props.disabled) {
    isOpen.value = !isOpen.value;
    if (isOpen.value) {
      focusedIndex.value = -1;
      buildFlatList();
    }
  }
}

// Gestion des touches sur le header du sélecteur
function handleSelectorKeyDown(event) {
  switch(event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault();
      if (!isOpen.value) {
        isOpen.value = true;
        buildFlatList();
        focusedIndex.value = -1;
      }
      break;
      
    case 'ArrowDown':
      event.preventDefault();
      if (!isOpen.value) {
        // Ouvrir et entrer directement dans la liste
        isOpen.value = true;
        buildFlatList();
        focusedIndex.value = 0;
        nextTick(() => scrollToFocused());
      }
      break;
      
    case 'ArrowUp':
      event.preventDefault();
      if (!isOpen.value) {
        // Ouvrir et aller au dernier élément
        isOpen.value = true;
        buildFlatList();
        focusedIndex.value = flatItems.value.length - 1;
        nextTick(() => scrollToFocused());
      }
      break;
  }
}

function toggleYear(yearName) {
  const index = openYears.value.indexOf(yearName);
  if (index > -1) {
    openYears.value.splice(index, 1);
  } else {
    openYears.value.push(yearName);
  }
  buildFlatList();
}

function selectGroup(group) {
  emit('update:modelValue', group.id);
  isOpen.value = false;
}

// Navigation au clavier
function handleKeyDown(event) {
  if (!isOpen.value) return;
  
  switch(event.key) {
    case 'ArrowDown':
      event.preventDefault();
      if (focusedIndex.value === -1) {
        // Première pression : entrer dans la liste
        focusedIndex.value = 0;
      } else {
        focusedIndex.value = Math.min(focusedIndex.value + 1, flatItems.value.length - 1);
      }
      scrollToFocused();
      break;
      
    case 'ArrowUp':
      event.preventDefault();
      if (focusedIndex.value > 0) {
        focusedIndex.value = Math.max(focusedIndex.value - 1, 0);
        scrollToFocused();
      }
      break;
      
    case 'ArrowRight':
      event.preventDefault();
      if (focusedIndex.value >= 0) {
        const item = flatItems.value[focusedIndex.value];
        if (item.type === 'year' && !openYears.value.includes(item.name)) {
          toggleYear(item.name);
        }
      }
      break;
      
    case 'ArrowLeft':
      event.preventDefault();
      if (focusedIndex.value >= 0) {
        const item = flatItems.value[focusedIndex.value];
        if (item.type === 'year' && openYears.value.includes(item.name)) {
          toggleYear(item.name);
        }
      }
      break;
      
    case 'Enter':
      event.preventDefault();
      if (focusedIndex.value >= 0) {
        const item = flatItems.value[focusedIndex.value];
        if (item.type === 'year') {
          toggleYear(item.name);
        } else if (item.type === 'group') {
          selectGroup(item.data);
        }
      }
      break;
      
    case 'Escape':
      event.preventDefault();
      isOpen.value = false;
      break;
  }
}

function scrollToFocused() {
  nextTick(() => {
    const focusedElement = document.querySelector('.hierarchical-selector .focused');
    if (focusedElement) {
      focusedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });
}

function isFocused(itemIndex) {
  return focusedIndex.value === itemIndex;
}

// Fermer le dropdown si on clique en dehors
function handleClickOutside(event) {
  const selector = event.target.closest('.hierarchical-selector');
  if (!selector) {
    isOpen.value = false;
  }
}

// Ajouter/retirer l'écouteur de clic
watch(isOpen, (newValue) => {
  if (newValue) {
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
  } else {
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('keydown', handleKeyDown);
    openYears.value = [];
    focusedIndex.value = -1;
  }
});
</script>

<style scoped>
.hierarchical-selector {
  position: relative;
  width: 100%;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  outline: none;
}

.selector-header:hover:not(.disabled) {
  border-color: #254e70ff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.selector-header:focus:not(.disabled) {
  border-color: #254e70ff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  outline: 2px solid #254e70ff;
  outline-offset: 2px;
}

.selector-header.disabled {
  background: #f5f5f5;
  cursor: not-allowed;
  color: #999;
}

.selected-value {
  flex: 1;
  color: #333;
}

.arrow {
  transition: transform 0.2s;
  font-size: 12px;
  color: #666;
}

.arrow.open {
  transform: rotate(180deg);
}

.dropdown-content {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
}

.year-group {
  border-bottom: 1px solid #eee;
}

.year-group:last-child {
  border-bottom: none;
}

.year-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 15px;
  background: #f8f9fa;
  cursor: pointer;
  font-weight: 600;
  color: #254e70ff;
  transition: background 0.2s;
}

.year-header:hover {
  background: #e9ecef;
}

.year-header.focused {
  background: #d4e3f0;
  outline: 2px solid #254e70ff;
  outline-offset: -2px;
}

.year-arrow {
  transition: transform 0.2s;
  font-size: 10px;
}

.year-arrow.open {
  transform: rotate(90deg);
}

.year-label {
  font-size: 15px;
}

.groups-list {
  background: white;
}

.group-item {
  padding: 10px 15px 10px 40px;
  cursor: pointer;
  transition: all 0.2s;
  color: #333;
}

.group-item:hover {
  background: #f0f7ff;
  color: #254e70ff;
}

.group-item.focused {
  background: #d4e3f0;
  color: #254e70ff;
  outline: 2px solid #254e70ff;
  outline-offset: -2px;
}

.group-item.selected {
  background: #254e70ff;
  color: white;
  font-weight: 500;
}

.no-groups {
  padding: 20px;
  text-align: center;
  color: #999;
  font-style: italic;
}
</style>
