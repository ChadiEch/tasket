import React from 'react';

const DraggableTaskItem = ({ task, isAdmin, onTaskClick, onDragStart, onDragEnd, isDragging }) => {
  // Function to determine task styling based on priority and status
  const getTaskStyling = () => {
    if (task.status === 'completed') {
      return 'bg-green-100 text-green-800 line-through';
    } else if (task.priority === 'high' || task.priority === 'urgent') {
      return 'bg-red-100 text-red-800';
    } else if (task.status === 'completed') {
      return 'bg-green-100 text-green-800';
    } else {
      return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div
      draggable={isAdmin} // Only admins can drag tasks
      onDragStart={(e) => isAdmin && onDragStart(e, task)}
      onDragEnd={(e) => isAdmin && onDragEnd(e, task)}
      onClick={(e) => {
        e.stopPropagation();
        onTaskClick(task);
      }}
      className={`text-xs p-1 rounded truncate cursor-pointer hover:bg-opacity-80 ${getTaskStyling()} ${
        isAdmin ? 'cursor-move touch-manipulation' : 'cursor-pointer'
      } ${isDragging ? 'opacity-50 ring-2 ring-blue-500' : ''}`}
      title={`${task.title}${isAdmin ? ' (Drag to move)' : ''}`}
    >
      {task.title}
      {isAdmin && (
        <span className="ml-1 text-xs opacity-70">⋮⋮</span>
      )}
    </div>
  );
};

export default DraggableTaskItem;