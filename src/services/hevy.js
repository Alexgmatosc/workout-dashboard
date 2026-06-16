
const BASE_URL = '/hevy-api';

export const hevyService = {
  async getRecentWorkouts(page = 1, pageSize = 10) {
    try {
      const response = await fetch(`${BASE_URL}/v1/workouts?page=${page}&page_size=${pageSize}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Error en la API de Hevy: ${response.status}`);
      }

      const data = await response.json();
      // Retornamos el array de entrenamientos (la API suele paginar con { workouts: [...] })
      return data.workouts || data; 
    } catch (error) {
      console.error("Error al obtener entrenamientos de Hevy:", error);
      return [];
    }
  }
};