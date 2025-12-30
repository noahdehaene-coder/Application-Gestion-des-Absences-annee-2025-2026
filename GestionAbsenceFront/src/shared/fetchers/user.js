// Fonction utilitaire pour obtenir les en-têtes d'authentification
function getAuthHeader() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

/**
 * Récupère l'utilisateur connecté en décodant le token stocké.
 * Retourne un objet { id, name, ... } ou null si pas connecté.
 */
export function getUser() {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        // On décode la partie "payload" du token JWT (le milieu de la chaîne)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload);
        
        // On retourne un objet utilisateur propre
        return {
            id: payload.sub || payload.id,      // L'ID de l'utilisateur
            name: payload.username || payload.name, // Le nom
            role: payload.role
        };
    } catch (error) {
        console.error("Erreur lors du décodage du token utilisateur :", error);
        return null;
    }
}

/**
 * Récupère la liste de tous les professeurs.
 */
export async function fetchProfessors() {
  try {
    const response = await fetch('http://localhost:3000/users/professors', {
      method: 'GET',
      headers: getAuthHeader() // Sécurisation
    });
    if (!response.ok) throw new Error('Erreur lors de la récupération des professeurs');
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

/**
 * Crée un nouveau professeur.
 */
export async function createProfessor(data) { // data = { name, email, password }
  try {
    const response = await fetch('http://localhost:3000/users/professor', {
      method: 'POST',
      headers: getAuthHeader(), // Sécurisation
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Erreur lors de la création du professeur');
    return await response.json();
  } catch (error) {
    console.error(error);
  }
}

/**
 * Supprime un professeur par son ID.
 */
export async function deleteProfessor(id) {
  try {
    const response = await fetch(`http://localhost:3000/users/professor/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader() // Sécurisation
    });
    if (!response.ok) throw new Error('Erreur lors de la suppression du professeur');
    return await response.json();
  } catch (error) {
    console.error(error);
  }
}