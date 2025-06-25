import axios from 'axios';
import type { 
  Wine, 
  WineListResponse, 
  WineStatistics, 
  CreateWineRequest, 
  UpdateWineRequest, 
  WineSearchFilters 
} from '../types/wine';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to transform date strings to Date objects
api.interceptors.response.use((response) => {
  if (response.data) {
    response.data = transformDates(response.data);
  }
  return response;
});

// Helper function to transform date strings to Date objects
function transformDates(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    // Check if string looks like an ISO date
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj)) {
      return new Date(obj);
    }
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(transformDates);
  }
  
  if (typeof obj === 'object') {
    const transformed: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key.includes('date') || key.includes('_at')) {
        transformed[key] = value ? new Date(value as string) : value;
      } else {
        transformed[key] = transformDates(value);
      }
    }
    return transformed;
  }
  
  return obj;
}

export const wineApi = {
  // Get all wines with optional filtering and pagination
  getWines: async (filters?: WineSearchFilters, page = 1, limit = 20): Promise<WineListResponse> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    const response = await api.get(`/wines?${params.toString()}`);
    return response.data;
  },

  // Get wine statistics
  getWineStatistics: async (): Promise<WineStatistics> => {
    const response = await api.get('/wines/statistics');
    return response.data;
  },

  // Get a specific wine by ID
  getWine: async (id: string): Promise<Wine> => {
    const response = await api.get(`/wines/${id}`);
    return response.data;
  },

  // Create a new wine
  createWine: async (wineData: CreateWineRequest): Promise<Wine> => {
    const response = await api.post('/wines', wineData);
    return response.data;
  },

  // Update a wine
  updateWine: async (id: string, updates: UpdateWineRequest): Promise<Wine> => {
    const response = await api.put(`/wines/${id}`, updates);
    return response.data;
  },

  // Mark wine as consumed
  markWineConsumed: async (id: string, consumedDate?: Date): Promise<Wine> => {
    const response = await api.post(`/wines/${id}/consume`, {
      consumed_date: consumedDate?.toISOString()
    });
    return response.data;
  },

  // Delete a wine
  deleteWine: async (id: string): Promise<void> => {
    await api.delete(`/wines/${id}`);
  },

  // Search external wine databases
  searchExternalWines: async (query: string, vintage?: number, region?: string, limit?: number): Promise<{
    results: any[];
    query: string;
    count: number;
  }> => {
    const params = new URLSearchParams();
    params.append('q', query);
    if (vintage) params.append('vintage', vintage.toString());
    if (region) params.append('region', region);
    if (limit) params.append('limit', limit.toString());
    
    const response = await api.get(`/wines/search-external?${params.toString()}`);
    return response.data;
  },

  // Get food pairing suggestions for a wine
  getFoodPairings: async (wineId: string): Promise<{
    wine_id: string;
    wine_name: string;
    suggestions: string[];
  }> => {
    const response = await api.get(`/wines/${wineId}/food-pairings`);
    return response.data;
  },

  // Auto-populate wine details from external APIs
  autoPopulateWine: async (wineId: string): Promise<{
    message: string;
    populated: boolean;
    updated_fields?: string[];
    wine?: Wine;
    source?: string;
  }> => {
    const response = await api.post(`/wines/${wineId}/auto-populate`);
    return response.data;
  },

  // Get wine API service statistics
  getApiStats: async (): Promise<{ count: number; lastRequest: Date }> => {
    const response = await api.get('/wines/api-stats');
    return response.data;
  },

  // Health check
  healthCheck: async (): Promise<{ status: string; message: string }> => {
    const response = await api.get('/health');
    return response.data;
  }
};

export default api;