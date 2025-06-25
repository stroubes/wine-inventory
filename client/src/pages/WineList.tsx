import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { wineApi } from '../services/api';
import type { Wine, WineSearchFilters } from '../types/wine';

const WineList: React.FC = () => {
  const [wines, setWines] = useState<Wine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<WineSearchFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchWines = async (page = 1) => {
    try {
      setLoading(true);
      const searchFilters = {
        ...filters,
        search: searchTerm || undefined
      };
      
      const data = await wineApi.getWines(searchFilters, page, 20);
      setWines(data.wines);
      setTotalPages(data.totalPages);
      setCurrentPage(page);
      setError(null);
    } catch (err) {
      console.error('Error fetching wines:', err);
      setError('Failed to load wines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWines(1);
  }, [searchTerm, filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWines(1);
  };

  if (loading && wines.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Wine Collection</h1>
          <p className="mt-2 text-sm text-gray-600">
            Browse and manage your wine inventory
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/wines/add"
            className="btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Wine
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="input-field pl-10"
              placeholder="Search wines, vineyards, regions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <select
              className="input-field"
              value={filters.color || ''}
              onChange={(e) => setFilters({...filters, color: e.target.value as any || undefined})}
            >
              <option value="">All Colors</option>
              <option value="Red">Red</option>
              <option value="White">White</option>
              <option value="Rosé">Rosé</option>
              <option value="Sparkling">Sparkling</option>
              <option value="Dessert">Dessert</option>
              <option value="Fortified">Fortified</option>
            </select>

            <select
              className="input-field"
              value={filters.consumption_status || ''}
              onChange={(e) => setFilters({...filters, consumption_status: e.target.value as any || undefined})}
            >
              <option value="">All Status</option>
              <option value="Available">Available</option>
              <option value="Consumed">Consumed</option>
              <option value="Reserved">Reserved</option>
            </select>

            <input
              type="number"
              className="input-field"
              placeholder="Min Year"
              value={filters.vintage_year_min || ''}
              onChange={(e) => setFilters({...filters, vintage_year_min: e.target.value ? parseInt(e.target.value) : undefined})}
            />

            <input
              type="number"
              className="input-field"
              placeholder="Max Year"
              value={filters.vintage_year_max || ''}
              onChange={(e) => setFilters({...filters, vintage_year_max: e.target.value ? parseInt(e.target.value) : undefined})}
            />
          </div>
        </form>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Wine Grid */}
      {wines.length === 0 && !loading ? (
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">No wines found</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding a new wine to your collection.</p>
          <div className="mt-6">
            <Link to="/wines/add" className="btn-primary">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Wine
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {wines.map((wine) => (
            <Link
              key={wine.id}
              to={`/wines/${wine.id}`}
              className="card hover:shadow-lg transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(wine.consumption_status)}`}>
                    {wine.consumption_status}
                  </span>
                  <span className={`w-3 h-3 rounded-full ${getColorClass(wine.color)}`}></span>
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 mb-1 line-clamp-2">{wine.name}</h3>
                <p className="text-sm text-gray-600 mb-1">{wine.vineyard}</p>
                <p className="text-sm text-gray-500 mb-2">{wine.region}</p>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {wine.vintage_year || 'NV'}
                  </span>
                  {wine.rating && (
                    <span className="text-yellow-600">
                      ★ {wine.rating}/100
                    </span>
                  )}
                </div>
                
                {wine.rack_slot && (
                  <p className="text-xs text-gray-500 mt-2">Rack: {wine.rack_slot}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => currentPage > 1 && fetchWines(currentPage - 1)}
              disabled={currentPage <= 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => currentPage < totalPages && fetchWines(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => currentPage > 1 && fetchWines(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => currentPage < totalPages && fetchWines(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Available':
      return 'bg-green-100 text-green-800';
    case 'Consumed':
      return 'bg-red-100 text-red-800';
    case 'Reserved':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getColorClass = (color: string): string => {
  switch (color.toLowerCase()) {
    case 'red':
      return 'bg-red-600';
    case 'white':
      return 'bg-yellow-200';
    case 'rosé':
      return 'bg-pink-400';
    case 'sparkling':
      return 'bg-blue-200';
    case 'dessert':
      return 'bg-amber-400';
    case 'fortified':
      return 'bg-orange-600';
    default:
      return 'bg-gray-400';
  }
};

export default WineList;