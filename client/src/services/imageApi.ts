const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface WineImage {
  id: string;
  wine_id: string;
  image_type: 'front_label' | 'back_label' | 'memory';
  filename: string;
  original_name: string;
  size: number;
  mime_type: string;
  alt_text?: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

export interface ImageUploadResponse {
  message: string;
  images: WineImage[];
}

class ImageApiService {
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  // Upload images for a wine
  async uploadWineImages(
    wineId: string, 
    files: File[], 
    imageType: 'front_label' | 'back_label' | 'memory' = 'memory'
  ): Promise<ImageUploadResponse> {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('images', file);
    });
    
    formData.append('imageType', imageType);

    const response = await fetch(`${API_BASE_URL}/api/images/wine/${wineId}`, {
      method: 'POST',
      body: formData,
    });

    return this.handleResponse<ImageUploadResponse>(response);
  }

  // Get all images for a wine
  async getWineImages(wineId: string): Promise<WineImage[]> {
    const response = await fetch(`${API_BASE_URL}/api/images/wine/${wineId}`);
    return this.handleResponse<WineImage[]>(response);
  }

  // Get image URL
  getImageUrl(imageId: string): string {
    return `${API_BASE_URL}/api/images/${imageId}`;
  }

  // Delete an image
  async deleteImage(imageId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/images/${imageId}`, {
      method: 'DELETE',
    });

    return this.handleResponse<{ message: string }>(response);
  }

  // Update image metadata
  async updateImage(
    imageId: string, 
    updates: { image_type?: string; alt_text?: string; description?: string }
  ): Promise<WineImage> {
    const response = await fetch(`${API_BASE_URL}/api/images/${imageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    return this.handleResponse<WineImage>(response);
  }

  // Helper method to categorize images by type
  categorizeImages(images: WineImage[]) {
    return {
      frontLabel: images.filter(img => img.image_type === 'front_label'),
      backLabel: images.filter(img => img.image_type === 'back_label'),
      memories: images.filter(img => img.image_type === 'memory'),
    };
  }
}

export const imageApi = new ImageApiService();