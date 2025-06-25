import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MemoryForm from '../components/MemoryForm';
import { memoryApi } from '../services/memoryApi';
import { wineApi } from '../services/api';
import type { CreateMemoryRequest, UpdateMemoryRequest } from '../services/memoryApi';
import type { Wine } from '../types/wine';

const AddMemory: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const wineId = searchParams.get('wineId');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wine, setWine] = useState<Wine | null>(null);
  const [wineLoading, setWineLoading] = useState(true);

  useEffect(() => {
    const fetchWine = async () => {
      if (!wineId) {
        setError('Wine ID is required');
        setWineLoading(false);
        return;
      }

      try {
        setWineLoading(true);
        const wineData = await wineApi.getWine(wineId);
        setWine(wineData);
      } catch (err: any) {
        console.error('Error fetching wine:', err);
        setError(err.response?.data?.message || 'Failed to load wine information.');
      } finally {
        setWineLoading(false);
      }
    };

    fetchWine();
  }, [wineId]);

  const handleSubmit = async (memoryData: CreateMemoryRequest | UpdateMemoryRequest) => {
    if (!wineId) {
      setError('Wine ID is required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Ensure we're creating a memory with wine_id
      const createData: CreateMemoryRequest = 'wine_id' in memoryData ? 
        memoryData as CreateMemoryRequest : 
        {
          wine_id: wineId,
          title: (memoryData as UpdateMemoryRequest).title || '',
          content: (memoryData as UpdateMemoryRequest).content || '',
          rating: (memoryData as UpdateMemoryRequest).rating,
          location: (memoryData as UpdateMemoryRequest).location,
          date_experienced: (memoryData as UpdateMemoryRequest).date_experienced
        };
      
      await memoryApi.createMemory(createData);
      
      // Navigate to memories page on success
      navigate('/memories');
    } catch (err: any) {
      console.error('Error creating memory:', err);
      setError(err.response?.data?.message || 'Failed to create memory. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Go back to wine detail page if we have a wine ID, otherwise to memories page
    if (wineId) {
      navigate(`/wines/${wineId}`);
    } else {
      navigate('/memories');
    }
  };

  if (wineLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !wine) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Add Memory</h1>
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
                  onClick={handleCancel}
                  className="text-sm font-medium text-red-800 hover:text-red-600"
                >
                  ← Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!wineId || !wine) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Add Memory</h1>
          <p className="text-gray-600">Wine not found</p>
        </div>
        <div className="text-center">
          <button
            onClick={handleCancel}
            className="text-wine-600 hover:text-wine-700 font-medium"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-gray-900">Add Memory</h1>
        <p className="text-gray-600">
          Creating a new memory for <span className="font-medium text-wine-700">{wine.name}</span> by {wine.vineyard}
        </p>
      </div>

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

      <div className="bg-white shadow-lg rounded-lg p-6">
        <MemoryForm
          wineId={wineId}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default AddMemory;