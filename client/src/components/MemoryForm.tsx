import React, { useState, useEffect } from 'react';
import type { CreateMemoryRequest, WineMemory, UpdateMemoryRequest } from '../services/memoryApi';
import ImageUpload from './ImageUpload';
import RichTextEditor from './RichTextEditor';
import { imageApi } from '../services/imageApi';

interface MemoryFormProps {
  wineId: string;
  initialData?: WineMemory;
  onSubmit: (data: CreateMemoryRequest | UpdateMemoryRequest) => Promise<void>;
  onCancel?: () => void;
  isEditing?: boolean;
  isLoading?: boolean;
}

const MemoryForm: React.FC<MemoryFormProps> = ({
  wineId,
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    rating: undefined as number | undefined,
    location: '',
    date_experienced: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [memoryPhotos, setMemoryPhotos] = useState<File[]>([]);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        content: initialData.content,
        rating: initialData.rating,
        location: initialData.location || '',
        date_experienced: new Date(initialData.date_experienced).toISOString().split('T')[0]
      });
    } else {
      // Set today's date as default
      setFormData(prev => ({
        ...prev,
        date_experienced: new Date().toISOString().split('T')[0]
      }));
    }
  }, [initialData]);

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

  const handleRatingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      rating: value === '' ? undefined : Number(value)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    
    // For rich text content, check if there's actual text content (not just HTML tags)
    const contentText = formData.content.replace(/<[^>]*>/g, '').trim();
    if (!contentText) newErrors.content = 'Content is required';

    // Optional but validated fields
    if (formData.rating && (formData.rating < 1 || formData.rating > 5)) {
      newErrors.rating = 'Rating must be between 1 and 5';
    }

    if (formData.date_experienced) {
      const selectedDate = new Date(formData.date_experienced);
      const today = new Date();
      if (selectedDate > today) {
        newErrors.date_experienced = 'Experience date cannot be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadImages = async () => {
    if (memoryPhotos.length === 0) return;
    
    setImageUploadLoading(true);
    try {
      await imageApi.uploadWineImages(wineId, memoryPhotos, 'memory');
      setMemoryPhotos([]);
    } catch (error) {
      console.error('Memory photo upload error:', error);
    } finally {
      setImageUploadLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = isEditing ? {
      title: formData.title.trim(),
      content: formData.content.trim(),
      rating: formData.rating,
      location: formData.location.trim() || undefined,
      date_experienced: formData.date_experienced || undefined
    } : {
      wine_id: wineId,
      title: formData.title.trim(),
      content: formData.content.trim(),
      rating: formData.rating,
      location: formData.location.trim() || undefined,
      date_experienced: formData.date_experienced || undefined
    };

    try {
      await onSubmit(submitData);
      // Upload images after successful memory creation/update
      await uploadImages();
    } catch (error) {
      console.error('Memory form submission error:', error);
    }
  };

  const ratingOptions = [
    { value: '', label: 'No rating' },
    { value: '1', label: '★☆☆☆☆ (1/5) - Poor' },
    { value: '2', label: '★★☆☆☆ (2/5) - Fair' },
    { value: '3', label: '★★★☆☆ (3/5) - Good' },
    { value: '4', label: '★★★★☆ (4/5) - Very Good' },
    { value: '5', label: '★★★★★ (5/5) - Excellent' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Title */}
        <div className="md:col-span-2">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Memory Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-wine-600 focus:border-wine-600 ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Give your memory a title"
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>

        {/* Rating */}
        <div>
          <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-2">
            Experience Rating
          </label>
          <select
            id="rating"
            name="rating"
            value={formData.rating || ''}
            onChange={handleRatingChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-wine-600 focus:border-wine-600 ${
              errors.rating ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            {ratingOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.rating && <p className="mt-1 text-sm text-red-600">{errors.rating}</p>}
        </div>

        {/* Date Experienced */}
        <div>
          <label htmlFor="date_experienced" className="block text-sm font-medium text-gray-700 mb-2">
            Date Experienced
          </label>
          <input
            type="date"
            id="date_experienced"
            name="date_experienced"
            value={formData.date_experienced}
            onChange={handleInputChange}
            max={new Date().toISOString().split('T')[0]}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-wine-600 focus:border-wine-600 ${
              errors.date_experienced ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.date_experienced && <p className="mt-1 text-sm text-red-600">{errors.date_experienced}</p>}
        </div>

        {/* Location */}
        <div className="md:col-span-2">
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-wine-600 focus:border-wine-600"
            placeholder="e.g. Napa Valley, Home, Restaurant name, Winery"
          />
        </div>

        {/* Content */}
        <div className="md:col-span-2">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            Memory Content *
          </label>
          <RichTextEditor
            value={formData.content}
            onChange={(value) => {
              setFormData(prev => ({ ...prev, content: value }));
              if (errors.content) {
                setErrors(prev => ({ ...prev, content: '' }));
              }
            }}
            placeholder="Describe your experience with this wine. What made it memorable? Who were you with? What did you eat? How did it taste? Use the toolbar to format your text with headings, lists, and styling."
            className={errors.content ? 'border-red-500' : ''}
          />
          {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
          <p className="mt-1 text-sm text-gray-500">
            Share your thoughts, feelings, and details about the experience. Use the formatting tools above to structure your content.
          </p>
        </div>
      </div>

      {/* Memory Photos */}
      <div className="space-y-4 pt-6 border-t border-gray-200">
        <h4 className="text-lg font-medium text-gray-900">Memory Photos</h4>
        <p className="text-sm text-gray-600">
          Add photos to capture the moment - the setting, food pairings, people, or anything that made this experience special.
        </p>
        <ImageUpload
          onImagesSelected={setMemoryPhotos}
          maxFiles={5}
          className=""
        />
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
          {isLoading || imageUploadLoading ? 'Saving...' : (isEditing ? 'Update Memory' : 'Save Memory')}
        </button>
      </div>
    </form>
  );
};

export default MemoryForm;