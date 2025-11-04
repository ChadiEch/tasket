import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import ProjectList from './ProjectList';
import BoardView from './BoardView';
import TaskDetail from './TaskDetail';
import TaskForm from './TaskForm';
import ProjectForm from '../projects/ProjectForm';

const Meistertask = () => {
  const { tasks, meistertaskProjects: projects, employees, currentUser, isAdmin, updateTask, createTask, updateMeistertaskProject: updateProject, createMeistertaskProject: createProject, fetchAllData } = useApp();
  const { user } = useAuth();
  
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  
  // Default columns matching MeisterTask.com
  const defaultColumns = [
    { id: 'open', title: 'Open', color: 'bg-blue-200' },
    { id: 'in-progress', title: 'In Progress', color: 'bg-yellow-200' },
    { id: 'done', title: 'Done', color: 'bg-green-200' }
  ];
  
  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      await fetchAllData();
    };
    fetchData();
  }, [fetchAllData]);
  
  // Group tasks by status for the board
  const getTasksByColumn = () => {
    const columnTasks = {};
    
    // Initialize empty arrays for each column
    defaultColumns.forEach(column => {
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
      
      return true;
    });
    
    // Group tasks by status
    filteredTasks.forEach(task => {
      const status = task.status || 'open';
      if (columnTasks[status]) {
        columnTasks[status].push(task);
      } else {
        // If task status doesn't match any column, put it in open
        if (columnTasks['open']) {
          columnTasks['open'].push(task);
        }
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
  
  const handleProjectSaved = async (project) => {
    setShowProjectForm(false);
    setEditingProject(null);
    // If we were editing the currently selected project, update it
    if (selectedProject && selectedProject.id === project.id) {
      setSelectedProject(project);
    }
    
    // Refresh the project list
    await fetchAllData();
  };
  
  const handleProjectCancelled = () => {
    setShowProjectForm(false);
    setEditingProject(null);
  };
  
  const handleCreateTask = (columnId) => {
    setEditingTask(null);
    setShowTaskForm(true);
  };
  
  const handleTaskSaved = async () => {
    setShowTaskForm(false);
    setEditingTask(null);
    // Refresh data
    await fetchAllData();
  };
  
  const handleTaskCancelled = () => {
    setShowTaskForm(false);
    setEditingTask(null);
  };
  
  return (
    <div className="p-6">
      {/* Project Form Modal */}
      {showProjectForm && (
        <ProjectForm
          project={editingProject}
          onSaved={handleProjectSaved}
          onCancelled={handleProjectCancelled}
          isMeistertaskProject={true}
        />
      )}
      
      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          task={editingTask}
          project={selectedProject}
          onClose={handleTaskCancelled}
          onSaved={handleTaskSaved}
        />
      )}
      
      {/* Show project list when no project is selected */}
      {!selectedProject ? (
        <ProjectList 
          onProjectSelect={handleProjectSelect}
          onCreateProject={handleCreateProject}
        />
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
              {selectedProject.title}
            </h1>
            <p className="text-gray-600">
              {selectedProject.description || 'No description provided'}
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
                onClick={() => {
                  setFilterAssignee('');
                  setFilterPriority('');
                  setSearchTerm('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Clear Filters
              </button>
            </div>
          </div>
          
          {/* Kanban Board */}
          <BoardView
            project={selectedProject}
            columns={defaultColumns}
            tasksByColumn={tasksByColumn}
            employees={employees}
            onEditTask={handleEditTask}
            onViewTask={handleViewTask}
            onCreateTask={handleCreateTask}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
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
    </div>
  );
};

export default Meistertask;