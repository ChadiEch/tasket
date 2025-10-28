import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import TaskDetail from './TaskDetail';

const Meistertask = () => {
  const { tasks, projects, employees, currentUser, isAdmin, updateTask, createTask } = useApp();
  const { user } = useAuth();
  
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectColumns, setProjectColumns] = useState([]);
  const [boardColumns, setBoardColumns] = useState([
    { id: 'backlog', title: 'Backlog', color: 'bg-gray-200' },
    { id: 'todo', title: 'To Do', color: 'bg-blue-200' },
    { id: 'in-progress', title: 'In Progress', color: 'bg-yellow-200' },
    { id: 'review', title: 'Review', color: 'bg-purple-200' },
    { id: 'done', title: 'Done', color: 'bg-green-200' }
  ]);
  
  const [showColumnForm, setShowColumnForm] = useState(false);
  const [editingColumn, setEditingColumn] = useState(null);
  const [columnFormData, setColumnFormData] = useState({
    title: '',
    color: 'bg-gray-200'
  });
  
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  
  // Load project columns when a project is selected
  useEffect(() => {
    if (selectedProject && selectedProject.columns) {
      setProjectColumns(selectedProject.columns);
    } else {
      setProjectColumns([]);
    }
  }, [selectedProject]);
  
  // Get the columns to display (project columns if project selected, otherwise default columns)
  const getDisplayColumns = () => {
    return selectedProject && projectColumns.length > 0 ? projectColumns : boardColumns;
  };
  
  // Group tasks by status for the board
  const getTasksByColumn = () => {
    const columns = getDisplayColumns();
    const columnTasks = {};
    
    // Initialize empty arrays for each column
    columns.forEach(column => {
      columnTasks[column.id] = [];
    });
    
    // Filter tasks by project if a project is selected
    let filteredTasks = tasks.filter(task => {
      // Filter by project
      if (selectedProject && task.project_id !== selectedProject.id) return false;
      
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
        if (columnTasks['backlog']) {
          columnTasks['backlog'].push(task);
        }
      }
    });
    
    return columnTasks;
  };
  
  const tasksByColumn = getTasksByColumn();
  const displayColumns = getDisplayColumns();
  
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
  
  const handleAddColumn = () => {
    setEditingColumn(null);
    setColumnFormData({ title: '', color: 'bg-gray-200' });
    setShowColumnForm(true);
  };
  
  const handleEditColumn = (column) => {
    setEditingColumn(column);
    setColumnFormData({ title: column.title, color: column.color });
    setShowColumnForm(true);
  };
  
  const handleDeleteColumn = (columnId) => {
    if (window.confirm('Are you sure you want to delete this column? All tasks in this column will be moved to Backlog.')) {
      if (selectedProject) {
        setProjectColumns(prev => prev.filter(col => col.id !== columnId));
      } else {
        setBoardColumns(prev => prev.filter(col => col.id !== columnId));
      }
    }
  };
  
  const handleSaveColumn = () => {
    if (!columnFormData.title.trim()) return;
    
    const newColumn = {
      id: columnFormData.title.toLowerCase().replace(/\s+/g, '-'),
      title: columnFormData.title,
      color: columnFormData.color
    };
    
    if (editingColumn) {
      // Update existing column
      if (selectedProject) {
        setProjectColumns(prev => 
          prev.map(col => 
            col.id === editingColumn.id 
              ? { ...col, title: columnFormData.title, color: columnFormData.color }
              : col
          )
        );
      } else {
        setBoardColumns(prev => 
          prev.map(col => 
            col.id === editingColumn.id 
              ? { ...col, title: columnFormData.title, color: columnFormData.color }
              : col
          )
        );
      }
    } else {
      // Add new column
      if (selectedProject) {
        setProjectColumns(prev => [...prev, newColumn]);
      } else {
        setBoardColumns(prev => [...prev, newColumn]);
      }
    }
    
    setShowColumnForm(false);
    setEditingColumn(null);
    setColumnFormData({ title: '', color: 'bg-gray-200' });
  };
  
  const handleCloseColumnForm = () => {
    setShowColumnForm(false);
    setEditingColumn(null);
    setColumnFormData({ title: '', color: 'bg-gray-200' });
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
  
  const handleProjectSelect = (projectId) => {
    if (!projectId) {
      setSelectedProject(null);
      return;
    }
    
    const project = projects.find(p => p.id === projectId);
    setSelectedProject(project);
  };
  
  // Calculate stats for overview
  const calculateStats = () => {
    // Filter tasks by project if a project is selected
    const filteredTasks = tasks.filter(task => {
      if (selectedProject && task.project_id !== selectedProject.id) return false;
      if (!isAdmin && task.assigned_to !== currentUser?.id) return false;
      return true;
    });
    
    const completedTasks = filteredTasks.filter(task => task.status === 'done');
    const inProgressTasks = filteredTasks.filter(task => task.status === 'in-progress');
    const overdueTasks = filteredTasks.filter(task => {
      if (!task.due_date) return false;
      const dueDate = new Date(task.due_date);
      const now = new Date();
      return dueDate < now && task.status !== 'done';
    });
    
    return {
      total: filteredTasks.length,
      completed: completedTasks.length,
      inProgress: inProgressTasks.length,
      overdue: overdueTasks.length
    };
  };
  
  const stats = calculateStats();
  
  return (
    <div className="p-6">
      {/* Project Selector */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <label htmlFor="project-select" className="text-sm font-medium text-gray-700">
            Select Project:
          </label>
          <select
            id="project-select"
            value={selectedProject?.id || ''}
            onChange={(e) => handleProjectSelect(e.target.value)}
            className="block w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">All Tasks (No Project)</option>
            {projects && projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
          
          {selectedProject && (
            <div className="flex items-center">
              <span className="text-sm text-gray-600">
                Project: <span className="font-medium">{selectedProject.title}</span>
              </span>
              <button 
                onClick={() => setSelectedProject(null)}
                className="ml-2 text-sm text-indigo-600 hover:text-indigo-800"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {selectedProject ? `${selectedProject.title} Board` : 'MeisterTask Board'}
        </h1>
        <p className="text-gray-600">
          {selectedProject ? `Tasks for project: ${selectedProject.title}` : 'Visual task management with Kanban boards'}
        </p>
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
            {employees && employees.map(employee => (
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
        
        <div className="flex space-x-2">
          <button
            onClick={handleCreateTask}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            + Add Task
          </button>
          <button
            onClick={handleAddColumn}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            + Add Column
          </button>
        </div>
      </div>
      
      {/* Kanban Board */}
      <div className="overflow-x-auto">
        <div className="flex space-x-4 min-w-max">
          {displayColumns.map(column => (
            <div 
              key={column.id}
              className="flex-shrink-0 w-80"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className={`rounded-t-lg px-4 py-2 ${column.color}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-800">{column.title}</h3>
                    <span className="text-sm text-gray-600">({tasksByColumn[column.id]?.length || 0})</span>
                  </div>
                  <div className="flex space-x-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditColumn(column);
                      }}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    {displayColumns.length > 1 && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteColumn(column.id);
                        }}
                        className="text-gray-600 hover:text-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-b-lg min-h-96 p-4">
                {tasksByColumn[column.id] && tasksByColumn[column.id].map(task => (
                  <TaskCard 
                    key={task.id}
                    task={task}
                    employees={employees}
                    onEdit={handleEditTask}
                    onView={handleViewTask}
                    onDragStart={handleDragStart}
                  />
                ))}
                
                {(!tasksByColumn[column.id] || tasksByColumn[column.id].length === 0) && (
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
          project={selectedProject}
          onClose={handleCloseTaskForm}
          onCreate={createTask}
          onUpdate={updateTask}
        />
      )}
      
      {/* Column Form Modal */}
      {showColumnForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900">
                {editingColumn ? 'Edit Column' : 'Add New Column'}
              </h3>
              
              <div className="mt-6 space-y-4">
                <div>
                  <label htmlFor="columnTitle" className="block text-sm font-medium text-gray-700">
                    Column Title *
                  </label>
                  <input
                    type="text"
                    id="columnTitle"
                    value={columnFormData.title}
                    onChange={(e) => setColumnFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Column Color
                  </label>
                  <div className="mt-1 grid grid-cols-6 gap-2">
                    {[
                      'bg-gray-200', 'bg-blue-200', 'bg-yellow-200', 
                      'bg-purple-200', 'bg-green-200', 'bg-red-200',
                      'bg-pink-200', 'bg-indigo-200', 'bg-teal-200'
                    ].map(color => (
                      <button
                        key={color}
                        onClick={() => setColumnFormData(prev => ({ ...prev, color }))}
                        className={`w-8 h-8 rounded-full ${color} ${columnFormData.color === color ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseColumnForm}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveColumn}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                  >
                    {editingColumn ? 'Update Column' : 'Add Column'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Meistertask;