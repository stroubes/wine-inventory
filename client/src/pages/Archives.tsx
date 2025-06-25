import React, { useState, useEffect } from 'react';
import { CalendarIcon, MapPinIcon, StarIcon, EyeIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { wineApi } from '../services/api';
import type { Wine } from '../types/wine';
import { memoryApi, type WineMemory } from '../services/memoryApi';
import { imageApi, type WineImage } from '../services/imageApi';

interface ArchivedWine extends Wine {
  memories?: WineMemory[];
  images?: WineImage[];
}

const Archives: React.FC = () => {
  const [archivedWines, setArchivedWines] = useState<ArchivedWine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'consumed_at' | 'name' | 'rating'>('consumed_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedWine, setSelectedWine] = useState<ArchivedWine | null>(null);

  useEffect(() => {
    loadArchivedWines();
  }, []);

  const loadArchivedWines = async () => {
    try {
      setLoading(true);
      const response = await wineApi.getWines({ consumption_status: 'Consumed' });
      
      // Get consumed wines from response
      const consumedWines = response.wines;
      
      // Load memories and images for each consumed wine
      const archivedWinesWithData = await Promise.all(
        consumedWines.map(async (wine) => {
          try {
            const [memories, images] = await Promise.all([
              memoryApi.getWineMemories(wine.id).catch(() => []),
              imageApi.getWineImages(wine.id).catch(() => [])
            ]);
            
            return {
              ...wine,
              memories,
              images
            };
          } catch (err) {
            console.error(`Failed to load data for wine ${wine.id}:`, err);
            return { ...wine, memories: [], images: [] };
          }
        })
      );
      
      setArchivedWines(archivedWinesWithData);
    } catch (err) {
      setError('Failed to load archived wines');
      console.error('Load archived wines error:', err);
    } finally {
      setLoading(false);
    }
  };

  const restoreWine = async (_wineId: string) => {
    if (!confirm('Are you sure you want to restore this wine to your active collection?')) {
      return;
    }

    try {
      // Note: You'd need to add a restore endpoint to the API
      // For now, we'll just reload the data
      await loadArchivedWines();
    } catch (err) {
      console.error('Restore wine error:', err);
    }
  };

  const sortWines = (wines: ArchivedWine[]) => {
    return [...wines].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'consumed_at':
          comparison = new Date(a.date_consumed || '').getTime() - new Date(b.date_consumed || '').getTime();
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'rating':
          comparison = (a.rating || 0) - (b.rating || 0);
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating?: number) => {
    if (!rating) return <span className="text-gray-400">No rating</span>;
    
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`h-4 w-4 ${
              star <= Math.floor(rating / 20) ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating}/100)</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wine-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  // Wine detail modal
  if (selectedWine) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-serif font-bold text-gray-900">
            {selectedWine.name}
          </h1>
          <button
            onClick={() => setSelectedWine(null)}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back to Archives
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Wine Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-900">Wine Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Vineyard:</span>
                    <span className="ml-2 text-gray-900">{selectedWine.vineyard}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Region:</span>
                    <span className="ml-2 text-gray-900">{selectedWine.region}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Vintage:</span>
                    <span className="ml-2 text-gray-900">{selectedWine.vintage_year || 'NV'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <span className="ml-2 text-gray-900">{selectedWine.color}</span>
                  </div>
                  {selectedWine.date_consumed && (
                    <div>
                      <span className="text-gray-500">Consumed:</span>
                      <span className="ml-2 text-gray-900">{formatDate(selectedWine.date_consumed.toString())}</span>
                    </div>
                  )}
                  {selectedWine.rack_slot && (
                    <div>
                      <span className="text-gray-500">Last Location:</span>
                      <span className="ml-2 text-gray-900">{selectedWine.rack_slot}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedWine.rating && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Rating</h4>
                  {renderStars(selectedWine.rating)}
                </div>
              )}

              {selectedWine.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                  <p className="text-gray-600 text-sm">{selectedWine.description}</p>
                </div>
              )}

              {selectedWine.personal_notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Personal Notes</h4>
                  <p className="text-gray-600 text-sm">{selectedWine.personal_notes}</p>
                </div>
              )}

              <button
                onClick={() => restoreWine(selectedWine.id)}
                className="btn-secondary"
              >
                Restore to Collection
              </button>
            </div>

            {/* Images */}
            <div className="space-y-4">
              {selectedWine.images && selectedWine.images.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Images</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedWine.images.map((image) => (
                      <div key={image.id} className="relative">
                        <img
                          src={imageApi.getImageUrl(image.id)}
                          alt={image.original_name}
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                          {image.image_type.replace('_', ' ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Memories */}
          {selectedWine.memories && selectedWine.memories.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Memories ({selectedWine.memories.length})
              </h4>
              <div className="space-y-4">
                {selectedWine.memories.map((memory) => (
                  <div key={memory.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-medium text-gray-900">{memory.title}</h5>
                      <span className="text-sm text-gray-500">
                        {formatDate(memory.date_experienced)}
                      </span>
                    </div>
                    {memory.rating && (
                      <div className="mb-2">
                        <span className="text-sm text-gray-600">Experience: </span>
                        {memoryApi.formatRating(memory.rating)}
                      </div>
                    )}
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">
                      {memory.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const sortedWines = sortWines(archivedWines);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Wine Archives</h1>
          <p className="text-gray-600 mt-1">
            Your consumed wine collection and memories ({archivedWines.length} wines)
          </p>
        </div>
      </div>

      {archivedWines.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No archived wines</h3>
          <p className="text-gray-600">
            Wines that you mark as consumed will appear here with their memories and photos.
          </p>
        </div>
      ) : (
        <>
          {/* Sort Controls */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm border-gray-300 rounded-md focus:ring-wine-600 focus:border-wine-600"
              >
                <option value="consumed_at">Date Consumed</option>
                <option value="name">Wine Name</option>
                <option value="rating">Rating</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="text-sm border-gray-300 rounded-md focus:ring-wine-600 focus:border-wine-600"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>

          {/* Archives Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedWines.map((wine) => (
              <div key={wine.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                {/* Wine Image */}
                <div 
                  className="aspect-video bg-gray-100 relative cursor-pointer"
                  onClick={() => setSelectedWine(wine)}
                >
                  {wine.images && wine.images.length > 0 ? (
                    <img
                      src={imageApi.getImageUrl(wine.images[0].id)}
                      alt={wine.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PhotoIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Image count overlay */}
                  {wine.images && wine.images.length > 1 && (
                    <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                      +{wine.images.length - 1} more
                    </div>
                  )}
                </div>

                {/* Wine Info */}
                <div className="p-4 cursor-pointer" onClick={() => setSelectedWine(wine)}>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {wine.name}
                    </h3>
                    <span className="text-sm text-gray-500 ml-2">
                      {wine.vintage_year || 'NV'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {wine.vineyard} • {wine.region}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    {wine.date_consumed && (
                      <span className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {formatDate(wine.date_consumed.toString())}
                      </span>
                    )}
                    {wine.rack_slot && (
                      <span className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {wine.rack_slot}
                      </span>
                    )}
                  </div>

                  {wine.rating && (
                    <div className="mb-3">
                      {renderStars(wine.rating)}
                    </div>
                  )}

                  {/* Memories count */}
                  {wine.memories && wine.memories.length > 0 && (
                    <div className="mb-3">
                      <span className="text-sm text-wine-600">
                        {wine.memories.length} memor{wine.memories.length === 1 ? 'y' : 'ies'}
                      </span>
                    </div>
                  )}

                  <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedWine(wine)}
                      className="flex items-center px-3 py-1 text-sm bg-wine-100 text-wine-700 rounded hover:bg-wine-200"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View Details
                    </button>
                    <button
                      onClick={() => restoreWine(wine.id)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Restore
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Archives;