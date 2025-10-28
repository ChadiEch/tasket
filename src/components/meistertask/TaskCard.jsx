import React from 'react';
import { format } from 'date-fns';

const TaskCard = ({ task, employees, onEdit, onView, onDragStart }) => {
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

  const assignee = employees.find(emp => emp.id === task.assigned_to);

  return (
    <div 
      className="bg-white rounded-lg shadow mb-3 p-3 cursor-pointer hover:shadow-md transition-shadow"
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onClick={() => onView(task)}
    >
      <div className="flex justify-between items-start">
        <h4 className="font-medium text-gray-900 text-sm truncate">{task.title}</h4>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          className="text-gray-400 hover:text-gray-600 ml-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </button>
      </div>
      
      {task.description && (
        <p className="mt-1 text-xs text-gray-600 line-clamp-2">
          {task.description}
        </p>
      )}
      
      <div className="mt-2 flex flex-wrap gap-1">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[task.priority] || 'bg-gray-100'}`}>
          {task.priority}
        </span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[task.status] || 'bg-gray-100'}`}>
          {task.status}
        </span>
      </div>
      
      <div className="mt-3 flex items-center justify-between">
        {task.due_date && (
          <div className="flex items-center text-xs text-gray-500">
            <svg className="flex-shrink-0 mr-1 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            {format(new Date(task.due_date), 'MMM d')}
          </div>
        )}
        
        {assignee && (
          <div className="flex items-center">
            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-xs font-medium text-indigo-800">
                {assignee.name.charAt(0)}
              </span>
            </div>
          </div>
        )}
      </div>
      
      {task.attachments && task.attachments.length > 0 && (
        <div className="mt-2 flex items-center text-xs text-gray-500">
          <svg className="flex-shrink-0 mr-1 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
          </svg>
          <span>{task.attachments.length} attachment(s)</span>
        </div>
      )}
    </div>
  );
};

export default TaskCard;