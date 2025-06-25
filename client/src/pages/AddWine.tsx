import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import WineForm from '../components/WineForm';
import WineSearchModal from '../components/WineSearchModal';
import { wineApi } from '../services/api';
import type { CreateWineRequest } from '../types/wine';

const AddWine: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdWineId, setCreatedWineId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [prefillData, setPrefillData] = useState<Partial<CreateWineRequest> | null>(null);

  const handleSubmit = async (wineData: CreateWineRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const createdWine = await wineApi.createWine(wineData);
      setCreatedWineId(createdWine.id);
      setShowSuccess(true);
      
    } catch (err: any) {
      console.error('Error creating wine:', err);
      setError(err.response?.data?.message || 'Failed to create wine. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/wines');
  };

  const handleAddMemory = () => {
    if (createdWineId) {
      navigate(`/memories/add?wineId=${createdWineId}`);
    }
  };

  const handleViewWine = () => {
    if (createdWineId) {
      navigate(`/wines/${createdWineId}`);
    }
  };

  const handleGoToWineList = () => {
    navigate('/wines');
  };

  const handleOpenSearch = () => {
    setShowSearchModal(true);
  };

  const handleCloseSearch = () => {
    setShowSearchModal(false);
  };

  const handleSelectWine = (selectedWine: any) => {
    // Convert the search result to our form format
    const prefillData: Partial<CreateWineRequest> = {
      name: selectedWine.name,
      vineyard: selectedWine.vineyard,
      region: selectedWine.region,
      color: selectedWine.color,
      grape_varieties: selectedWine.grape_varieties,
      vintage_year: selectedWine.vintage_year,
      rating: selectedWine.rating,
      description: selectedWine.description,
      price: selectedWine.price,
      currency: selectedWine.currency || 'USD',
      food_pairings: selectedWine.food_pairings,
    };

    setPrefillData(prefillData);
    setShowSearchModal(false);
  };

  if (showSuccess && createdWineId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Wine Added Successfully!</h1>
          <p className="text-gray-600">Your wine has been added to your collection</p>
        </div>

        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Wine has been successfully added to your collection.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">What would you like to do next?</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleAddMemory}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-wine-600 hover:bg-wine-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wine-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Memory for this Wine
            </button>
            <button
              onClick={handleViewWine}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wine-600"
            >
              View Wine Details
            </button>
            <button
              onClick={handleGoToWineList}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wine-600"
            >
              Back to Wine List
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-gray-900">Add New Wine</h1>
        <p className="text-gray-600">Add a new wine to your collection</p>
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
              <p className="text-sm text-gray-600">Fill out the details below or search our wine database</p>
            </div>
            <button
              onClick={handleOpenSearch}
              className="btn-secondary flex items-center"
            >
              <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
              Search Wine Database
            </button>
          </div>
        </div>

        <WineForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
          initialData={prefillData || undefined}
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

export default AddWine;