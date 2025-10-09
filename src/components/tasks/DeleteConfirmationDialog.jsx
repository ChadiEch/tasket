import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const DeleteConfirmationDialog = ({ task, onConfirm, onCancel }) => {
  const [action, setAction] = useState('trash');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Delete Task</h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete the task "<strong>{task.title}</strong>"?
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  id="trash-option"
                  name="delete-action"
                  type="radio"
                  checked={action === 'trash'}
                  onChange={() => setAction('trash')}
                  className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <label htmlFor="trash-option" className="ml-3 block text-sm font-medium text-gray-700">
                  Move to Trash
                  <p className="text-gray-500 text-xs mt-1">
                    Task will be moved to trash where you can restore it later. It will be automatically deleted after 30 days.
                  </p>
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="delete-option"
                  name="delete-action"
                  type="radio"
                  checked={action === 'delete'}
                  onChange={() => setAction('delete')}
                  className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <label htmlFor="delete-option" className="ml-3 block text-sm font-medium text-gray-700">
                  Delete Permanently
                  <p className="text-gray-500 text-xs mt-1">
                    Task and all attachments will be permanently deleted. This action cannot be undone.
                  </p>
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm(action)}
              className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                action === 'trash' 
                  ? 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500' 
                  : 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
              }`}
            >
              {action === 'trash' ? 'Move to Trash' : 'Delete Permanently'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationDialog;