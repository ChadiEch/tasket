import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { format } from 'date-fns';

const TaskForm = ({ task, onClose, project }) => {
  const { createTask, updateTask, employees, projects } = useApp();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'planned',
    priority: 'medium',
    assigned_to: '',
    project_id: project?.id || '',
    due_date: '',
    attachments: [],
    linkToCalendar: false,
    addToMeistertask: true // Add this new field
  });
  
  const [errors, setErrors] = useState({});
  
  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      formData.attachments.forEach(attachment => {
        if (attachment.url && attachment.url.startsWith('blob:')) {
          URL.revokeObjectURL(attachment.url);
        }
      });
    };
  }, [formData.attachments]);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'planned',
        priority: task.priority || 'medium',
        assigned_to: task.assigned_to || '',
        project_id: task.project_id || project?.id || '',
        due_date: task.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd') : '',
        attachments: task.attachments || [],
        linkToCalendar: false,
        addToMeistertask: !!task.project_id // Set based on existing project association
      });
    } else if (project) {
      setFormData(prev => ({
        ...prev,
        project_id: project.id,
        addToMeistertask: true
      }));
    }
  }, [task, project]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const handleImageUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Convert files to preview URLs and add to attachments
    const newAttachments = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        newAttachments.push({
          id: Date.now() + i, // Simple ID generation
          type: 'image',
          name: file.name,
          url: url,
          file: file // Keep reference to actual file
        });
      }
    }
    
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...newAttachments]
    }));
  };
  
  const removeAttachment = (attachmentId) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter(att => att.id !== attachmentId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const taskData = {
        ...formData,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null
      };
      
      // Remove the linkToCalendar and addToMeistertask fields as they're only for UI purposes
      delete taskData.linkToCalendar;
      delete taskData.addToMeistertask;
      
      // If addToMeistertask is false, remove project_id
      if (!formData.addToMeistertask) {
        delete taskData.project_id;
      }
      
      // Remove file references from attachments before sending to backend
      const attachmentsWithoutFiles = taskData.attachments.map(att => {
        const { file, ...rest } = att;
        return rest;
      });
      taskData.attachments = attachmentsWithoutFiles;
      
      if (task) {
        // Update existing task
        await updateTask(task.id, taskData);
      } else {
        // Create new task
        await createTask(taskData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      // Handle error appropriately
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900">
            {task ? 'Edit Task' : 'Create New Task'}
          </h3>
          
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`mt-1 block w-full border ${errors.title ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="backlog">Backlog</option>
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700">
                  Assignee
                </label>
                <select
                  id="assigned_to"
                  name="assigned_to"
                  value={formData.assigned_to}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Unassigned</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} ({employee.position})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="project_id" className="block text-sm font-medium text-gray-700">
                  Project
                </label>
                <div className="flex items-center">
                  <input
                    id="addToMeistertask"
                    name="addToMeistertask"
                    type="checkbox"
                    checked={formData.addToMeistertask}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-2"
                  />
                  <label htmlFor="addToMeistertask" className="block text-sm text-gray-900 mr-2">
                    Add to Meistertask
                  </label>
                  <select
                    id="project_id"
                    name="project_id"
                    value={formData.project_id}
                    onChange={handleChange}
                    disabled={!formData.addToMeistertask}
                    className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${!formData.addToMeistertask ? 'bg-gray-100' : ''}`}
                  >
                    <option value="">Select a project</option>
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  id="linkToCalendar"
                  name="linkToCalendar"
                  type="checkbox"
                  checked={formData.linkToCalendar}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="linkToCalendar" className="ml-2 block text-sm text-gray-900">
                  Link to calendar event
                </label>
              </div>
            </div>
            
            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
                Due Date
              </label>
              <input
                type="date"
                id="due_date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Attach Images
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="image-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                      <span>Upload images</span>
                      <input 
                        id="image-upload" 
                        name="image-upload" 
                        type="file" 
                        className="sr-only" 
                        accept="image/*" 
                        multiple 
                        onChange={handleImageUpload}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
              
              {/* Preview of uploaded images */}
              {formData.attachments.filter(att => att.type === 'image').length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Image Previews</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {formData.attachments
                      .filter(att => att.type === 'image')
                      .map((attachment, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={attachment.url} 
                            alt="Preview" 
                            className="h-20 w-full object-cover rounded"
                          />
                          <button
                            type="button"
                            onClick={() => removeAttachment(attachment.id)}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
              >
                {task ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskForm;