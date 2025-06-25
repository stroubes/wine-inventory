import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, CalendarIcon, StarIcon, TrashIcon, PencilIcon, EyeIcon } from '@heroicons/react/24/outline';
import { memoryApi, type WineMemory, type MemoryStats } from '../services/memoryApi';
import { wineApi } from '../services/api';
import type { Wine } from '../types/wine';
import MemoryForm from '../components/MemoryForm';

const MemoryManagement: React.FC = () => {
  const navigate = useNavigate();
  const [memories, setMemories] = useState<WineMemory[]>([]);
  const [wines, setWines] = useState<Wine[]>([]);
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [selectedWine, setSelectedWine] = useState<string>('');
  const [editingMemory, setEditingMemory] = useState<WineMemory | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [winesData, statsData] = await Promise.all([
        wineApi.getWines({}, 1, 1000),
        memoryApi.getMemoryStats()
      ]);
      
      setWines(winesData.wines);
      setStats(statsData);
      setMemories(statsData.recent_memories);
    } catch (err) {
      setError('Failed to load memories data');
      console.error('Load memories error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadWineMemories = async (wineId: string) => {
    try {
      const wineMemories = await memoryApi.getWineMemories(wineId);
      setMemories(wineMemories);
    } catch (err) {
      console.error('Load wine memories error:', err);
    }
  };

  const handleWineSelect = (wineId: string) => {
    setSelectedWine(wineId);
    if (wineId) {
      loadWineMemories(wineId);
    } else {
      // Show all recent memories
      setMemories(stats?.recent_memories || []);
    }
  };

  const handleCreateMemory = async (memoryData: any) => {
    try {
      await memoryApi.createMemory(memoryData);
      setShowForm(false);
      
      // Reload memories for the selected wine or all memories
      if (selectedWine) {
        loadWineMemories(selectedWine);
      } else {
        loadData();
      }
    } catch (err) {
      console.error('Create memory error:', err);
    }
  };

  const handleUpdateMemory = async (memoryData: any) => {
    try {
      if (editingMemory) {
        await memoryApi.updateMemory(editingMemory.id, memoryData);
        setEditingMemory(null);
        
        // Reload memories
        if (selectedWine) {
          loadWineMemories(selectedWine);
        } else {
          loadData();
        }
      }
    } catch (err) {
      console.error('Update memory error:', err);
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    if (!confirm('Are you sure you want to delete this memory? This action cannot be undone.')) {
      return;
    }

    try {
      await memoryApi.deleteMemory(memoryId);
      
      // Reload memories
      if (selectedWine) {
        loadWineMemories(selectedWine);
      } else {
        loadData();
      }
    } catch (err) {
      console.error('Delete memory error:', err);
    }
  };

  const getWineName = (wineId: string) => {
    const wine = wines.find(w => w.id === wineId);
    return wine ? `${wine.name} (${wine.vintage_year || 'NV'})` : 'Unknown Wine';
  };

  const renderStars = (rating?: number) => {
    if (!rating) return <span className="text-gray-400">No rating</span>;
    
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating}/5)</span>
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

  // Show memory form
  if (showForm || editingMemory) {
    const formWineId = selectedWine || (editingMemory?.wine_id);
    if (!formWineId) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-700">Please select a wine first to create a memory.</p>
          <button
            onClick={() => setShowForm(false)}
            className="mt-2 text-wine-600 hover:text-wine-700"
          >
            Go back
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-serif font-bold text-gray-900">
            {editingMemory ? 'Edit Memory' : 'Create New Memory'}
          </h1>
          <button
            onClick={() => {
              setShowForm(false);
              setEditingMemory(null);
            }}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back to Memories
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Creating memory for:</p>
            <p className="font-medium text-gray-900">{getWineName(formWineId)}</p>
          </div>

          <MemoryForm
            wineId={formWineId}
            initialData={editingMemory || undefined}
            onSubmit={editingMemory ? handleUpdateMemory : handleCreateMemory}
            onCancel={() => {
              setShowForm(false);
              setEditingMemory(null);
            }}
            isEditing={!!editingMemory}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Wine Memories</h1>
          <p className="text-gray-600 mt-1">
            Capture and relive your wine experiences
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          disabled={!selectedWine}
          className="flex items-center px-4 py-2 bg-wine-600 text-white rounded-lg hover:bg-wine-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Memory
        </button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Total Memories</h3>
            <p className="text-3xl font-bold text-wine-600">{stats.total_memories}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Average Rating</h3>
            <p className="text-3xl font-bold text-wine-600">
              {stats.average_rating ? stats.average_rating.toFixed(1) : 'N/A'}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Wines with Memories</h3>
            <p className="text-3xl font-bold text-wine-600">{stats.wines_with_memories}</p>
          </div>
        </div>
      )}

      {/* Wine Filter */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filter by Wine</h3>
        <select
          value={selectedWine}
          onChange={(e) => handleWineSelect(e.target.value)}
          className="w-full md:w-96 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-wine-600 focus:border-wine-600"
        >
          <option value="">All wines (recent memories)</option>
          {wines.map((wine) => (
            <option key={wine.id} value={wine.id}>
              {wine.name} - {wine.vineyard} ({wine.vintage_year || 'NV'})
            </option>
          ))}
        </select>
      </div>

      {/* Memories List */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          {selectedWine ? `Memories for ${getWineName(selectedWine)}` : 'Recent Memories'}
        </h3>

        {memories.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No memories yet</h3>
            <p className="text-gray-600 mb-4">
              {selectedWine 
                ? 'No memories found for this wine. Create your first memory!' 
                : 'Start creating memories for your wine experiences.'}
            </p>
            {selectedWine && (
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary"
              >
                Create First Memory
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {memories.map((memory) => (
              <div key={memory.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="relative">
                  <div 
                    className="p-6 cursor-pointer"
                    onClick={() => navigate(`/memories/${memory.id}`)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 pr-20">
                        <h4 className="text-xl font-medium text-gray-900 mb-2 hover:text-wine-600">
                          {memory.title}
                        </h4>
                        {!selectedWine && (
                          <p className="text-sm text-gray-600 mb-2">
                            Wine: {getWineName(memory.wine_id)}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {memoryApi.formatDate(memory.date_experienced)}
                          </span>
                          {memory.location && (
                            <span>• {memory.location}</span>
                          )}
                          <span>• {memoryApi.getRelativeTime(memory.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {memory.rating && (
                      <div className="mb-3">
                        {renderStars(memory.rating)}
                      </div>
                    )}

                    <div className="prose prose-sm max-w-none" dir="ltr">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {memory.content}
                      </p>
                    </div>
                  </div>
                  
                  <div className="absolute top-6 right-6 flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingMemory(memory);
                      }}
                      className="p-2 text-gray-400 hover:text-wine-600"
                      title="Edit memory"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMemory(memory.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600"
                      title="Delete memory"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryManagement;