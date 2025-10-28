import React from 'react';
import TaskCard from './TaskCard';

const TaskBoard = ({ tasksByStatus, onEditTask, onViewTask }) => {
  const statusConfig = {
    'planned': { title: 'Planned', color: 'bg-gray-200' },
    'in-progress': { title: 'In Progress', color: 'bg-blue-200' },
    'completed': { title: 'Completed', color: 'bg-green-200' },
    'trashed': { title: 'Trashed', color: 'bg-red-200' }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Object.entries(tasksByStatus).map(([status, tasks]) => (
        <div key={status} className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">
              {statusConfig[status]?.title || status} 
              <span className="ml-2 bg-gray-200 text-gray-800 text-xs font-medium px-2 py-0.5 rounded-full">
                {tasks.length}
              </span>
            </h3>
          </div>
          
          <div className="space-y-3 min-h-96">
            {tasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onEdit={onEditTask}
                onView={onViewTask}
              />
            ))}
            
            {tasks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No tasks in this column</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskBoard;