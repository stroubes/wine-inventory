const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface WineMemory {
  id: string;
  wine_id: string;
  title: string;
  content: string;
  rating?: number; // 1-5 scale
  location?: string;
  date_experienced: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMemoryRequest {
  wine_id: string;
  title: string;
  content: string;
  rating?: number;
  location?: string;
  date_experienced?: string;
}

export interface UpdateMemoryRequest {
  title?: string;
  content?: string;
  rating?: number;
  location?: string;
  date_experienced?: string;
}

export interface MemoryStats {
  total_memories: number;
  average_rating: number;
  wines_with_memories: number;
  recent_memories: WineMemory[];
}

class MemoryApiService {
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  // Transform date strings to Date objects
  private transformMemory(memory: any): WineMemory {
    return {
      ...memory,
      date_experienced: new Date(memory.date_experienced).toISOString(),
      created_at: new Date(memory.created_at).toISOString(),
      updated_at: new Date(memory.updated_at).toISOString(),
    };
  }

  // Get all memories for a wine
  async getWineMemories(wineId: string): Promise<WineMemory[]> {
    const response = await fetch(`${API_BASE_URL}/api/memories/wine/${wineId}`);
    const memories = await this.handleResponse<WineMemory[]>(response);
    return memories.map(this.transformMemory);
  }

  // Get a specific memory
  async getMemory(memoryId: string): Promise<WineMemory> {
    const response = await fetch(`${API_BASE_URL}/api/memories/${memoryId}`);
    const memory = await this.handleResponse<WineMemory>(response);
    return this.transformMemory(memory);
  }

  // Create a new memory
  async createMemory(memoryData: CreateMemoryRequest): Promise<WineMemory> {
    const response = await fetch(`${API_BASE_URL}/api/memories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(memoryData),
    });

    const memory = await this.handleResponse<WineMemory>(response);
    return this.transformMemory(memory);
  }

  // Update a memory
  async updateMemory(memoryId: string, updates: UpdateMemoryRequest): Promise<WineMemory> {
    const response = await fetch(`${API_BASE_URL}/api/memories/${memoryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    const memory = await this.handleResponse<WineMemory>(response);
    return this.transformMemory(memory);
  }

  // Delete a memory
  async deleteMemory(memoryId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/memories/${memoryId}`, {
      method: 'DELETE',
    });

    return this.handleResponse<{ message: string }>(response);
  }

  // Get memory statistics
  async getMemoryStats(): Promise<MemoryStats> {
    const response = await fetch(`${API_BASE_URL}/api/memories/stats/summary`);
    const stats = await this.handleResponse<MemoryStats>(response);
    
    return {
      ...stats,
      recent_memories: stats.recent_memories.map(this.transformMemory)
    };
  }

  // Helper method to format rating as stars
  formatRating(rating?: number): string {
    if (!rating) return 'No rating';
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  // Helper method to format date for display
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Helper method to get relative time
  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffWeeks === 1) return '1 week ago';
    if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
    if (diffMonths === 1) return '1 month ago';
    if (diffMonths < 12) return `${diffMonths} months ago`;
    if (diffYears === 1) return '1 year ago';
    return `${diffYears} years ago`;
  }
}

export const memoryApi = new MemoryApiService();