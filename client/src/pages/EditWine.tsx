import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import WineForm from '../components/WineForm';
import WineSearchModal from '../components/WineSearchModal';
import { wineApi } from '../services/api';
import type { CreateWineRequest, Wine } from '../types/wine';

const EditWine: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [wine, setWine] = useState<Wine | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingWine, setIsLoadingWine] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [mergedWineData, setMergedWineData] = useState<Wine | null>(null);

  useEffect(() => {
    const fetchWine = async () => {
      if (!id) {
        setError('Wine ID is required');
        setIsLoadingWine(false);
        return;
      }

      try {
        setIsLoadingWine(true);
        const wineData = await wineApi.getWine(id);
        setWine(wineData);
      } catch (err: any) {
        console.error('Error fetching wine:', err);
        setError(err.response?.data?.message || 'Failed to load wine. Please try again.');
      } finally {
        setIsLoadingWine(false);
      }
    };

    fetchWine();
  }, [id]);

  const handleSubmit = async (wineData: CreateWineRequest) => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);
      
      await wineApi.updateWine(id, wineData);
      
      // Navigate back to wine detail page or wine list on success
      navigate(`/wines/${id}`);
    } catch (err: any) {
      console.error('Error updating wine:', err);
      setError(err.response?.data?.message || 'Failed to update wine. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (id) {
      navigate(`/wines/${id}`);
    } else {
      navigate('/wines');
    }
  };

  const handleOpenSearch = () => {
    setShowSearchModal(true);
  };

  const handleCloseSearch = () => {
    setShowSearchModal(false);
  };

  const handleSelectWine = (selectedWine: any) => {
    if (!wine) return;

    // Merge the selected wine data with existing wine data
    const mergedData: Wine = {
      ...wine,
      name: selectedWine.name || wine.name,
      vineyard: selectedWine.vineyard || wine.vineyard,
      region: selectedWine.region || wine.region,
      color: selectedWine.color || wine.color,
      grape_varieties: selectedWine.grape_varieties || wine.grape_varieties,
      vintage_year: selectedWine.vintage_year || wine.vintage_year,
      rating: selectedWine.rating || wine.rating,
      description: selectedWine.description || wine.description,
      price: selectedWine.price || wine.price,
      currency: selectedWine.currency || wine.currency,
      food_pairings: selectedWine.food_pairings || wine.food_pairings,
    };

    setMergedWineData(mergedData);
    setShowSearchModal(false);
  };

  if (isLoadingWine) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Edit Wine</h1>
          <p className="text-gray-600">Loading wine information...</p>
        </div>
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !wine) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Edit Wine</h1>
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
          <h1 className="text-3xl font-serif font-bold text-gray-900">Edit Wine</h1>
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
      <div>
        <h1 className="text-3xl font-serif font-bold text-gray-900">Edit Wine</h1>
        <p className="text-gray-600">Update information for {wine.name}</p>
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
        <div className="mb-6 pb-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Wine Information</h2>
              <p className="text-sm text-gray-600">Update the wine details or enrich with database information</p>
            </div>
            <button
              onClick={handleOpenSearch}
              className="btn-secondary flex items-center"
            >
              <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
              Enrich from Database
            </button>
          </div>
        </div>

        <WineForm
          initialData={mergedWineData || wine}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isEditing={true}
          isLoading={isLoading}
        />
      </div>

      <WineSearchModal
        isOpen={showSearchModal}
        onClose={handleCloseSearch}
        onSelectWine={handleSelectWine}
      />
    </div>
  );
};

export default EditWine;