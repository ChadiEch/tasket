import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { tasksAPI } from '../lib/api';
import { TrashIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';

const TrashPage = () => {
  const { tasks, setTasks } = useApp();
  const [trashedTasks, setTrashedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    fetchTrashedTasks();
  }, []);

  useEffect(() => {
    if (selectAll) {
      setSelectedTasks(trashedTasks.map(task => task.id));
    } else {
      setSelectedTasks([]);
    }
  }, [selectAll, trashedTasks]);

  const fetchTrashedTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await tasksAPI.getTrashedTasks();
      setTrashedTasks(response.tasks || []);
    } catch (err) {
      console.error('Error fetching trashed tasks:', err);
      setError('Failed to load trashed tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (taskId) => {
    try {
      await tasksAPI.restoreTask(taskId);
      // Remove from trashed tasks list
      setTrashedTasks(prev => prev.filter(task => task.id !== taskId));
      // Remove from selected tasks if it was selected
      setSelectedTasks(prev => prev.filter(id => id !== taskId));
      // Show success message
      alert('Task restored successfully');
    } catch (err) {
      console.error('Error restoring task:', err);
      alert('Failed to restore task');
    }
  };

  const handlePermanentDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to permanently delete this task? This action cannot be undone.')) {
      return;
    }

    try {
      await tasksAPI.permanentlyDeleteTask(taskId);
      // Remove from trashed tasks list
      setTrashedTasks(prev => prev.filter(task => task.id !== taskId));
      // Remove from selected tasks if it was selected
      setSelectedTasks(prev => prev.filter(id => id !== taskId));
      // Show success message
      alert('Task permanently deleted');
    } catch (err) {
      console.error('Error permanently deleting task:', err);
      alert('Failed to permanently delete task');
    }
  };

  const handleBulkRestore = async () => {
    if (selectedTasks.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to restore ${selectedTasks.length} task(s)?`)) {
      return;
    }

    try {
      const results = await Promise.allSettled(
        selectedTasks.map(taskId => tasksAPI.restoreTask(taskId))
      );
      
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;
      
      // Remove restored tasks from the list
      setTrashedTasks(prev => prev.filter(task => !selectedTasks.includes(task.id)));
      setSelectedTasks([]);
      setSelectAll(false);
      
      if (failed > 0) {
        alert(`Restored ${successful} task(s). Failed to restore ${failed} task(s).`);
      } else {
        alert(`Successfully restored ${successful} task(s).`);
      }
    } catch (err) {
      console.error('Error during bulk restore:', err);
      alert('Failed to restore tasks');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTasks.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedTasks.length} task(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const results = await Promise.allSettled(
        selectedTasks.map(taskId => tasksAPI.permanentlyDeleteTask(taskId))
      );
      
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;
      
      // Remove deleted tasks from the list
      setTrashedTasks(prev => prev.filter(task => !selectedTasks.includes(task.id)));
      setSelectedTasks([]);
      setSelectAll(false);
      
      if (failed > 0) {
        alert(`Permanently deleted ${successful} task(s). Failed to delete ${failed} task(s).`);
      } else {
        alert(`Successfully permanently deleted ${successful} task(s).`);
      }
    } catch (err) {
      console.error('Error during bulk delete:', err);
      alert('Failed to delete tasks');
    }
  };

  const handleSelectTask = (taskId) => {
    if (selectedTasks.includes(taskId)) {
      setSelectedTasks(prev => prev.filter(id => id !== taskId));
    } else {
      setSelectedTasks(prev => [...prev, taskId]);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <XMarkIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Trash</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage deleted tasks. Tasks in trash will be automatically deleted after 30 days.
        </p>
      </div>

      {trashedTasks.length > 0 && (
        <div className="mb-4 flex justify-between items-center">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={() => setSelectAll(!selectAll)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Select all ({trashedTasks.length} tasks)
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleBulkRestore}
              disabled={selectedTasks.length === 0}
              className={`inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md ${
                selectedTasks.length === 0
                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  : 'text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              Restore Selected
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={selectedTasks.length === 0}
              className={`inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md ${
                selectedTasks.length === 0
                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  : 'text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
              }`}
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {trashedTasks.length === 0 ? (
        <div className="text-center py-12">
          <TrashIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks in trash</h3>
          <p className="mt-1 text-sm text-gray-500">
            Tasks you delete will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {trashedTasks.map((task) => (
              <li key={task.id} className={selectedTasks.includes(task.id) ? 'bg-indigo-50' : ''}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedTasks.includes(task.id)}
                        onChange={() => handleSelectTask(task.id)}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <div className="ml-4 flex-1 min-w-0">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            {task.title}
                          </p>
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Trashed
                          </span>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <p>
                            Trashed on: {formatDate(task.trashed_at)}
                          </p>
                        </div>
                        {task.description && (
                          <div className="mt-1 text-sm text-gray-500">
                            <p className="truncate">{task.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex space-x-2">
                      <button
                        onClick={() => handleRestore(task.id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <ArrowPathIcon className="h-4 w-4 mr-1" />
                        Restore
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(task.id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <XMarkIcon className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TrashPage;