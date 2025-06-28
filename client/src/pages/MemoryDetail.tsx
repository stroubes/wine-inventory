import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeftIcon, StarIcon, CalendarIcon, MapPinIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { memoryApi, type WineMemory } from '../services/memoryApi';
import { wineApi } from '../services/api';
import type { Wine } from '../types/wine';
import MemoryForm from '../components/MemoryForm';

const MemoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [memory, setMemory] = useState<WineMemory | null>(null);
  const [wine, setWine] = useState<Wine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    if (id) {
      loadMemory(id);
    }
  }, [id]);

  const loadMemory = async (memoryId: string) => {
    try {
      setLoading(true);
      const memoryData = await memoryApi.getMemory(memoryId);
      setMemory(memoryData);
      
      if (memoryData.wine_id) {
        const wineData = await wineApi.getWine(memoryData.wine_id);
        setWine(wineData);
      }
    } catch (err) {
      setError('Failed to load memory');
      console.error('Load memory error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setShowEditForm(true);
  };

  const handleDelete = async () => {
    if (!memory || !confirm('Are you sure you want to delete this memory?')) return;
    
    try {
      await memoryApi.deleteMemory(memory.id);
      navigate('/memories');
    } catch (err) {
      console.error('Delete memory error:', err);
      alert('Failed to delete memory');
    }
  };

  const handleFormClose = (updated?: WineMemory) => {
    setShowEditForm(false);
    if (updated && id) {
      loadMemory(id);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon
        key={i}
        className={`h-5 w-5 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-wine-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading memory...</p>
        </div>
      </div>
    );
  }

  if (error || !memory) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Memory not found'}</p>
          <Link
            to="/memories"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-wine-600 hover:bg-wine-700"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Back to Memories
          </Link>
        </div>
      </div>
    );
  }

  if (showEditForm) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <MemoryForm
          initialData={memory}
          onSubmit={async (data) => {
            await memoryApi.updateMemory(memory.id, data);
            handleFormClose(memory);
          }}
          onCancel={() => setShowEditForm(false)}
          isEditing={true}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Link
            to="/memories"
            className="inline-flex items-center text-wine-600 hover:text-wine-700"
          >
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            Back to Memories
          </Link>
          
          <div className="flex space-x-2">
            <button
              onClick={handleEdit}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <PencilIcon className="h-4 w-4 mr-1" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              Delete
            </button>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900">{memory.title}</h1>
      </div>

      {/* Memory Card */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-6">
          {/* Wine Information */}
          {wine && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Wine</h3>
              <Link
                to={`/wines/${wine.id}`}
                className="text-wine-600 hover:text-wine-700 font-medium"
              >
                {wine.name} {wine.vintage && `(${wine.vintage})`}
              </Link>
              {wine.winery && <p className="text-gray-600">{wine.winery}</p>}
              {wine.region && <p className="text-gray-600">{wine.region}</p>}
            </div>
          )}

          {/* Memory Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center">
              <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-900">
                {new Date(memory.date_experienced).toLocaleDateString()}
              </span>
            </div>
            
            {memory.location && (
              <div className="flex items-center">
                <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-900">{memory.location}</span>
              </div>
            )}
            
            {memory.rating && (
              <div className="flex items-center">
                <span className="text-gray-700 mr-2">Rating:</span>
                <div className="flex">
                  {renderStars(memory.rating)}
                </div>
              </div>
            )}
          </div>

          {/* Memory Content */}
          {memory.content && (
            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Memory</h3>
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {memory.content}
              </div>
            </div>
          )}

          {/* Memory Photos - TODO: Implement image display */}
          {/* This section needs to be implemented with actual image fetching */}
        </div>
      </div>
    </div>
  );
};

export default MemoryDetail;