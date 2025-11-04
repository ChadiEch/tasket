import React from 'react';
import { format } from 'date-fns';
import { useApp } from '../../context/AppContext';

const TaskDetail = ({ task, employees, onClose, onEdit }) => {
  const { updateTask } = useApp();
  
  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  const assignee = employees.find(emp => emp.id === task.assigned_to);
  const statusLabels = {
    'open': 'Open',
    'in-progress': 'In Progress',
    'done': 'Done'
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await updateTask(task.id, { status: newStatus });
      // Refresh the task data
      window.location.reload();
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Failed to update task status');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-medium text-gray-900">
              {task.title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mt-4 space-y-4">
            {task.description && (
              <div>
                <h4 className="text-sm font-medium text-gray-700">Description</h4>
                <p className="mt-1 text-gray-600">{task.description}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Status</h4>
                <div className="mt-1 flex space-x-2">
                  {Object.keys(statusLabels).map(status => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        task.status === status 
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {statusLabels[status]}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700">Priority</h4>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${priorityColors[task.priority] || 'bg-gray-100'}`}>
                  {task.priority}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {task.due_date && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Due Date</h4>
                  <p className="mt-1 text-gray-600">
                    {format(new Date(task.due_date), 'MMMM d, yyyy')}
                  </p>
                </div>
              )}
              
              {assignee && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Assignee</h4>
                  <div className="mt-1 flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-indigo-800">
                        {assignee.name.charAt(0)}
                      </span>
                    </div>
                    <span className="ml-2 text-gray-600">{assignee.name}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={() => onEdit(task)}
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