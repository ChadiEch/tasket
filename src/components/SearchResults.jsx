import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const SearchResults = ({ onBack }) => {
  const { searchTerm, searchTasks, navigateTo } = useApp();
  const results = searchTasks(searchTerm);
  const [viewingPhotos, setViewingPhotos] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'planned':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Helper function to construct proper attachment URL
  const getAttachmentUrl = (attachment) => {
    if (attachment.type === 'link') {
      return attachment.url;
    } else {
      // For documents, photos, and videos, if it's a local URL, use it as is for display
      if (attachment.url && attachment.url.startsWith('/uploads/')) {
        // Get the base URL for the server (without /api)
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';
        // Remove /api from the URL if present to get the server root
        const serverBaseUrl = apiBaseUrl.replace(/\/api$/, '');
        // Ensure we don't have double slashes
        const cleanBaseUrl = serverBaseUrl.endsWith('/') ? serverBaseUrl.slice(0, -1) : serverBaseUrl;
        const cleanAttachmentUrl = attachment.url.startsWith('/') ? attachment.url : `/${attachment.url}`;
        const finalUrl = `${cleanBaseUrl}${cleanAttachmentUrl}`;
        return finalUrl;
      }
      // If it's already a full URL or no URL, return as is
      return attachment.url || '';
    }
  };

  // Open media viewer for photos
  const openMediaViewer = (photos, startIndex = 0) => {
    setViewingPhotos(photos);
    setCurrentPhotoIndex(startIndex);
  };

  // Close media viewer
  const closeMediaViewer = () => {
    setViewingPhotos(null);
    setCurrentPhotoIndex(0);
  };

  // Navigate to next photo
  const nextPhoto = () => {
    if (viewingPhotos && viewingPhotos.length > 0) {
      setCurrentPhotoIndex((prevIndex) => 
        prevIndex === viewingPhotos.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  // Navigate to previous photo
  const prevPhoto = () => {
    if (viewingPhotos && viewingPhotos.length > 0) {
      setCurrentPhotoIndex((prevIndex) => 
        prevIndex === 0 ? viewingPhotos.length - 1 : prevIndex - 1
      );
    }
  };

  // Handle keyboard navigation in media viewer
  const handleKeyDown = (e) => {
    if (viewingPhotos) {
      if (e.key === 'Escape') {
        closeMediaViewer();
      } else if (e.key === 'ArrowRight') {
        nextPhoto();
      } else if (e.key === 'ArrowLeft') {
        prevPhoto();
      }
    }
  };

  // Add keyboard event listener
  React.useEffect(() => {
    if (viewingPhotos) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [viewingPhotos]);

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigateTo('calendar')}
          className="flex items-center text-indigo-600 hover:text-indigo-800 mr-4"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Calendar
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">
          Search Results for "{searchTerm}"
        </h1>
      </div>

      <div className="mb-4 text-gray-600">
        Found {results.length} task{results.length !== 1 ? 's' : ''}
      </div>

      {results.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks found</h3>
          <p className="mt-1 text-sm text-gray-500">
            No tasks match your search criteria. Try different keywords.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map(task => (
            <div key={task.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between space-y-3 sm:space-y-0">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`}></div>
                      <h3 className="text-base md:text-lg font-medium text-gray-900">{task.title}</h3>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(task.status)} self-start`}>
                      {task.status.replace('-', ' ')}
                    </span>
                  </div>
                  
                  {task.description && (
                    <p className="text-gray-600 mb-3 text-sm md:text-base">{task.description}</p>
                  )}
                  
                  {/* Attachments Preview with Thumbnails */}
                  {task.attachments && task.attachments.length > 0 && (
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {task.attachments.slice(0, 4).map((attachment) => (
                          <div 
                            key={attachment.id} 
                            className="relative cursor-pointer group"
                            onClick={() => {
                              if (attachment.type === 'photo') {
                                // Open media viewer for photos
                                const photos = task.attachments.filter(a => a.type === 'photo');
                                const photoIndex = photos.findIndex(a => a.id === attachment.id);
                                openMediaViewer(photos, photoIndex);
                              } else if (attachment.type === 'video') {
                                // Open in new tab for videos
                                window.open(getAttachmentUrl(attachment), '_blank');
                              }
                            }}
                          >
                            {attachment.type === 'photo' ? (
                              <img 
                                src={getAttachmentUrl(attachment)} 
                                alt={attachment.name}
                                className="w-16 h-16 object-cover rounded border border-gray-200"
                                onError={(e) => {
                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik00IDFhMiAyIDAgMCAwLTIgMnYxNGEyIDIgMCAwIDAgMiAyaDE2YTIgMiAwIDAgMCAyLTJ2LTE0YTIgMiAwIDAgMC0yLTJoLTE2eiI+PC9wYXRoPjxwb2x5bGluZSBwb2ludHM9IjMgMTEgOSAxNyAxNSAxMSI+PC9wb2x5bGluZT48L3N2Zz4=';
                                }}
                              />
                            ) : attachment.type === 'video' ? (
                              <div className="w-16 h-16 bg-red-100 rounded border border-gray-200 flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </div>
                            ) : attachment.type === 'document' ? (
                              <div className="w-16 h-16 bg-blue-100 rounded border border-gray-200 flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs text-center truncate px-1">
                              {attachment.type === 'photo' ? '📷' : attachment.type === 'video' ? '📹' : attachment.type === 'document' ? '📄' : '🔗'}
                            </div>
                          </div>
                        ))}
                        {task.attachments.length > 4 && (
                          <div className="w-16 h-16 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                            <span className="text-xs text-gray-600">+{task.attachments.length - 4}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {task.attachments.length} attachment{task.attachments.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs md:text-sm text-gray-500">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                    </div>
                    
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="truncate">{task.assignedToEmployee?.name || 'Unassigned'}</span>
                    </div>
                    
                    {task.department && (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="truncate">{task.department.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Media Viewer Modal */}
      {viewingPhotos && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative w-full h-full max-w-4xl max-h-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={closeMediaViewer}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Navigation arrows */}
            {viewingPhotos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 z-10"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 z-10"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
            
            {/* Photo counter */}
            {viewingPhotos.length > 1 && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 rounded-full px-3 py-1 text-sm">
                {currentPhotoIndex + 1} / {viewingPhotos.length}
              </div>
            )}
            
            {/* Photo */}
            {viewingPhotos[currentPhotoIndex] && (
              <img
                src={getAttachmentUrl(viewingPhotos[currentPhotoIndex])}
                alt={viewingPhotos[currentPhotoIndex].name}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTE0LjEgMTQuMkwxMiAxNi4zbC0yLjEtMi4xIj48L3BhdGg+PHBhdGggZD0iTTE0LjEgMTQuMkwxMiAxNi4zbC0yLjEtMi4xIj48L3BhdGg+PHBhdGggZD0iTTE0IDEwLjVoLjAxIj48L3BhdGg+PHBhdGggZD0iTTkgMTBoLjAxIj48L3BhdGg+PHBhdGggZD0iTTcgMTJoMiI+PC9wYXRoPjxwYXRoIGQ9Ik01IDVhMiAyIDAgMCAxIDIgMmgxNGEyIDIgMCAwIDEgMiAydjE0YTIgMiAwIDAgMS0yIDJIN2EyIDIgMCAwIDEtMi0yVjV6Ij48L3BhdGg+PC9zdmc+';
                }}
              />
            )}
            
            {/* Photo name */}
            {viewingPhotos[currentPhotoIndex] && (
              <div className="absolute bottom-4 left-0 right-0 text-center text-white bg-black bg-opacity-50 px-3 py-2 mx-auto max-w-md rounded-lg truncate">
                {viewingPhotos[currentPhotoIndex].name}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResults;