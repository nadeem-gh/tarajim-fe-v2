'use client'

import { useState } from 'react'
import { 
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PhotoIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

interface ImageData {
  id: number
  image_id: string
  image_path: string
  alt_text: string
  position_in_chapter: number
  associated_text_blocks: string[]
  image_data_base64?: string
  mime_type?: string
}

interface ImageViewerProps {
  images: ImageData[]
  isOpen: boolean
  onClose: () => void
  initialIndex?: number
}

export default function ImageViewer({
  images,
  isOpen,
  onClose,
  initialIndex = 0
}: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  if (!isOpen || images.length === 0) {
    return null
  }

  const currentImage = images[currentIndex]
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < images.length - 1

  const goToPrevious = () => {
    if (hasPrevious) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const goToNext = () => {
    if (hasNext) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowLeft' && hasPrevious) {
      goToPrevious()
    } else if (e.key === 'ArrowRight' && hasNext) {
      goToNext()
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="relative max-w-4xl max-h-[90vh] w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-medium text-white">
              Image {currentIndex + 1} of {images.length}
            </h3>
            <div className="flex items-center text-sm text-gray-300">
              <PhotoIcon className="h-4 w-4 mr-1" />
              Position {currentImage.position_in_chapter}
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-white hover:text-gray-300 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Image Container */}
        <div className="bg-white rounded-lg overflow-hidden">
          <div className="relative">
            {/* Navigation Arrows */}
            {hasPrevious && (
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-all"
              >
                <ChevronLeftIcon className="h-6 w-6" />
              </button>
            )}
            
            {hasNext && (
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-all"
              >
                <ChevronRightIcon className="h-6 w-6" />
              </button>
            )}

            {/* Image Display */}
            <div className="aspect-w-16 aspect-h-9 bg-gray-100 flex items-center justify-center">
              {currentImage.image_data_base64 ? (
                <img
                  src={`data:${currentImage.mime_type || 'image/jpeg'};base64,${currentImage.image_data_base64}`}
                  alt={currentImage.alt_text}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-center p-8">
                  <PhotoIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Image not available</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {currentImage.image_path}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Image Information */}
          <div className="p-6 border-t border-gray-200">
            <div className="space-y-4">
              {/* Image Details */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Image Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Path:</span>
                    <p className="text-gray-900 font-mono text-xs break-all">
                      {currentImage.image_path}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Alt Text:</span>
                    <p className="text-gray-900">
                      {currentImage.alt_text || 'No alt text provided'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Position:</span>
                    <p className="text-gray-900">
                      {currentImage.position_in_chapter}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <p className="text-gray-900">
                      {currentImage.mime_type || 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Associated Text Blocks */}
              {currentImage.associated_text_blocks && currentImage.associated_text_blocks.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <InformationCircleIcon className="h-4 w-4 mr-1" />
                    Associated Text
                  </h4>
                  <div className="space-y-2">
                    {currentImage.associated_text_blocks.map((text, index) => (
                      <div key={index} className="bg-gray-50 rounded p-3">
                        <p className="text-sm text-gray-700">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Dots */}
        {images.length > 1 && (
          <div className="flex justify-center mt-4 space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentIndex 
                    ? 'bg-white' 
                    : 'bg-gray-500 hover:bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
