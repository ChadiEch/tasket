import React from 'react';
import { format } from 'date-fns';

const TaskListItem = ({ task, onEdit, onView }) => {
  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  const statusColors = {
    planned: 'bg-gray-100 text-gray-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    trashed: 'bg-red-100 text-red-800'
  };

  return (
    <tr 
      className="hover:bg-gray-50 cursor-pointer"
      onClick={() => onView(task)}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{task.title}</div>
        {task.description && (
          <div className="text-sm text-gray-500 truncate max-w-xs">{task.description}</div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[task.status] || 'bg-gray-100'}`}>
          {task.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[task.priority] || 'bg-gray-100'}`}>
          {task.priority}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : 'No due date'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          className="text-indigo-600 hover:text-indigo-900 mr-3"
        >
          Edit
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView(task);
          }}
          className="text-gray-600 hover:text-gray-900"
        >
          View
        </button>
      </td>
    </tr>
  );
};

export default TaskListItem;