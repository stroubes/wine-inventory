import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { wineApi } from '../services/api';
import { imageApi } from '../services/imageApi';
import type { Wine } from '../types/wine';
import type { WineImage } from '../services/imageApi';
import ConsumptionTracker from '../components/ConsumptionTracker';

const WineDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [wine, setWine] = useState<Wine | null>(null);
  const [images, setImages] = useState<WineImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchWine = async () => {
      if (!id) {
        setError('Wine ID is required');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const wineData = await wineApi.getWine(id);
        setWine(wineData);
      } catch (err: any) {
        console.error('Error fetching wine:', err);
        setError(err.response?.data?.message || 'Failed to load wine. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWine();
  }, [id]);

  useEffect(() => {
    const fetchImages = async () => {
      if (!id) return;

      try {
        setIsLoadingImages(true);
        const wineImages = await imageApi.getWineImages(id);
        setImages(wineImages);
      } catch (err: any) {
        console.error('Error fetching wine images:', err);
      } finally {
        setIsLoadingImages(false);
      }
    };

    fetchImages();
  }, [id]);

  const handleEdit = () => {
    navigate(`/wines/${id}/edit`);
  };

  const handleAddMemory = () => {
    navigate(`/memories/add?wineId=${id}`);
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      setIsDeleting(true);
      await wineApi.deleteWine(id);
      navigate('/wines');
    } catch (err: any) {
      console.error('Error deleting wine:', err);
      setError(err.response?.data?.message || 'Failed to delete wine. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };


  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Consumed': return 'bg-red-100 text-red-800';
      case 'Reserved': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getColorBadge = (color: string) => {
    const colorMap = {
      'Red': 'bg-red-100 text-red-800',
      'White': 'bg-yellow-50 text-yellow-800',
      'Rosé': 'bg-pink-100 text-pink-800',
      'Sparkling': 'bg-blue-100 text-blue-800',
      'Dessert': 'bg-purple-100 text-purple-800',
      'Fortified': 'bg-amber-100 text-amber-800'
    };
    return colorMap[color as keyof typeof colorMap] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !wine) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Wine Detail</h1>
          <p className="text-gray-600">Unable to load wine information</p>
        </div>
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => navigate('/wines')}
                  className="text-sm font-medium text-red-800 hover:text-red-600"
                >
                  ← Back to Wine List
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!wine) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Wine Detail</h1>
          <p className="text-gray-600">Wine not found</p>
        </div>
        <div className="text-center">
          <button
            onClick={() => navigate('/wines')}
            className="text-wine-600 hover:text-wine-700 font-medium"
          >
            ← Back to Wine List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">{wine.name}</h1>
          <p className="text-gray-600">{wine.vineyard} • {wine.region}</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleAddMemory}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-wine-600 hover:bg-wine-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wine-500"
          >
            <PlusIcon className="h-4 w-4 mr-1.5" />
            Add Memory
          </button>
          <button
            onClick={handleEdit}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wine-600"
          >
            <PencilIcon className="h-4 w-4 mr-1.5" />
            Edit
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <TrashIcon className="h-4 w-4 mr-1.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wine Information */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Wine Information</h2>
        </div>
        <div className="px-6 py-4">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Wine Color</dt>
              <dd className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColorBadge(wine.color)}`}>
                  {wine.color}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(wine.consumption_status)}`}>
                  {wine.consumption_status}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Vintage Year</dt>
              <dd className="mt-1 text-sm text-gray-900">{wine.vintage_year || 'Not specified'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Price</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {wine.price ? `${wine.currency} ${wine.price.toFixed(2)}` : 'Not specified'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Rating</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {wine.rating ? `${wine.rating}/100` : 'Not rated'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Rack Slot</dt>
              <dd className="mt-1 text-sm text-gray-900">{wine.rack_slot || 'Not assigned'}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Grape Varieties</dt>
              <dd className="mt-1">
                <div className="flex flex-wrap gap-2">
                  {wine.grape_varieties.map((variety, index) => (
                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-wine-100 text-wine-800">
                      {variety}
                    </span>
                  ))}
                </div>
              </dd>
            </div>
            {wine.food_pairings && wine.food_pairings.length > 0 && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Food Pairings</dt>
                <dd className="mt-1">
                  <div className="flex flex-wrap gap-2">
                    {wine.food_pairings.map((pairing, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {pairing}
                      </span>
                    ))}
                  </div>
                </dd>
              </div>
            )}
            {wine.description && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900">{wine.description}</dd>
              </div>
            )}
            {wine.personal_notes && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Personal Notes</dt>
                <dd className="mt-1 text-sm text-gray-900">{wine.personal_notes}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">Date Added</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(wine.date_added)}</dd>
            </div>
            {wine.date_consumed && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Date Consumed</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(wine.date_consumed)}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Images and Consumption Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Wine Images */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Wine Images</h2>
            </div>
            <div className="px-6 py-4">
              {isLoadingImages ? (
                <div className="animate-pulse">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="h-48 bg-gray-200 rounded"></div>
                    <div className="h-48 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ) : images.length > 0 ? (
                <div className="space-y-6">
                  {/* Front and Back Labels */}
                  {(() => {
                    const { frontLabel, backLabel, memories } = imageApi.categorizeImages(images);
                    return (
                      <>
                        {(frontLabel.length > 0 || backLabel.length > 0) && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-3">Wine Labels</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {frontLabel.map((image) => (
                                <div key={image.id} className="space-y-2">
                                  <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                                    <img
                                      src={imageApi.getImageUrl(image.id)}
                                      alt={image.alt_text || `${image.image_type.replace('_', ' ')} image`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <p className="text-xs text-gray-600 text-center">Front Label</p>
                                </div>
                              ))}
                              {backLabel.map((image) => (
                                <div key={image.id} className="space-y-2">
                                  <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                                    <img
                                      src={imageApi.getImageUrl(image.id)}
                                      alt={image.alt_text || `${image.image_type.replace('_', ' ')} image`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <p className="text-xs text-gray-600 text-center">Back Label</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Memory Photos */}
                        {memories.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-3">Memory Photos</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {memories.map((image) => (
                                <div key={image.id} className="space-y-1">
                                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                    <img
                                      src={imageApi.getImageUrl(image.id)}
                                      alt={image.alt_text || 'Memory photo'}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  {image.description && (
                                    <p className="text-xs text-gray-600 text-center truncate" title={image.description}>
                                      {image.description}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No images uploaded</h3>
                  <p className="mt-1 text-sm text-gray-500">Upload wine label or memory photos when editing this wine.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="lg:col-span-1">
          <ConsumptionTracker 
            wine={wine} 
            onWineUpdated={setWine}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-2">Delete Wine</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "{wine.name}"? This action cannot be undone.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WineDetail;