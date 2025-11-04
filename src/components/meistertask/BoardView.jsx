import React from 'react';
import TaskCard from './TaskCard';

const BoardView = ({ 
  project, 
  columns, 
  tasksByColumn, 
  employees, 
  onEditTask, 
  onViewTask, 
  onCreateTask, 
  onDragStart,
  onDragOver,
  onDrop
}) => {
  return (
    <div className="overflow-x-auto">
      <div className="flex space-x-4 min-w-max">
        {columns.map(column => (
          <div 
            key={column.id}
            className="flex-shrink-0 w-80"
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, column.id)}
          >
            <div className={`rounded-t-lg px-4 py-2 ${column.color}`}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-800">{column.title}</h3>
                  <span className="text-sm text-gray-600">({tasksByColumn[column.id]?.length || 0})</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-b-lg min-h-96 p-4">
              {/* Add Task Button inside each column */}
              <button
                onClick={() => onCreateTask(column.id)}
                className="w-full mb-4 px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Task
              </button>
              
              {tasksByColumn[column.id] && tasksByColumn[column.id].map(task => (
                <TaskCard 
                  key={task.id}
                  task={task}
                  employees={employees}
                  onEdit={onEditTask}
                  onView={onViewTask}
                  onDragStart={onDragStart}
                />
              ))}
              
              {(!tasksByColumn[column.id] || tasksByColumn[column.id].length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <p>No tasks in this section</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BoardView;