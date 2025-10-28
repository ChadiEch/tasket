import React from 'react';
import TaskListItem from './TaskListItem';

const TaskList = ({ tasks, onEditTask, onViewTask, sortBy, sortOrder, onSortChange }) => {
  const handleSort = (field) => {
    if (sortBy === field) {
      // Toggle sort order
      onSortChange(field, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field
      onSortChange(field, 'asc');
    }
  };

  const getSortIndicator = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('title')}
            >
              <div className="flex items-center">
                Task
                <span className="ml-1">{getSortIndicator('title')}</span>
              </div>
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center">
                Status
                <span className="ml-1">{getSortIndicator('status')}</span>
              </div>
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('priority')}
            >
              <div className="flex items-center">
                Priority
                <span className="ml-1">{getSortIndicator('priority')}</span>
              </div>
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('due_date')}
            >
              <div className="flex items-center">
                Due Date
                <span className="ml-1">{getSortIndicator('due_date')}</span>
              </div>
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tasks.map((task) => (
            <TaskListItem 
              key={task.id} 
              task={task} 
              onEdit={onEditTask}
              onView={onViewTask}
            />
          ))}
          
          {tasks.length === 0 && (
            <tr>
              <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                No tasks found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TaskList;