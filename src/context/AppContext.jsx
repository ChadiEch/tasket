import React, { createContext, useContext, useState, useEffect } from 'react';
import { tasksAPI, departmentsAPI, employeesAPI, projectsAPI, meistertaskProjectsAPI } from '../lib/api';
import { useAuth } from './AuthContext';
import { useWebSocket } from './WebSocketContext';

const AppContext = createContext({});

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { subscribeToTaskUpdates, connected, emitTaskUpdate, subscribeToNotifications } = useWebSocket();
  const [tasks, setTasks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]); // Add projects state
  const [meistertaskProjects, setMeistertaskProjects] = useState([]); // Add Meistertask projects state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Navigation state
  const [currentView, setCurrentView] = useState('calendar');
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // State for filtered tasks view
  const [filteredTasksFilterType, setFilteredTasksFilterType] = useState('overdue');

  // Fetch all data when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchAllData();
    } else {
      // Clear data when not authenticated
      setTasks([]);
      setDepartments([]);
      setEmployees([]);
      setProjects([]); // Clear projects when not authenticated
    }
  }, [isAuthenticated, user]);

  // Subscribe to WebSocket task updates
  useEffect(() => {
    if (connected && subscribeToTaskUpdates) {
      const unsubscribe = subscribeToTaskUpdates((eventData) => {
        if (eventData.type === 'deleted') {
          // Handle task deletion
          setTasks(prev => prev.filter(task => task.id !== eventData.taskId));
        } else {
          // Handle task creation/update
          const updatedTask = eventData.task;
          const updatedBy = eventData.updatedBy;
          
          // Skip if this update was made by the current user to prevent duplicates
          if (updatedBy && user && updatedBy.id === user.id) {
            // Still update the state to ensure consistency
            setTasks(prev => {
              const existingIndex = prev.findIndex(task => task.id === updatedTask.id);
              if (existingIndex >= 0) {
                // Update existing task
                const newTasks = [...prev];
                newTasks[existingIndex] = updatedTask;
                return newTasks;
              } else {
                // Add new task
                return [updatedTask, ...prev];
              }
            });
            return;
          }
          
          setTasks(prev => {
            const existingIndex = prev.findIndex(task => task.id === updatedTask.id);
            if (existingIndex >= 0) {
              // Update existing task
              const newTasks = [...prev];
              newTasks[existingIndex] = updatedTask;
              return newTasks;
            } else {
              // Add new task
              return [updatedTask, ...prev];
            }
          });
        }
      });

      return unsubscribe;
    }
  }, [connected, subscribeToTaskUpdates, user]);

  // Subscribe to WebSocket notifications for employee updates
  useEffect(() => {
    if (connected && subscribeToNotifications) {
      const unsubscribe = subscribeToNotifications((notification) => {
        // Handle employee update notifications
        if (notification.type === 'employee_updated') {
          // Update the specific employee in the employees array
          setEmployees(prev => {
            return prev.map(emp => {
              if (emp.id === notification.data.id) {
                return notification.data;
              }
              return emp;
            });
          });
          
          // Also update selectedEmployee if it matches
          if (selectedEmployee && selectedEmployee.id === notification.data.id) {
            setSelectedEmployee(notification.data);
          }
        }
      });

      return unsubscribe;
    }
  }, [connected, subscribeToNotifications, selectedEmployee]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [tasksResponse, departmentsResponse, employeesResponse, projectsResponse, meistertaskProjectsResponse] = await Promise.all([
        tasksAPI.getTasks(),
        departmentsAPI.getDepartments(),
        employeesAPI.getEmployees(),
        projectsAPI.getProjects(), // Fetch projects
        meistertaskProjectsAPI.getProjects(), // Fetch Meistertask projects
      ]);

      // Filter out any trashed tasks that might have slipped through
      const nonTrashedTasks = (tasksResponse.tasks || []).filter(task => task.status !== 'trashed');
      
      setTasks(nonTrashedTasks);
      setDepartments(departmentsResponse.departments || []);
      setEmployees(employeesResponse.employees || []);
      setProjects(projectsResponse.projects || []); // Set projects
      setMeistertaskProjects(meistertaskProjectsResponse.projects || []); // Set Meistertask projects
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Task operations
  const createTask = async (taskData) => {
    try {
      setError(null);
      const response = await tasksAPI.createTask(taskData);
      setTasks(prev => [response.task, ...prev]);
      
      // Don't emit WebSocket event here as the backend already handles it
      // The WebSocket subscription will handle real-time updates for other users
      
      return { task: response.task, error: null };
    } catch (error) {
      console.error('Error creating task:', error);
      setError(error.message);
      return { task: null, error: error.message };
    }
  };

  // Update task status
  const updateTaskStatus = async (taskId, status) => {
    try {
      setError(null);
      const response = await tasksAPI.updateTask(taskId, { status });
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...response.task } : task
      ));
      
      return { task: response.task, error: null };
    } catch (error) {
      console.error('Error updating task status:', error);
      setError(error.message);
      return { task: null, error: error.message };
    }
  };

  // Update task
  const updateTask = async (taskId, taskData) => {
    try {
      setError(null);
      const response = await tasksAPI.updateTask(taskId, taskData);
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...response.task } : task
      ));
      
      // Don't emit WebSocket event here as the backend already handles it
      // The WebSocket subscription will handle real-time updates for other users
      
      return { task: response.task, error: null };
    } catch (error) {
      console.error('Error updating task:', error);
      setError(error.message);
      return { task: null, error: error.message };
    }
  };

  // New function specifically for updating task created_at when dragging
  const updateTaskCreatedAt = async (taskId, createdAtDate) => {
    try {
      setError(null);
      const response = await tasksAPI.updateTaskCreatedAt(taskId, createdAtDate);
      setTasks(prev => prev.map(task => 
        task.id === taskId ? response.task : task
      ));
      
      return { task: response.task, error: null };
    } catch (error) {
      console.error('Error updating task created_at:', error);
      setError(error.message);
      return { task: null, error: error.message };
    }
  };

  const deleteTask = async (taskId, action = 'delete') => {
    try {
      setError(null);
      await tasksAPI.deleteTask(taskId, action);
      setTasks(prev => prev.filter(task => task.id !== taskId));
      return { error: null };
    } catch (error) {
      console.error('Error deleting task:', error);
      setError(error.message);
      return { error: error.message };
    }
  };

  const restoreTask = async (taskId) => {
    try {
      setError(null);
      const response = await tasksAPI.restoreTask(taskId);
      // Add the restored task back to the tasks list if it doesn't exist there
      setTasks(prev => {
        const existingIndex = prev.findIndex(task => task.id === taskId);
        if (existingIndex >= 0) {
          // Update existing task
          const newTasks = [...prev];
          newTasks[existingIndex] = response.task;
          return newTasks;
        } else {
          // Add restored task to the beginning of the list
          return [response.task, ...prev];
        }
      });
      return { task: response.task, error: null };
    } catch (error) {
      console.error('Error restoring task:', error);
      setError(error.message);
      return { task: null, error: error.message };
    }
  };

  const permanentlyDeleteTask = async (taskId) => {
    try {
      setError(null);
      await tasksAPI.permanentlyDeleteTask(taskId);
      // Remove from tasks list if it exists there
      setTasks(prev => prev.filter(task => task.id !== taskId));
      return { error: null };
    } catch (error) {
      console.error('Error permanently deleting task:', error);
      setError(error.message);
      return { error: error.message };
    }
  };

  // Update task state without making an API call
  const updateTaskState = (updatedTask) => {
    // Ensure we don't add trashed tasks to the main task list
    if (updatedTask.status === 'trashed') {
      setTasks(prev => prev.filter(task => task.id !== updatedTask.id));
    } else {
      setTasks(prev => prev.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      ));
    }
  };

  // Add task to state without making an API call
  const addTaskState = (newTask) => {
    // Ensure we don't add trashed tasks to the main task list
    if (newTask.status !== 'trashed') {
      setTasks(prev => [newTask, ...prev]);
    }
  };

  // Department operations
  const addDepartment = async (departmentData) => {
    try {
      setError(null);
      const response = await departmentsAPI.createDepartment(departmentData);
      setDepartments(prev => [...prev, response.department]);
      return { department: response.department, error: null };
    } catch (error) {
      console.error('Error creating department:', error);
      setError(error.message);
      return { department: null, error: error.message };
    }
  };

  const createDepartment = async (departmentData) => {
    try {
      setError(null);
      const response = await departmentsAPI.createDepartment(departmentData);
      setDepartments(prev => [...prev, response.department]);
      return { department: response.department, error: null };
    } catch (error) {
      console.error('Error creating department:', error);
      setError(error.message);
      return { department: null, error: error.message };
    }
  };

  const updateDepartment = async (departmentData) => {
    try {
      setError(null);
      const departmentId = departmentData.id;
      const response = await departmentsAPI.updateDepartment(departmentId, departmentData);
      setDepartments(prev => prev.map(dept => 
        dept.id === departmentId ? response.department : dept
      ));
      return { department: response.department, error: null };
    } catch (error) {
      console.error('Error updating department:', error);
      setError(error.message);
      return { department: null, error: error.message };
    }
  };

  const deleteDepartment = async (departmentId) => {
    try {
      setError(null);
      const response = await departmentsAPI.deleteDepartment(departmentId);
      setDepartments(prev => prev.filter(dept => dept.id !== departmentId));
      return { error: null, message: response.message || 'Department deleted successfully' };
    } catch (error) {
      console.error('Error deleting department:', error);
      const errorMessage = error.message || 'Failed to delete department';
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  // Employee operations
  const addEmployee = async (employeeData) => {
    try {
      setError(null);
      const response = await employeesAPI.createEmployee(employeeData);
      setEmployees(prev => [...prev, response.employee]);
      return { employee: response.employee, error: null };
    } catch (error) {
      console.error('Error creating employee:', error);
      setError(error.message);
      return { employee: null, error: error.message };
    }
  };

  const createEmployee = async (employeeData) => {
    try {
      setError(null);
      const response = await employeesAPI.createEmployee(employeeData);
      setEmployees(prev => [...prev, response.employee]);
      return { employee: response.employee, error: null };
    } catch (error) {
      console.error('Error creating employee:', error);
      setError(error.message);
      return { employee: null, error: error.message };
    }
  };

  const updateEmployee = async (employeeData) => {
    try {
      setError(null);
      const employeeId = employeeData.id;
      const response = await employeesAPI.updateEmployee(employeeId, employeeData);
      setEmployees(prev => prev.map(emp => 
        emp.id === employeeId ? response.employee : emp
      ));
      
      // Also update the selectedEmployee if it matches
      if (selectedEmployee && selectedEmployee.id === employeeId) {
        setSelectedEmployee(response.employee);
      }
      
      return { employee: response.employee, error: null };
    } catch (error) {
      console.error('Error updating employee:', error);
      setError(error.message);
      return { employee: null, error: error.message };
    }
  };

  const deleteEmployee = async (employeeId) => {
    try {
      setError(null);
      const response = await employeesAPI.deleteEmployee(employeeId);
      // Only remove from state if actually deleted (not just deactivated)
      if (response.message.includes('deleted')) {
        setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
      } else {
        // If deactivated, refresh the employee data to show updated status
        const employeesResponse = await employeesAPI.getEmployees();
        setEmployees(employeesResponse.employees || []);
      }
      return { error: null, message: response.message || 'Employee processed successfully' };
    } catch (error) {
      console.error('Error deleting employee:', error);
      const errorMessage = error.message || 'Failed to delete employee';
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  // Project operations
  const addProject = async (projectData) => {
    try {
      setError(null);
      const response = await projectsAPI.createProject(projectData);
      setProjects(prev => [...prev, response.project]);
      return { project: response.project, error: null };
    } catch (error) {
      console.error('Error creating project:', error);
      setError(error.message);
      return { project: null, error: error.message };
    }
  };

  const createProject = async (projectData) => {
    try {
      setError(null);
      const response = await projectsAPI.createProject(projectData);
      setProjects(prev => [...prev, response.project]);
      return { project: response.project, error: null };
    } catch (error) {
      console.error('Error creating project:', error);
      setError(error.message);
      return { project: null, error: error.message };
    }
  };

  const updateProject = async (projectId, projectData) => {
    try {
      setError(null);
      const response = await projectsAPI.updateProject(projectId, projectData);
      setProjects(prev => prev.map(project => 
        project.id === projectId ? response.project : project
      ));
      return response.project;
    } catch (error) {
      console.error('Error updating project:', error);
      setError(error.message);
      throw error;
    }
  };

  const deleteProject = async (projectId) => {
    try {
      setError(null);
      await projectsAPI.deleteProject(projectId);
      setProjects(prev => prev.filter(project => project.id !== projectId));
      return { error: null };
    } catch (error) {
      console.error('Error deleting project:', error);
      setError(error.message);
      return { error: error.message };
    }
  };

  // Meistertask Project operations
  const addMeistertaskProject = async (projectData) => {
    try {
      setError(null);
      const response = await meistertaskProjectsAPI.createProject(projectData);
      setMeistertaskProjects(prev => [...prev, response.project]);
      return { project: response.project, error: null };
    } catch (error) {
      console.error('Error creating Meistertask project:', error);
      setError(error.message);
      return { project: null, error: error.message };
    }
  };

  const createMeistertaskProject = async (projectData) => {
    try {
      setError(null);
      const response = await meistertaskProjectsAPI.createProject(projectData);
      setMeistertaskProjects(prev => [...prev, response.project]);
      return { project: response.project, error: null };
    } catch (error) {
      console.error('Error creating Meistertask project:', error);
      setError(error.message);
      return { project: null, error: error.message };
    }
  };

  const updateMeistertaskProject = async (projectId, projectData) => {
    try {
      setError(null);
      const response = await meistertaskProjectsAPI.updateProject(projectId, projectData);
      setMeistertaskProjects(prev => prev.map(project => 
        project.id === projectId ? response.project : project
      ));
      return response.project;
    } catch (error) {
      console.error('Error updating Meistertask project:', error);
      setError(error.message);
      throw error;
    }
  };

  const deleteMeistertaskProject = async (projectId) => {
    try {
      setError(null);
      await meistertaskProjectsAPI.deleteProject(projectId);
      setMeistertaskProjects(prev => prev.filter(project => project.id !== projectId));
      return { error: null };
    } catch (error) {
      console.error('Error deleting Meistertask project:', error);
      setError(error.message);
      return { error: error.message };
    }
  };

  // Utility functions
  const getTasksByStatus = (status) => {
    // Exclude trashed tasks from all status filters
    return tasks.filter(task => task.status === status && task.status !== 'trashed');
  };

  const getTasksByEmployee = (employeeId) => {
    // Exclude trashed tasks from employee filters
    return tasks.filter(task => task.assigned_to === employeeId && task.status !== 'trashed');
  };

  const getTasksByDepartment = (departmentId) => {
    // Exclude trashed tasks from department filters
    return tasks.filter(task => task.department_id === departmentId && task.status !== 'trashed');
  };

  const getTasksByDateRange = (startDate, endDate) => {
    // Exclude trashed tasks from date range filters
    return tasks.filter(task => {
      if (!task.due_date) return false;
      const dueDate = new Date(task.due_date);
      return dueDate >= startDate && dueDate <= endDate && task.status !== 'trashed';
    });
  };

  // Navigation functions
  const navigateTo = (view, project = null) => {
    setCurrentView(view);
    if (project) {
      setSelectedProject(project);
    }
  };

  const navigateToDepartments = () => {
    setCurrentView('departments');
    setSelectedDepartment(null);
    setSelectedEmployee(null);
  };

  const navigateToDepartmentEmployees = (departmentId) => {
    const department = departments.find(d => d.id === departmentId);
    setSelectedDepartment(department);
    setCurrentView('employees');
    setSelectedEmployee(null);
  };

  const navigateToEmployee = (employeeId) => {
    const employee = employees.find(e => e.id === employeeId);
    setSelectedEmployee(employee);
    setCurrentView('employee-detail');
  };

  const navigateToTasks = (employeeId) => {
    const employee = employees.find(e => e.id === employeeId);
    setSelectedEmployee(employee);
    setCurrentView('calendar'); // Use the enhanced calendar with 3-step navigation
  };

  const navigateToCalendar = () => {
    setSelectedDate(null);
    setSelectedEmployee(null);
    setCurrentView('calendar');
  };

  // Add search navigation function
  const navigateToSearchResults = (term) => {
    setSearchTerm(term);
    if (term.trim()) {
      setCurrentView('search-results');
    } else {
      // If search term is empty, go back to calendar
      setCurrentView('calendar');
    }
  };

  const navigateToFilteredTasks = (filterType) => {
    setFilteredTasksFilterType(filterType);
    setCurrentView('filtered-tasks');
  };

  // Utility functions
  const getDepartmentById = (id) => {
    return departments.find(dept => dept.id === id);
  };

  const getEmployeeById = (id) => {
    return employees.find(emp => emp.id === id);
  };

  const getEmployeesByDepartment = (departmentId) => {
    return employees.filter(emp => emp.department_id === departmentId);
  };

  const getMyTasks = () => {
    if (!user) return [];
    // Exclude trashed tasks from my tasks
    return tasks.filter(task => 
      (task.assigned_to === user.id || task.created_by === user.id) && 
      task.status !== 'trashed'
    );
  };

  const navigateToDayView = (date) => {
    setSelectedDate(date);
    setCurrentView('day-view');
  };

  // Add search functionality
  const searchTasks = (searchTerm) => {
    if (!searchTerm || searchTerm.trim() === '') {
      return [];
    }
    
    const term = searchTerm.toLowerCase().trim();
    return tasks.filter(task => 
      (task.title && task.title.toLowerCase().includes(term)) ||
      (task.description && task.description.toLowerCase().includes(term))
    );
  };

  const getTasksForDate = (date) => {
    if (!date) return [];
    
    // Convert the selected date to local date string (YYYY-MM-DD format)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const targetDateStr = `${year}-${month}-${day}`;
    
    let filteredTasks = tasks.filter(task => {
      // Exclude trashed tasks
      if (task.status === 'trashed') return false;
      
      if (!task.created_at) return false;
      
      // Handle different date formats and ensure proper comparison with timezone awareness
      let taskDateStr;
      try {
        // Parse the date with timezone awareness
        const taskCreatedDate = new Date(task.created_at);
        
        // Extract date part using local time to match how dates are displayed in the UI
        const taskYear = taskCreatedDate.getFullYear();
        const taskMonth = String(taskCreatedDate.getMonth() + 1).padStart(2, '0');
        const taskDay = String(taskCreatedDate.getDate()).padStart(2, '0');
        taskDateStr = `${taskYear}-${taskMonth}-${taskDay}`;
        
        return taskDateStr === targetDateStr;
      } catch (error) {
        console.warn('Date parsing error for task:', task.id, task.created_at);
        return false;
      }
    });
    
    // If there's a selected employee, filter tasks to show only those assigned to the selected employee
    // This should work for all users, not just admins
    if (selectedEmployee) {
      filteredTasks = filteredTasks.filter(task => task.assigned_to === selectedEmployee.id);
    }
    
    return filteredTasks;
  };

  // Function to get overdue tasks
  const getOverdueTasks = () => {
    // Exclude trashed tasks from overdue tasks
    return tasks.filter(task => {
      const dueDate = new Date(task.due_date);
      return dueDate < new Date() && task.status !== 'completed' && task.status !== 'trashed';
    });
  };

  // Function to get high priority tasks
  const getHighPriorityTasks = () => {
    // Exclude trashed tasks from high priority tasks
    return tasks.filter(task => 
      (task.priority === 'high' || task.priority === 'urgent') && 
      task.status !== 'trashed'
    );
  };

  // Function to get tasks filtered by department, employee, and date range
  const getFilteredTasks = (departmentId, employeeId, dateRangeDays) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(dateRangeDays));
    
    // Exclude trashed tasks from filtered tasks
    return tasks.filter(task => {
      // Exclude trashed tasks
      if (task.status === 'trashed') return false;
      
      const matchesDepartment = !departmentId || task.department_id === departmentId;
      const matchesEmployee = !employeeId || task.assigned_to === employeeId;
      
      // Date range filter
      const taskDate = new Date(task.created_at);
      const matchesDate = taskDate >= cutoffDate;
      
      return matchesDepartment && matchesEmployee && matchesDate;
    });
  };

  // Function to get overdue tasks with filters applied
  const getFilteredOverdueTasks = (departmentId, employeeId, dateRangeDays) => {
    const filteredTasks = getFilteredTasks(departmentId, employeeId, dateRangeDays);
    return filteredTasks.filter(task => {
      const dueDate = new Date(task.due_date);
      return dueDate < new Date() && task.status !== 'completed';
    });
  };

  // Function to get high priority tasks with filters applied
  const getFilteredHighPriorityTasks = (departmentId, employeeId, dateRangeDays) => {
    const filteredTasks = getFilteredTasks(departmentId, employeeId, dateRangeDays);
    return filteredTasks.filter(task => task.priority === 'high' || task.priority === 'urgent');
  };

  // Function to get in progress tasks with filters applied
  const getFilteredInProgressTasks = (departmentId, employeeId, dateRangeDays) => {
    const filteredTasks = getFilteredTasks(departmentId, employeeId, dateRangeDays);
    return filteredTasks.filter(task => task.status === 'in-progress');
  };

  const value = {
    // Data
    tasks,
    departments,
    employees,
    projects, // Add projects to context
    meistertaskProjects, // Add Meistertask projects to context
    loading,
    error,
    
    // Navigation state
    currentView,
    selectedDepartment,
    selectedEmployee,
    selectedDate,
    selectedProject,
    filteredTasksFilterType,
    
    // Search state
    searchTerm,
    setSearchTerm,
    
    // User/Auth info (derived from AuthContext but provided here for convenience)
    currentUser: user,
    userRole: user?.role || 'employee',
    isAdmin: user?.role === 'admin',
    
    // Operations
    fetchAllData,
    createTask,
    updateTask,
    updateTaskStatus,
    updateTaskCreatedAt, // Add the new function
    deleteTask,
    restoreTask,
    permanentlyDeleteTask,
    addDepartment,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    addEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    updateTaskState,
    addTaskState,
    
    // Project operations
    addProject,
    createProject,
    updateProject,
    deleteProject,
    
    // Meistertask Project operations
    addMeistertaskProject,
    createMeistertaskProject,
    updateMeistertaskProject,
    deleteMeistertaskProject,
    
    // Function aliases for compatibility
    addTask: createTask,
    
    // Navigation functions
    navigateTo,
    navigateToDepartments,
    navigateToDepartmentEmployees,
    navigateToEmployee,
    navigateToTasks,
    navigateToSearchResults,
    navigateToCalendar,
    navigateToDayView,
    navigateToFilteredTasks,
    
    // Utility functions
    getTasksByStatus,
    getTasksByEmployee,
    getTasksByDepartment,
    getTasksByDateRange,
    getDepartmentById,
    getEmployeeById,
    getEmployeesByDepartment,
    getMyTasks,
    getTasksForDate,
    getOverdueTasks,
    getHighPriorityTasks,
    getFilteredTasks,
    getFilteredOverdueTasks,
    getFilteredHighPriorityTasks,
    getFilteredInProgressTasks,
    searchTasks,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};