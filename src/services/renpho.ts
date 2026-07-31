export interface RenphoMeasurement {
  timestamp: string;
  date: string;
  weight_kg: number;
  body_fat_percent: number;
  muscle_mass_kg: number;
  bmi: number;
  water_percent: number;
  visceral_fat: number;
  metabolic_age: number;
  bone_mass_kg: number;
  bmr: number;
}

export interface RenphoData {
  last_updated: string;
  is_sample_data: boolean;
  measurements: RenphoMeasurement[];
}

export const renphoService = {
  async getRenphoData(): Promise<RenphoData | null> {
    try {
      // 1. Intentar consultar endpoint live en Vercel Serverless Function
      const apiResponse = await fetch('/api/renpho');
      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        if (apiData && apiData.measurements && apiData.measurements.length > 0) {
          return apiData;
        }
      }
    } catch (e) {
      console.warn('API /api/renpho no disponible, usando fallback local...');
    }

    try {
      // 2. Fallback a archivo JSON estático sincronizado
      const response = await fetch('/renpho_data.json?t=' + Date.now());
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const data: RenphoData = await response.json();
      return data;
    } catch (error) {
      console.error('Error cargando datos de Renpho:', error);
      return null;
    }
  }
};
