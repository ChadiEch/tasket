import React, { useState, useEffect } from 'react';

const BulkAttachmentManager = ({ attachments, onDownload, onDelete, getAttachmentUrl }) => {
  const [selectedAttachments, setSelectedAttachments] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isSelectionMode) return;
      
      if (e.key === 'Escape') {
        // Exit selection mode
        e.preventDefault();
        setIsSelectionMode(false);
        setSelectedAttachments(new Set());
      } else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        // Ctrl+A or Cmd+A to select all
        e.preventDefault();
        selectAllAttachments();
      } else if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
        // Ctrl+D or Cmd+D to deselect all
        e.preventDefault();
        setSelectedAttachments(new Set());
      } else if (e.key === 'Enter' && selectedAttachments.size > 0) {
        // Enter to download selected attachments
        e.preventDefault();
        handleBulkDownload();
      } else if (e.key === 'Delete' && selectedAttachments.size > 0) {
        // Delete key to remove selected attachments
        e.preventDefault();
        handleBulkDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSelectionMode, selectedAttachments]);

  // Filter different types of attachments
  const photosAndVideos = attachments.filter(attachment => 
    attachment.type === 'photo' || attachment.type === 'video'
  );
  const documents = attachments.filter(attachment => attachment.type === 'document');
  const links = attachments.filter(attachment => attachment.type === 'link');

  // Toggle selection for a specific attachment
  const toggleAttachmentSelection = (id) => {
    const newSelected = new Set(selectedAttachments);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedAttachments(newSelected);
  };

  // Select all attachments
  const selectAllAttachments = () => {
    if (selectedAttachments.size === attachments.length) {
      // If all are selected, deselect all
      setSelectedAttachments(new Set());
    } else {
      // Select all
      const allIds = new Set(attachments.map(attachment => attachment.id));
      setSelectedAttachments(allIds);
    }
  };

  // Handle bulk download
  const handleBulkDownload = () => {
    if (onDownload) {
      onDownload(Array.from(selectedAttachments));
    }
    // Clear selection after download
    setSelectedAttachments(new Set());
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (onDelete) {
      onDelete(Array.from(selectedAttachments));
    }
    // Clear selection after delete
    setSelectedAttachments(new Set());
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    // Clear selection when exiting selection mode
    if (isSelectionMode) {
      setSelectedAttachments(new Set());
    }
  };

  // Render attachment with selection indicator
  const renderAttachmentWithSelection = (attachment) => {
    const isSelected = selectedAttachments.has(attachment.id);
    
    return (
      <div 
        key={attachment.id}
        className={`relative group cursor-pointer border rounded-md p-2 ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
        }`}
        onClick={() => isSelectionMode && toggleAttachmentSelection(attachment.id)}
        onKeyDown={(e) => {
          if (isSelectionMode && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            toggleAttachmentSelection(attachment.id);
          }
        }}
        tabIndex={isSelectionMode ? 0 : -1}
        role={isSelectionMode ? "checkbox" : undefined}
        aria-checked={isSelectionMode ? isSelected : undefined}
      >
        {/* Selection indicator */}
        {isSelectionMode && (
          <div className={`absolute top-1 right-1 w-5 h-5 rounded-full border flex items-center justify-center ${
            isSelected 
              ? 'bg-blue-500 border-blue-500' 
              : 'bg-white border-gray-300'
          }`}>
            {isSelected && (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        )}
        
        {/* Attachment content */}
        <div className="flex items-center">
          {attachment.type === 'photo' ? (
            <img 
              src={getAttachmentUrl ? getAttachmentUrl(attachment) : attachment.url} 
              alt={attachment.name}
              className="w-10 h-10 object-cover rounded mr-2"
              onError={(e) => {
                console.error('Error loading thumbnail:', e);
                // Try to reload the image with a cache-busting parameter
                const img = e.target;
                if (!img.src.includes('?t=')) {
                  img.src = (getAttachmentUrl ? getAttachmentUrl(attachment) : attachment.url) + '?t=' + Date.now();
                }
              }}
            />
          ) : attachment.type === 'video' ? (
            <div className="w-10 h-10 flex items-center justify-center bg-purple-100 rounded mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
            </div>
          ) : attachment.type === 'document' ? (
            <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          ) : (
            <div className="w-10 h-10 flex items-center justify-center bg-green-100 rounded mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{attachment.name}</p>
            <p className="text-xs text-gray-500 capitalize">{attachment.type}</p>
          </div>
        </div>
      </div>
    );
  };

  if (attachments.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">No attachments added</p>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 pt-4">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-medium text-gray-500">Attachments</h4>
        <div className="flex space-x-2">
          <button
            onClick={toggleSelectionMode}
            className={`px-2 py-1 text-xs rounded ${
              isSelectionMode 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title={isSelectionMode ? "Exit selection mode (Esc)" : "Enter selection mode"}
          >
            {isSelectionMode ? 'Cancel' : 'Select'}
          </button>
          
          {isSelectionMode && (
            <>
              <button
                onClick={selectAllAttachments}
                className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                title="Select all (Ctrl+A)"
              >
                {selectedAttachments.size === attachments.length ? 'Deselect All' : 'Select All'}
              </button>
              
              {selectedAttachments.size > 0 && (
                <>
                  <button
                    onClick={handleBulkDownload}
                    className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                    title="Download selected (Enter)"
                  >
                    Download ({selectedAttachments.size})
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                    title="Delete selected (Delete)"
                  >
                    Delete ({selectedAttachments.size})
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Photos and Videos */}
      {photosAndVideos.length > 0 && (
        <div className="mb-4">
          <h5 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Media</h5>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {photosAndVideos.map(renderAttachmentWithSelection)}
          </div>
        </div>
      )}

      {/* Documents and Links */}
      {(documents.length > 0 || links.length > 0) && (
        <div>
          <h5 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Files & Links</h5>
          <div className="space-y-2">
            {documents.map(renderAttachmentWithSelection)}
            {links.map(renderAttachmentWithSelection)}
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkAttachmentManager;