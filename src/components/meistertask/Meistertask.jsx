import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import TaskBoard from './TaskBoard';
import TaskList from './TaskList';
import TaskDetail from './TaskDetail';
import TaskForm from './TaskForm';
import ProjectSelector from './ProjectSelector';
import FilterPanel from './FilterPanel';
import SearchBar from './SearchBar';
import StatsOverview from './StatsOverview';

const Meistertask = () => {
  const { tasks, projects, employees, departments, currentUser, isAdmin } = useApp();
  const { user } = useAuth();
  
  const [view, setView] = useState('board'); // 'board', 'list', 'calendar'
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assignee: '',
    dueDate: ''
  });
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Filter and sort tasks
  const filteredTasks = tasks.filter(task => {
    // Filter by project
    if (selectedProject && task.project_id !== selectedProject.id) return false;
    
    // Filter by search term
    if (searchTerm && 
        !task.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !task.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filter by status
    if (filters.status && task.status !== filters.status) return false;
    
    // Filter by priority
    if (filters.priority && task.priority !== filters.priority) return false;
    
    // Filter by assignee
    if (filters.assignee && task.assigned_to !== filters.assignee) return false;
    
    // Filter by due date
    if (filters.dueDate) {
      const taskDueDate = new Date(task.due_date);
      const now = new Date();
      
      switch (filters.dueDate) {
        case 'today':
          if (taskDueDate.toDateString() !== now.toDateString()) return false;
          break;
        case 'overdue':
          if (taskDueDate >= now) return false;
          break;
        case 'week':
          const weekFromNow = new Date();
          weekFromNow.setDate(weekFromNow.getDate() + 7);
          if (taskDueDate < now || taskDueDate > weekFromNow) return false;
          break;
        default:
          break;
      }
    }
    
    // For non-admin users, only show their tasks
    if (!isAdmin && task.assigned_to !== currentUser?.id) return false;
    
    return true;
  }).sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    // Handle date sorting
    if (sortBy === 'due_date' || sortBy === 'created_at') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Get tasks grouped by status for board view
  const tasksByStatus = {
    'planned': filteredTasks.filter(task => task.status === 'planned'),
    'in-progress': filteredTasks.filter(task => task.status === 'in-progress'),
    'completed': filteredTasks.filter(task => task.status === 'completed'),
    'trashed': filteredTasks.filter(task => task.status === 'trashed')
  };

  // Get user's tasks for personal view
  const myTasks = tasks.filter(task => task.assigned_to === currentUser?.id);

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

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      assignee: '',
      dueDate: ''
    });
    setSearchTerm('');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Meistertask</h1>
        <p className="text-gray-600">Project management and task tracking</p>
      </div>

      {/* Project Selector and Controls */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <ProjectSelector 
          projects={projects}
          selectedProject={selectedProject}
          onProjectSelect={handleProjectSelect}
        />
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setView('board')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              view === 'board' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Board
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              view === 'list' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            List
          </button>
          <button
            onClick={handleCreateTask}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            + New Task
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <SearchBar 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
          <FilterPanel 
            filters={filters}
            onFilterChange={handleFilterChange}
            employees={employees}
            clearFilters={clearFilters}
          />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="mb-6">
        <StatsOverview 
          tasks={filteredTasks}
          myTasks={myTasks}
        />
      </div>

      {/* Main Content */}
      <div className="mb-6">
        {view === 'board' && (
          <TaskBoard 
            tasksByStatus={tasksByStatus}
            onEditTask={handleEditTask}
            onViewTask={handleViewTask}
          />
        )}
        
        {view === 'list' && (
          <TaskList 
            tasks={filteredTasks}
            onEditTask={handleEditTask}
            onViewTask={handleViewTask}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={(field, order) => {
              setSortBy(field);
              setSortOrder(order);
            }}
          />
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetail 
          task={selectedTask}
          onClose={handleCloseTaskDetail}
          onEdit={handleEditTask}
        />
      )}

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm 
          task={editingTask}
          onClose={handleCloseTaskForm}
          project={selectedProject}
        />
      )}
    </div>
  );
};

export default Meistertask;