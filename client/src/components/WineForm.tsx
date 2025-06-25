import React, { useState, useEffect } from 'react';
import type { CreateWineRequest, Wine } from '../types/wine';
import ImageUpload from './ImageUpload';
import { imageApi, type WineImage } from '../services/imageApi';
import RackSlotSelector from './RackSlotSelector';

interface WineFormData extends CreateWineRequest {
  grape_varieties_input?: string;
  food_pairings_input?: string;
}

interface WineFormProps {
  initialData?: Wine | Partial<CreateWineRequest>;
  onSubmit: (data: CreateWineRequest) => Promise<void>;
  onCancel?: () => void;
  isEditing?: boolean;
  isLoading?: boolean;
}

const WineForm: React.FC<WineFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<WineFormData>({
    name: '',
    vineyard: '',
    region: '',
    color: 'Red',
    grape_varieties: [],
    currency: 'USD',
    grape_varieties_input: '',
    food_pairings_input: '',
    food_pairings: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [frontLabelFiles, setFrontLabelFiles] = useState<File[]>([]);
  const [backLabelFiles, setBackLabelFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<WineImage[]>([]);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        vineyard: initialData.vineyard || '',
        region: initialData.region || '',
        color: initialData.color || 'Red',
        grape_varieties: initialData.grape_varieties || [],
        price: initialData.price,
        currency: initialData.currency || 'USD',
        vintage_year: initialData.vintage_year,
        rack_slot: initialData.rack_slot,
        description: initialData.description,
        personal_notes: initialData.personal_notes,
        rating: initialData.rating,
        food_pairings: initialData.food_pairings || [],
        grape_varieties_input: (initialData.grape_varieties || []).join(', '),
        food_pairings_input: (initialData.food_pairings || []).join(', ')
      });
      
      // Load existing images if editing
      if (isEditing && initialData && 'id' in initialData && initialData.id) {
        loadExistingImages(initialData.id);
      }
    }
  }, [initialData, isEditing]);

  const loadExistingImages = async (wineId: string) => {
    try {
      const images = await imageApi.getWineImages(wineId);
      setExistingImages(images);
    } catch (error) {
      console.error('Failed to load existing images:', error);
    }
  };

  const deleteExistingImage = async (imageId: string) => {
    try {
      await imageApi.deleteImage(imageId);
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? undefined : Number(value)
    }));
  };

  const handleArrayInputChange = (field: 'grape_varieties_input' | 'food_pairings_input') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => {
      const arrayField = field === 'grape_varieties_input' ? 'grape_varieties' : 'food_pairings';
      return {
        ...prev,
        [field]: value,
        [arrayField]: value.split(',').map(item => item.trim()).filter(item => item.length > 0)
      };
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.name.trim()) newErrors.name = 'Wine name is required';
    if (!formData.vineyard.trim()) newErrors.vineyard = 'Vineyard is required';
    if (!formData.region.trim()) newErrors.region = 'Region is required';
    if (formData.grape_varieties.length === 0) newErrors.grape_varieties_input = 'At least one grape variety is required';

    // Optional but validated fields
    if (formData.vintage_year && (formData.vintage_year < 1800 || formData.vintage_year > new Date().getFullYear())) {
      newErrors.vintage_year = 'Vintage year must be between 1800 and current year';
    }
    
    if (formData.price && formData.price < 0) {
      newErrors.price = 'Price cannot be negative';
    }

    if (formData.rating && (formData.rating < 1 || formData.rating > 100)) {
      newErrors.rating = 'Rating must be between 1 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData: CreateWineRequest = {
      name: formData.name.trim(),
      vineyard: formData.vineyard.trim(),
      region: formData.region.trim(),
      color: formData.color,
      grape_varieties: formData.grape_varieties,
      price: formData.price,
      currency: formData.currency,
      vintage_year: formData.vintage_year,
      rack_slot: formData.rack_slot?.trim(),
      description: formData.description?.trim(),
      personal_notes: formData.personal_notes?.trim(),
      rating: formData.rating,
      food_pairings: formData.food_pairings
    };

    try {
      // First submit the wine data
      await onSubmit(submitData);
      
      // If we have a wine ID (from editing) or can get it from the response, upload images
      if (isEditing && initialData && 'id' in initialData && initialData.id) {
        await uploadImages(initialData.id);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const uploadImages = async (wineId: string) => {
    setImageUploadLoading(true);
    try {
      // Upload front label images
      if (frontLabelFiles.length > 0) {
        await imageApi.uploadWineImages(wineId, frontLabelFiles, 'front_label');
      }
      
      // Upload back label images
      if (backLabelFiles.length > 0) {
        await imageApi.uploadWineImages(wineId, backLabelFiles, 'back_label');
      }
      
      // Clear the file arrays
      setFrontLabelFiles([]);
      setBackLabelFiles([]);
    } catch (error) {
      console.error('Image upload error:', error);
    } finally {
      setImageUploadLoading(false);
    }
  };

  const wineColors: Wine['color'][] = ['Red', 'White', 'Rosé', 'Sparkling', 'Dessert', 'Fortified'];
  const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];
  const wineRegions = [
    // France
    'Bordeaux, France', 'Burgundy, France', 'Champagne, France', 'Loire Valley, France',
    'Rhône Valley, France', 'Alsace, France', 'Languedoc, France', 'Provence, France',
    // Italy
    'Tuscany, Italy', 'Piedmont, Italy', 'Veneto, Italy', 'Sicily, Italy', 'Emilia-Romagna, Italy',
    'Marche, Italy', 'Umbria, Italy', 'Abruzzo, Italy',
    // Spain
    'Rioja, Spain', 'Ribera del Duero, Spain', 'Priorat, Spain', 'Rías Baixas, Spain',
    'Jerez, Spain', 'Catalonia, Spain',
    // Germany
    'Mosel, Germany', 'Rheingau, Germany', 'Pfalz, Germany', 'Baden, Germany',
    // United States
    'Napa Valley, California', 'Sonoma County, California', 'Paso Robles, California',
    'Santa Barbara County, California', 'Oregon', 'Washington State', 'New York State',
    // Canada
    'Okanagan Valley, British Columbia', 'Niagara Peninsula, Ontario', 'Prince Edward County, Ontario',
    'Nova Scotia', 'Fraser Valley, British Columbia', 'Similkameen Valley, British Columbia',
    // Australia
    'Barossa Valley, Australia', 'Hunter Valley, Australia', 'McLaren Vale, Australia',
    'Yarra Valley, Australia', 'Adelaide Hills, Australia', 'Margaret River, Australia',
    // New Zealand
    'Marlborough, New Zealand', 'Central Otago, New Zealand', 'Hawke\'s Bay, New Zealand',
    // South America
    'Mendoza, Argentina', 'Maipo Valley, Chile', 'Casablanca Valley, Chile', 'Colchagua Valley, Chile',
    // South Africa
    'Stellenbosch, South Africa', 'Paarl, South Africa', 'Franschhoek, South Africa',
    // Portugal
    'Douro, Portugal', 'Vinho Verde, Portugal', 'Alentejo, Portugal',
    // Other
    'Other'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Wine Name */}
        <div className="md:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Wine Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-wine-600 focus:border-wine-600 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter wine name"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        {/* Vineyard */}
        <div>
          <label htmlFor="vineyard" className="block text-sm font-medium text-gray-700 mb-2">
            Vineyard *
          </label>
          <input
            type="text"
            id="vineyard"
            name="vineyard"
            value={formData.vineyard}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-wine-600 focus:border-wine-600 ${
              errors.vineyard ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter vineyard name"
          />
          {errors.vineyard && <p className="mt-1 text-sm text-red-600">{errors.vineyard}</p>}
        </div>

        {/* Region */}
        <div>
          <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
            Region *
          </label>
          <select
            id="region"
            name="region"
            value={formData.region}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-wine-600 focus:border-wine-600 ${
              errors.region ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select a region</option>
            {wineRegions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
          {errors.region && <p className="mt-1 text-sm text-red-600">{errors.region}</p>}
        </div>

        {/* Wine Color */}
        <div>
          <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-2">
            Wine Color *
          </label>
          <select
            id="color"
            name="color"
            value={formData.color}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-wine-600 focus:border-wine-600"
          >
            {wineColors.map(color => (
              <option key={color} value={color}>{color}</option>
            ))}
          </select>
        </div>

        {/* Vintage Year */}
        <div>
          <label htmlFor="vintage_year" className="block text-sm font-medium text-gray-700 mb-2">
            Vintage Year
          </label>
          <input
            type="number"
            id="vintage_year"
            name="vintage_year"
            value={formData.vintage_year || ''}
            onChange={handleNumberChange}
            min="1800"
            max={new Date().getFullYear()}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-wine-600 focus:border-wine-600 ${
              errors.vintage_year ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g. 2020"
          />
          {errors.vintage_year && <p className="mt-1 text-sm text-red-600">{errors.vintage_year}</p>}
        </div>

        {/* Grape Varieties */}
        <div className="md:col-span-2">
          <label htmlFor="grape_varieties_input" className="block text-sm font-medium text-gray-700 mb-2">
            Grape Varieties *
          </label>
          <input
            type="text"
            id="grape_varieties_input"
            name="grape_varieties_input"
            value={formData.grape_varieties_input || ''}
            onChange={handleArrayInputChange('grape_varieties_input')}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-wine-600 focus:border-wine-600 ${
              errors.grape_varieties_input ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter grape varieties separated by commas (e.g. Cabernet Sauvignon, Merlot)"
          />
          {errors.grape_varieties_input && <p className="mt-1 text-sm text-red-600">{errors.grape_varieties_input}</p>}
          {formData.grape_varieties.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.grape_varieties.map((variety, index) => (
                <span key={index} className="px-2 py-1 bg-wine-100 text-wine-800 text-sm rounded-full">
                  {variety}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Price */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
            Price
          </label>
          <div className="flex">
            <select
              name="currency"
              value={formData.currency}
              onChange={handleInputChange}
              className="px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-gray-700 focus:outline-none focus:ring-wine-600 focus:border-wine-600"
            >
              {currencies.map(currency => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price || ''}
              onChange={handleNumberChange}
              min="0"
              step="0.01"
              className={`flex-1 px-3 py-2 border border-l-0 rounded-r-md shadow-sm focus:outline-none focus:ring-wine-600 focus:border-wine-600 ${
                errors.price ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
          </div>
          {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
        </div>

        {/* Rating */}
        <div>
          <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-2">
            Rating (1-100)
          </label>
          <input
            type="number"
            id="rating"
            name="rating"
            value={formData.rating || ''}
            onChange={handleNumberChange}
            min="1"
            max="100"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-wine-600 focus:border-wine-600 ${
              errors.rating ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Rate 1-100"
          />
          {errors.rating && <p className="mt-1 text-sm text-red-600">{errors.rating}</p>}
        </div>

        {/* Rack Slot */}
        <div>
          <RackSlotSelector
            value={formData.rack_slot}
            onChange={(slotId) => setFormData(prev => ({ ...prev, rack_slot: slotId }))}
          />
        </div>

        {/* Food Pairings */}
        <div className="md:col-span-2">
          <label htmlFor="food_pairings_input" className="block text-sm font-medium text-gray-700 mb-2">
            Food Pairings
          </label>
          <input
            type="text"
            id="food_pairings_input"
            name="food_pairings_input"
            value={formData.food_pairings_input || ''}
            onChange={handleArrayInputChange('food_pairings_input')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-wine-600 focus:border-wine-600"
            placeholder="Enter food pairings separated by commas (e.g. Steak, Lamb, Dark Chocolate)"
          />
          {formData.food_pairings && formData.food_pairings.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.food_pairings.map((pairing, index) => (
                <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  {pairing}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description || ''}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-wine-600 focus:border-wine-600"
            placeholder="Describe the wine's characteristics, flavor profile, etc."
          />
        </div>

        {/* Personal Notes */}
        <div className="md:col-span-2">
          <label htmlFor="personal_notes" className="block text-sm font-medium text-gray-700 mb-2">
            Personal Notes
          </label>
          <textarea
            id="personal_notes"
            name="personal_notes"
            value={formData.personal_notes || ''}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-wine-600 focus:border-wine-600"
            placeholder="Your personal thoughts, memories, or notes about this wine"
          />
        </div>
      </div>

      {/* Wine Label Images */}
      <div className="space-y-6 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Wine Label Images</h3>
        
        {/* Existing Images (when editing) */}
        {isEditing && existingImages.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Current Images</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {existingImages.map((image) => (
                <div key={image.id} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={imageApi.getImageUrl(image.id)}
                      alt={image.original_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteExistingImage(image.id)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="mt-1">
                    <p className="text-xs text-gray-600 truncate" title={image.original_name}>
                      {image.original_name}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {image.image_type.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Front Label */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Front Label</h4>
            <ImageUpload
              onImagesSelected={setFrontLabelFiles}
              maxFiles={1}
              className=""
            />
          </div>
          
          {/* Back Label */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Back Label</h4>
            <ImageUpload
              onImagesSelected={setBackLabelFiles}
              maxFiles={1}
              className=""
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wine-600"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading || imageUploadLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-wine-600 border border-transparent rounded-md shadow-sm hover:bg-wine-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wine-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading || imageUploadLoading ? 'Saving...' : (isEditing ? 'Update Wine' : 'Add Wine')}
        </button>
      </div>
    </form>
  );
};

export default WineForm;