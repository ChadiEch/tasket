import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { projectsAPI } from '../../lib/api';
import AttachmentViewer from '../AttachmentViewer'; // Added import

const ProjectTasks = () => {
  const { navigateTo, selectedProject: project, currentUser } = useApp(); // Added currentUser
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewingPhotos, setViewingPhotos] = useState(null); // Added state for photo viewing
  const [photoIndex, setPhotoIndex] = useState(0); // Added state for photo index
  const [startDate, setStartDate] = useState(''); // Added state for start date filter
  const [endDate, setEndDate] = useState(''); // Added state for end date filter

  useEffect(() => {
    if (project) {
      fetchProjectTasks();
    }
  }, [project]);

  const fetchProjectTasks = async () => {
    try {
      setLoading(true);
      // Pass date range parameters if they are set
      const params = {};
      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      const response = await projectsAPI.getProjectTasks(project.id, params);
      setTasks(response.tasks || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigateTo('projects');
  };

  const handleFilter = () => {
    // Validate that both dates are provided
    if (startDate && endDate) {
      fetchProjectTasks();
    }
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    fetchProjectTasks();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

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

  const renderAttachments = (attachments) => {
    if (!attachments || attachments.length === 0) {
      return <span className="text-gray-500">No attachments</span>;
    }

    // Separate photos, videos, and documents
    const photosAndVideos = attachments.filter(attachment => 
      attachment.type === 'photo' || attachment.type === 'video'
    );
    const documents = attachments.filter(attachment => 
      attachment.type !== 'photo' && attachment.type !== 'video'
    );

    return (
      <div className="mt-2">
        {photosAndVideos.length > 0 && (
          <div className="mt-2">
            <h4 className="text-sm font-medium text-gray-700">Media:</h4>
            <div className="flex flex-wrap gap-2 mt-1">
              {photosAndVideos.map((media, index) => (
                <div 
                  key={index} 
                  className="relative cursor-pointer"
                  onClick={() => {
                    setViewingPhotos(photosAndVideos);
                    setPhotoIndex(index);
                  }}
                >
                  {media.type === 'photo' ? (
                    <img 
                      src={getAttachmentUrl(media)} 
                      alt={media.name || `Photo ${index + 1}`}
                      className="h-16 w-16 object-cover rounded-md border border-gray-300"
                    />
                  ) : (
                    // Video thumbnail
                    <div className="h-16 w-16 flex items-center justify-center bg-gray-100 rounded-md border border-gray-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {documents.length > 0 && (
          <div className="mt-2">
            <h4 className="text-sm font-medium text-gray-700">Documents:</h4>
            <ul className="mt-1 space-y-1">
              {documents.map((document, index) => (
                <li key={index} className="flex items-center text-sm">
                  <svg className="flex-shrink-0 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  <a 
                    href={getAttachmentUrl(document)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 text-indigo-600 hover:text-indigo-900 truncate"
                  >
                    {document.name || `Document ${index + 1}`}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {attachments.length === 0 && (
          <span className="text-gray-500">No attachments</span>
        )}
      </div>
    );
  };

  if (!project) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">No project selected.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="flex items-center text-indigo-600 hover:text-indigo-900 mb-4"
        >
          <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Projects
        </button>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
              <p className="mt-2 text-gray-600">{project.description || 'No description provided'}</p>
              <div className="mt-4 flex items-center text-sm text-gray-500">
                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                {formatDate(project.start_date)} - {formatDate(project.end_date)}
              </div>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {formatDate(project.start_date) <= new Date().toISOString().split('T')[0] && 
               formatDate(project.end_date) >= new Date().toISOString().split('T')[0] ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Tasks by Date Range</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex items-end space-x-2">
            <button
              onClick={handleFilter}
              disabled={!startDate || !endDate}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Apply Filter
            </button>
            <button
              onClick={handleClearFilter}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Tasks in this Project</h2>
          <p className="mt-1 text-sm text-gray-500">
            {startDate && endDate 
              ? `Showing tasks created between ${formatDate(startDate)} and ${formatDate(endDate)}`
              : `Showing all tasks in this project`
            }
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 m-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No tasks found</h3>
            <p className="mt-1 text-gray-500">
              {startDate && endDate 
                ? `There are no tasks created between ${formatDate(startDate)} and ${formatDate(endDate)}.`
                : "There are no tasks in this project."
              }
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {tasks.map((task) => (
              <li key={task.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">{task.title}</p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                    
                    {task.description && (
                      <p className="mt-1 text-sm text-gray-500">{task.description}</p>
                    )}
                    
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Created:</span> {formatDateTime(task.created_at)}
                      </div>
                      
                      {task.due_date && (
                        <div className="text-sm text-gray-500">
                          <span className="font-medium">Due Date:</span> {formatDate(task.due_date)}
                        </div>
                      )}
                      
                      {task.start_date && (
                        <div className="text-sm text-gray-500">
                          <span className="font-medium">Start Date:</span> {formatDateTime(task.start_date)}
                        </div>
                      )}
                      
                      {task.completed_date && (
                        <div className="text-sm text-gray-500">
                          <span className="font-medium">Completed:</span> {formatDateTime(task.completed_date)}
                        </div>
                      )}
                      
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Estimated Hours:</span> {task.estimated_hours}
                      </div>
                      
                      {task.actual_hours !== null && (
                        <div className="text-sm text-gray-500">
                          <span className="font-medium">Actual Hours:</span> {task.actual_hours}
                        </div>
                      )}
                      
                      {task.assignedToEmployee && (
                        <div className="text-sm text-gray-500">
                          <span className="font-medium">Assigned to:</span> {task.assignedToEmployee.name}
                        </div>
                      )}
                      
                      {task.createdByEmployee && (
                        <div className="text-sm text-gray-500">
                          <span className="font-medium">Created by:</span> {task.createdByEmployee.name}
                        </div>
                      )}
                      
                      {task.department && (
                        <div className="text-sm text-gray-500">
                          <span className="font-medium">Department:</span> {task.department.name}
                        </div>
                      )}
                      
                      {task.project && (
                        <div className="text-sm text-gray-500">
                          <span className="font-medium">Project:</span> {task.project.title}
                        </div>
                      )}
                    </div>
                    
                    {task.tags && task.tags.length > 0 && (
                      <div className="mt-2">
                        <span className="text-sm font-medium text-gray-700">Tags:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {task.tags.map((tag, index) => (
                            <span 
                              key={index} 
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {renderAttachments(task.attachments)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Added AttachmentViewer component */}
      {viewingPhotos && (
        <AttachmentViewer 
          attachments={viewingPhotos} 
          initialIndex={photoIndex} 
          onClose={() => setViewingPhotos(null)} 
        />
      )}
    </div>
  );
};

export default ProjectTasks;