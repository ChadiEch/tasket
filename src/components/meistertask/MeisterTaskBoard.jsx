import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import TaskDetail from './TaskDetail';

const MeisterTaskBoard = () => {
  const { tasks, projects, employees, currentUser, isAdmin, updateTask, createTask } = useApp();
  const { user } = useAuth();
  
  // Default board columns (similar to MeisterTask's Kanban board)
  const [boardColumns, setBoardColumns] = useState([
    { id: 'backlog', title: 'Backlog', color: 'bg-gray-200' },
    { id: 'todo', title: 'To Do', color: 'bg-blue-200' },
    { id: 'in-progress', title: 'In Progress', color: 'bg-yellow-200' },
    { id: 'review', title: 'Review', color: 'bg-purple-200' },
    { id: 'done', title: 'Done', color: 'bg-green-200' }
  ]);
  
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  
  // Group tasks by status for the board
  const getTasksByColumn = () => {
    const columnTasks = {};
    
    // Initialize empty arrays for each column
    boardColumns.forEach(column => {
      columnTasks[column.id] = [];
    });
    
    // Filter and sort tasks
    let filteredTasks = tasks.filter(task => {
      // Filter by search term
      if (searchTerm && 
          !task.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !task.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Filter by assignee
      if (filterAssignee && task.assigned_to !== filterAssignee) {
        return false;
      }
      
      // Filter by priority
      if (filterPriority && task.priority !== filterPriority) {
        return false;
      }
      
      // For non-admin users, only show their tasks
      if (!isAdmin && task.assigned_to !== currentUser?.id) {
        return false;
      }
      
      return true;
    });
    
    // Group tasks by status
    filteredTasks.forEach(task => {
      const status = task.status || 'backlog';
      if (columnTasks[status]) {
        columnTasks[status].push(task);
      } else {
        // If task status doesn't match any column, put it in backlog
        columnTasks['backlog'].push(task);
      }
    });
    
    return columnTasks;
  };
  
  const tasksByColumn = getTasksByColumn();
  
  // Handle drag start
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  // Handle drop
  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    
    if (draggedTask && draggedTask.status !== newStatus) {
      try {
        // Update task status
        const updatedTask = await updateTask(draggedTask.id, { status: newStatus });
        console.log('Task updated:', updatedTask);
      } catch (error) {
        console.error('Error updating task:', error);
        alert('Failed to update task status');
      }
    }
    
    setDraggedTask(null);
  };
  
  const handleCreateTask = () => {
    setEditingTask(null);
    setShowTaskForm(true);
  };
  
  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };
  
  const handleViewTask = (task) => {
    setSelectedTask(task);
  };
  
  const handleCloseTaskDetail = () => {
    setSelectedTask(null);
  };
  
  const handleCloseTaskForm = () => {
    setShowTaskForm(false);
    setEditingTask(null);
  };
  
  // Calculate stats for overview
  const calculateStats = () => {
    const allTasks = tasks.filter(task => {
      if (!isAdmin && task.assigned_to !== currentUser?.id) return false;
      return true;
    });
    
    const completedTasks = allTasks.filter(task => task.status === 'done');
    const inProgressTasks = allTasks.filter(task => task.status === 'in-progress');
    const overdueTasks = allTasks.filter(task => {
      if (!task.due_date) return false;
      const dueDate = new Date(task.due_date);
      const now = new Date();
      return dueDate < now && task.status !== 'done';
    });
    
    return {
      total: allTasks.length,
      completed: completedTasks.length,
      inProgress: inProgressTasks.length,
      overdue: overdueTasks.length
    };
  };
  
  const stats = calculateStats();
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">MeisterTask Board</h1>
        <p className="text-gray-600">Visual task management with Kanban boards</p>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Total Tasks</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Completed</div>
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">In Progress</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Overdue</div>
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Assignees</option>
            {employees.map(employee => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
          
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        
        <button
          onClick={handleCreateTask}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          + Add Task
        </button>
      </div>
      
      {/* Kanban Board */}
      <div className="overflow-x-auto">
        <div className="flex space-x-4 min-w-max">
          {boardColumns.map(column => (
            <div 
              key={column.id}
              className="flex-shrink-0 w-80"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className={`rounded-t-lg px-4 py-2 ${column.color}`}>
                <h3 className="font-semibold text-gray-800">{column.title}</h3>
                <span className="text-sm text-gray-600">({tasksByColumn[column.id].length})</span>
              </div>
              <div className="bg-gray-50 rounded-b-lg min-h-96 p-4">
                {tasksByColumn[column.id].map(task => (
                  <TaskCard 
                    key={task.id}
                    task={task}
                    employees={employees}
                    onEdit={handleEditTask}
                    onView={handleViewTask}
                    onDragStart={handleDragStart}
                  />
                ))}
                
                {tasksByColumn[column.id].length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No tasks in this column</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetail 
          task={selectedTask}
          employees={employees}
          onClose={handleCloseTaskDetail}
          onEdit={handleEditTask}
        />
      )}
      
      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm 
          task={editingTask}
          employees={employees}
          onClose={handleCloseTaskForm}
          onCreate={createTask}
          onUpdate={updateTask}
        />
      )}
    </div>
  );
};

export default MeisterTaskBoard;