import React, { useState, useEffect } from 'react';

const AttachmentViewer = ({ attachments, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(true);

  // Filter to show both photos and videos
  const mediaAttachments = attachments.filter(attachment => 
    attachment.type === 'photo' || attachment.type === 'video'
  );
  
  // If no media attachments, close the viewer
  useEffect(() => {
    if (mediaAttachments.length === 0) {
      onClose();
    }
  }, [mediaAttachments.length, onClose]);

  // Reset loading state when current index changes
  useEffect(() => {
    setIsLoading(true);
  }, [currentIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  // Helper function to construct proper attachment URL
  const getAttachmentUrl = (attachment) => {
    console.log('Constructing URL for attachment:', attachment);
    
    // If it's already a full URL, return it as is
    if (attachment.url && (attachment.url.startsWith('http://') || attachment.url.startsWith('https://'))) {
      console.log('Returning full URL as is:', attachment.url);
      return attachment.url;
    }
    
    // If it's a link type, return the URL as is
    if (attachment.type === 'link') {
      console.log('Returning link URL as is:', attachment.url);
      return attachment.url;
    }
    
    // For documents and photos, construct the full URL if it's a relative path
    if (attachment.url && attachment.url.startsWith('/uploads/')) {
      console.log('Constructing URL for relative path:', attachment.url);
      
      // Try to get the base URL from environment variables
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';
      console.log('API Base URL from env:', apiBaseUrl);
      
      // If we don't have a base URL from env, construct it from window.location
      if (!apiBaseUrl) {
        // Use the current origin but remove any /api path
        const origin = window.location.origin;
        const baseUrl = origin.replace(/\/api$/, '');
        console.log('Constructed base URL from origin:', baseUrl);
        const finalUrl = `${baseUrl}${attachment.url}`;
        console.log('Final URL:', finalUrl);
        return finalUrl;
      }
      
      // Remove /api from the URL if present to get the server root
      const serverBaseUrl = apiBaseUrl.replace(/\/api$/, '');
      console.log('Server base URL:', serverBaseUrl);
      // Ensure we don't have double slashes
      const cleanBaseUrl = serverBaseUrl.endsWith('/') ? serverBaseUrl.slice(0, -1) : serverBaseUrl;
      const cleanAttachmentUrl = attachment.url.startsWith('/') ? attachment.url : `/${attachment.url}`;
      const finalUrl = `${cleanBaseUrl}${cleanAttachmentUrl}`;
      console.log('Final URL:', finalUrl);
      return finalUrl;
    }
    
    // If it's already a full URL or no URL, return as is
    console.log('Returning URL as is:', attachment.url || '');
    return attachment.url || '';
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? mediaAttachments.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === mediaAttachments.length - 1 ? 0 : prevIndex + 1
    );
  };

  const currentMedia = mediaAttachments[currentIndex];

  if (mediaAttachments.length === 0) {
    return null;
  }

  const mediaUrl = currentMedia ? getAttachmentUrl(currentMedia) : '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
        aria-label="Close viewer"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Navigation arrows */}
      {mediaAttachments.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 text-white hover:text-gray-300 z-10 p-2 rounded-full bg-black bg-opacity-30 hover:bg-opacity-50 transition-all"
            aria-label="Previous media"
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-4 text-white hover:text-gray-300 z-10 p-2 rounded-full bg-black bg-opacity-30 hover:bg-opacity-50 transition-all"
            aria-label="Next media"
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Media counter */}
      {mediaAttachments.length > 1 && (
        <div className="absolute top-4 left-4 text-white bg-black bg-opacity-50 px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} of {mediaAttachments.length}
        </div>
      )}

      {/* Media name */}
      {currentMedia && (
        <div className="absolute bottom-4 left-0 right-0 text-center text-white bg-black bg-opacity-50 px-3 py-2 mx-auto max-w-md rounded-lg truncate">
          {currentMedia.name}
        </div>
      )}

      {/* Media display */}
      <div className="flex items-center justify-center w-full h-full">
        {currentMedia && (
          <>
            {currentMedia.type === 'photo' ? (
              <img
                src={mediaUrl}
                alt={currentMedia.name || `Photo ${currentIndex + 1}`}
                className="max-h-[90vh] max-w-full object-contain"
                onLoad={() => setIsLoading(false)}
                onError={(e) => {
                  console.error('Error loading image:', e);
                  setIsLoading(false);
                  // Try to reload the image with a cache-busting parameter
                  const img = e.target;
                  if (!img.src.includes('?t=')) {
                    img.src = mediaUrl + '?t=' + Date.now();
                  }
                }}
              />
            ) : (
              <video
                src={mediaUrl}
                controls
                className="max-h-[90vh] max-w-full object-contain"
                onLoadedData={() => setIsLoading(false)}
                onError={() => setIsLoading(false)}
              >
                Your browser does not support the video tag.
              </video>
            )}
          </>
        )}
        
        {isLoading && (
          <div className="text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="mt-2">Loading media...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttachmentViewer;