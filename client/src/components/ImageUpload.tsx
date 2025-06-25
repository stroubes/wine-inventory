import React, { useState, useRef, useCallback } from 'react';
import { CloudArrowUpIcon, XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';

interface ImageUploadProps {
  onImagesSelected: (files: File[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  maxSizePerFile?: number; // in MB
  className?: string;
}

interface PreviewImage {
  file: File;
  url: string;
  id: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImagesSelected,
  maxFiles = 5,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  maxSizePerFile = 10,
  className = ''
}) => {
  const [previews, setPreviews] = useState<PreviewImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported. Accepted types: ${acceptedTypes.join(', ')}`;
    }
    
    if (file.size > maxSizePerFile * 1024 * 1024) {
      return `File size must be less than ${maxSizePerFile}MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`;
    }
    
    return null;
  };

  const processFiles = useCallback((files: File[]) => {
    setError('');
    
    // Check total file count
    if (previews.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed. Currently have ${previews.length} files.`);
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    }

    if (errors.length > 0) {
      setError(errors.join('\n'));
      return;
    }

    // Create previews
    const newPreviews: PreviewImage[] = validFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9)
    }));

    setPreviews(prev => [...prev, ...newPreviews]);
    
    // Notify parent component
    const allFiles = [...previews.map(p => p.file), ...validFiles];
    onImagesSelected(allFiles);
  }, [previews, maxFiles, onImagesSelected, acceptedTypes, maxSizePerFile]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const removePreview = (id: string) => {
    const updatedPreviews = previews.filter(preview => {
      if (preview.id === id) {
        URL.revokeObjectURL(preview.url);
        return false;
      }
      return true;
    });
    
    setPreviews(updatedPreviews);
    onImagesSelected(updatedPreviews.map(p => p.file));
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
          ${isDragOver 
            ? 'border-red-500 bg-red-50' 
            : 'border-gray-300 hover:border-red-400 hover:bg-gray-50'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          <span className="font-medium text-red-600">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-gray-500 mt-1">
          PNG, JPG, WEBP up to {maxSizePerFile}MB (max {maxFiles} files)
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-700 whitespace-pre-line">{error}</p>
        </div>
      )}

      {/* Image Previews */}
      {previews.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            Selected Images ({previews.length}/{maxFiles})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {previews.map((preview) => (
              <div key={preview.id} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={preview.url}
                    alt={preview.file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removePreview(preview.id);
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
                
                {/* File Info */}
                <div className="mt-1">
                  <p className="text-xs text-gray-600 truncate" title={preview.file.name}>
                    {preview.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(preview.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <div className="flex">
          <PhotoIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">Image Upload Tips:</p>
            <ul className="mt-1 list-disc list-inside space-y-1 text-xs">
              <li>For wine labels: Take clear, well-lit photos of front and back labels</li>
              <li>For memory photos: Capture special moments, meals, or occasions</li>
              <li>Images will be automatically compressed and optimized</li>
              <li>Recommended resolution: At least 800x600 pixels</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;