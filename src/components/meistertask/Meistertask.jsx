import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import TaskDetail from './TaskDetail';
import ProjectForm from '../projects/ProjectForm';

const Meistertask = () => {
  const { tasks, projects, employees, currentUser, isAdmin, updateTask, createTask, addTaskState, updateProject } = useApp();
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
  
  // Project management states
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  
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
      
      // For non-admin users, show all tasks in the selected project
      // For admin users, show all tasks in the selected project
      // If no project selected, show all tasks
      if (selectedProject) {
        return task.project_id === selectedProject.id;
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
  
  const handleCreateTask = (columnId) => {
    setEditingTask(null);
    // Pass the columnId to pre-select the status in the task form
    setShowTaskForm({ columnId });
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
  
  const handleDeleteColumn = async (columnId) => {
    if (window.confirm('Are you sure you want to delete this column? All tasks in this column will be moved to Backlog.')) {
      if (selectedProject) {
        // Update project columns
        const updatedColumns = projectColumns.filter(col => col.id !== columnId);
        setProjectColumns(updatedColumns);
        
        // Save to backend
        await handleSaveProjectColumns(updatedColumns);
      } else {
        setBoardColumns(prev => prev.filter(col => col.id !== columnId));
      }
    }
  };
  
  const handleSaveColumn = async () => {
    if (!columnFormData.title.trim()) return;
    
    const newColumn = {
      id: columnFormData.title.toLowerCase().replace(/\s+/g, '-'),
      title: columnFormData.title,
      color: columnFormData.color
    };
    
    if (editingColumn) {
      // Update existing column
      if (selectedProject) {
        const updatedColumns = projectColumns.map(col => 
          col.id === editingColumn.id 
            ? { ...col, title: columnFormData.title, color: columnFormData.color }
            : col
        );
        setProjectColumns(updatedColumns);
        
        // Save to backend
        await handleSaveProjectColumns(updatedColumns);
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
        const updatedColumns = [...projectColumns, newColumn];
        setProjectColumns(updatedColumns);
        
        // Save to backend
        await handleSaveProjectColumns(updatedColumns);
      } else {
        setBoardColumns(prev => [...prev, newColumn]);
      }
    }
    
    setShowColumnForm(false);
    setEditingColumn(null);
    setColumnFormData({ title: '', color: 'bg-gray-200' });
  };
  
  // Save project columns to the backend
  const handleSaveProjectColumns = async (columns) => {
    if (!selectedProject) return;
    
    try {
      // Save columns to the project in the backend
      const updatedProject = await updateProject(selectedProject.id, { columns });
      console.log('Project columns saved:', updatedProject);
      
      // Update the selected project with the new columns
      setSelectedProject(updatedProject);
    } catch (error) {
      console.error('Error saving project columns:', error);
      alert('Failed to save project columns');
    }
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
  
  const handleProjectSelect = (project) => {
    setSelectedProject(project);
  };
  
  const handleBackToProjects = () => {
    setSelectedProject(null);
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
  
  // Project management functions
  const handleCreateProject = () => {
    setEditingProject(null);
    setShowProjectForm(true);
  };
  
  const handleEditProject = (project) => {
    setEditingProject(project);
    setShowProjectForm(true);
  };
  
  const handleProjectSaved = (project) => {
    setShowProjectForm(false);
    setEditingProject(null);
    // If we were editing the currently selected project, update it
    if (selectedProject && selectedProject.id === project.id) {
      setSelectedProject(project);
    }
  };
  
  const handleProjectCancelled = () => {
    setShowProjectForm(false);
    setEditingProject(null);
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  return (
    <div className="p-6">
      {/* Project Form Modal */}
      {showProjectForm && (
        <ProjectForm
          project={editingProject}
          onSaved={handleProjectSaved}
          onCancelled={handleProjectCancelled}
        />
      )}
      
      {/* Show project cards when no project is selected */}
      {!selectedProject ? (
        <div>
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Meistertask Projects</h1>
                <p className="text-gray-600">Select a project to view its tasks</p>
              </div>
              {isAdmin && (
                <button
                  onClick={handleCreateProject}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  + Create Project
                </button>
              )}
            </div>
          </div>
          
          {/* Project Cards */}
          {projects && projects.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No projects</h3>
              <p className="mt-1 text-gray-500">Get started by creating a new project.</p>
              {isAdmin && (
                <div className="mt-6">
                  <button
                    onClick={handleCreateProject}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create New Project
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects && projects.map((project) => (
                <div key={project.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium text-gray-900">{project.title}</h3>
                      {isAdmin && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditProject(project)}
                            className="text-gray-400 hover:text-gray-500"
                          >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-gray-600">{project.description || 'No description provided'}</p>
                    <div className="mt-4 flex items-center text-sm text-gray-500">
                      <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      {formatDate(project.start_date)} - {formatDate(project.end_date)}
                    </div>
                  </div>
                  <div className="bg-gray-50 px-6 py-3 flex justify-between items-center">
                    <button
                      onClick={() => handleProjectSelect(project)}
                      className="text-indigo-600 hover:text-indigo-900 font-medium"
                    >
                      View Tasks
                    </button>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {formatDate(project.start_date) <= new Date().toISOString().split('T')[0] && 
                       formatDate(project.end_date) >= new Date().toISOString().split('T')[0] ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Show Kanban board when a project is selected
        <div>
          {/* Project Header */}
          <div className="mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <button 
                onClick={handleBackToProjects}
                className="flex items-center text-indigo-600 hover:text-indigo-800"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Projects
              </button>
              
              {isAdmin && (
                <button
                  onClick={() => handleEditProject(selectedProject)}
                  className="flex items-center text-gray-600 hover:text-gray-800"
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Project
                </button>
              )}
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedProject.title} Board
            </h1>
            <p className="text-gray-600">
              Tasks for project: {selectedProject.title}
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
                    {/* Add Task Button inside each column */}
                    <button
                      onClick={() => handleCreateTask(column.id)}
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
        </div>
      )}
      
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
          columnId={showTaskForm.columnId} // Pass the columnId to pre-select status
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