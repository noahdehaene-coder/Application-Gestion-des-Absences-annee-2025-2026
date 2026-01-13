const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

/**
 * Récupère les préférences de matières du professeur connecté
 */
export async function getMyPreferences() {
  try {
    const response = await fetch(`${API_URL}/preferences/my-preferences`, {
      method: 'GET',
      headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Erreur lors de la récupération des préférences');
    return await response.json();
  } catch (error) {
    console.error('Erreur préférences:', error);
    return [];
  }
}

/**
 * Sauvegarde les préférences de matières du professeur
 */
export async function saveMyPreferences(courseMaterialIds) {
  try {
    const response = await fetch(`${API_URL}/preferences/my-preferences`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ courseMaterialIds })
    });
    if (!response.ok) throw new Error('Erreur lors de la sauvegarde des préférences');
    return await response.json();
  } catch (error) {
    console.error('Erreur sauvegarde préférences:', error);
    throw error;
  }
}

/**
 * Ajoute une matière aux préférences
 */
export async function addPreference(courseMaterialId) {
  try {
    const response = await fetch(`${API_URL}/preferences/add/${courseMaterialId}`, {
      method: 'POST',
      headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Erreur lors de l\'ajout de la préférence');
    return await response.json();
  } catch (error) {
    console.error('Erreur ajout préférence:', error);
    throw error;
  }
}

/**
 * Retire une matière des préférences
 */
export async function removePreference(courseMaterialId) {
  try {
    const response = await fetch(`${API_URL}/preferences/remove/${courseMaterialId}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Erreur lors de la suppression de la préférence');
    return await response.json();
  } catch (error) {
    console.error('Erreur suppression préférence:', error);
    throw error;
  }
}
