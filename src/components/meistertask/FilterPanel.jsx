import React from 'react';

const FilterPanel = ({ filters, onFilterChange, employees, clearFilters }) => {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="flex items-center space-x-1">
        <label className="text-sm text-gray-700">Status:</label>
        <select
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
          className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">All</option>
          <option value="planned">Planned</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="trashed">Trashed</option>
        </select>
      </div>
      
      <div className="flex items-center space-x-1">
        <label className="text-sm text-gray-700">Priority:</label>
        <select
          value={filters.priority}
          onChange={(e) => onFilterChange('priority', e.target.value)}
          className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">All</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>
      
      <div className="flex items-center space-x-1">
        <label className="text-sm text-gray-700">Assignee:</label>
        <select
          value={filters.assignee}
          onChange={(e) => onFilterChange('assignee', e.target.value)}
          className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">All</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="flex items-center space-x-1">
        <label className="text-sm text-gray-700">Due:</label>
        <select
          value={filters.dueDate}
          onChange={(e) => onFilterChange('dueDate', e.target.value)}
          className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Any time</option>
          <option value="today">Today</option>
          <option value="overdue">Overdue</option>
          <option value="week">Next 7 days</option>
        </select>
      </div>
      
      <button
        onClick={clearFilters}
        className="text-sm text-indigo-600 hover:text-indigo-800"
      >
        Clear filters
      </button>
    </div>
  );
};

export default FilterPanel;