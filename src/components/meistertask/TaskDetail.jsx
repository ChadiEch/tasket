import React from 'react';
import { format } from 'date-fns';
import { useApp } from '../../context/AppContext';

const TaskDetail = ({ task, onClose, onEdit }) => {
  const { employees, projects } = useApp();
  
  // Ensure projects is an array to prevent errors
  const safeProjects = Array.isArray(projects) ? projects : [];
  
  const assignee = employees.find(emp => emp.id === task.assigned_to);
  const project = safeProjects.find(proj => proj.id === task.project_id);
  
  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  const statusColors = {
    backlog: 'bg-gray-100 text-gray-800',
    todo: 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-yellow-100 text-yellow-800',
    review: 'bg-purple-100 text-purple-800',
    done: 'bg-green-100 text-green-800'
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
              {task.description && (
                <p className="mt-2 text-gray-600">{task.description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Status</h4>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${statusColors[task.status] || 'bg-gray-100'}`}>
                {task.status}
              </span>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Priority</h4>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${priorityColors[task.priority] || 'bg-gray-100'}`}>
                {task.priority}
              </span>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Assignee</h4>
              <p className="mt-1 text-sm text-gray-900">
                {assignee ? `${assignee.name} (${assignee.position})` : 'Unassigned'}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Project</h4>
              <p className="mt-1 text-sm text-gray-900">
                {project ? project.title : 'No project'} {/* Changed from project.name to project.title */}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Created</h4>
              <p className="mt-1 text-sm text-gray-900">
                {format(new Date(task.created_at), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Due Date</h4>
              <p className="mt-1 text-sm text-gray-900">
                {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : 'No due date'}
              </p>
            </div>
          </div>
          
          {/* Image Gallery */}
          {task.attachments && task.attachments.filter(att => att.type === 'image').length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-500">Images</h4>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {task.attachments
                  .filter(att => att.type === 'image')
                  .map((attachment, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={attachment.url} 
                        alt={attachment.name} 
                        className="h-32 w-full object-cover rounded"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                        {attachment.name}
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
          
          {/* Other Attachments */}
          {task.attachments && task.attachments.filter(att => att.type !== 'image').length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-500">Other Attachments</h4>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {task.attachments
                  .filter(att => att.type !== 'image')
                  .map((attachment, index) => (
                    <div key={index} className="flex items-center p-2 bg-gray-50 rounded-md">
                      <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-2 text-sm text-gray-900 truncate">{attachment.name}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
          
          <div className="mt-8 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={() => {
                onEdit(task);
                onClose();
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
            >
              Edit Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;