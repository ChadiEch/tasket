import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import TaskDetail from './tasks/TaskDetail';
import DeleteConfirmationDialog from './tasks/DeleteConfirmationDialog';
import { tasksAPI } from '../lib/api';

const EnhancedCalendar = ({ view: propView }) => {
  const { 
    tasks, 
    navigateToDayView, 
    selectedEmployee, 
    navigateToCalendar, 
    currentUser, 
    isAdmin, 
    deleteTask, 
    updateTask, 
    createTask, 
    updateTaskStatus 
  } = useApp();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('year'); // 'year' or 'days'
  const [isMyTasksMode, setIsMyTasksMode] = useState(propView === 'my-tasks');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [viewingTask, setViewingTask] = useState(null);
  const [taskToView, setTaskToView] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  
  // State for todo list with localStorage persistence per user
  const [todoList, setTodoList] = useState(() => {
    const savedTodos = localStorage.getItem(`calendarTodos_${currentUser?.id || 'guest'}`);
    return savedTodos ? JSON.parse(savedTodos) : [
      { id: 'todo1', title: 'Review project documentation', description: '', completed: false, assignedDate: null, priority: 'medium', estimated_hours: 1.00, attachments: [] },
      { id: 'todo2', title: 'Prepare meeting agenda', description: '', completed: false, assignedDate: null, priority: 'high', estimated_hours: 0.50, attachments: [] },
      { id: 'todo3', title: 'Update team progress report', description: '', completed: false, assignedDate: null, priority: 'medium', estimated_hours: 2.00, attachments: [] }
    ];
  });
  
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'medium',
    estimated_hours: 1.00,
    attachments: []
  });
  
  const [showTodoForm, setShowTodoForm] = useState(false);
  const [dragAction, setDragAction] = useState('move'); // 'copy' or 'move'

  const today = new Date();

  // Save todo list to localStorage whenever it changes, scoped to current user
  useEffect(() => {
    localStorage.setItem(`calendarTodos_${currentUser?.id || 'guest'}`, JSON.stringify(todoList));
  }, [todoList, currentUser?.id]);

  // Check if there's a task to view when component mounts or when tasks change
  useEffect(() => {
    if (taskToView) {
      const timer = setTimeout(() => {
        const task = tasks.find(t => t.id === taskToView);
        if (task) {
          setViewingTask(task);
        } else {
          console.warn(`Task with ID ${taskToView} not found`);
        }
        setTaskToView(null);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [taskToView, tasks]);

  // Set my tasks mode based on prop
  useEffect(() => {
    setIsMyTasksMode(propView === 'my-tasks');
  }, [propView]);

  // Generate years for selection (10 years before and after current year)
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      years.push(i);
    }
    return years;
  };

  // Generate months for selection
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Check if a date has tasks for the selected employee
  const hasTasksOnDate = (year, month, day) => {
    const targetDate = new Date(year, month, day);
    const yearStr = targetDate.getFullYear();
    const monthStr = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(targetDate.getDate()).padStart(2, '0');
    const targetDateStr = `${yearStr}-${monthStr}-${dayStr}`;

    let filteredTasks = tasks.filter(task => {
      if (!task.created_at) return false;
      
      try {
        const taskCreatedDate = new Date(task.created_at);
        const taskYear = taskCreatedDate.getFullYear();
        const taskMonth = String(taskCreatedDate.getMonth() + 1).padStart(2, '0');
        const taskDay = String(taskCreatedDate.getDate()).padStart(2, '0');
        let taskDateStr = `${taskYear}-${taskMonth}-${taskDay}`;
        
        return taskDateStr === targetDateStr;
      } catch (error) {
        return false;
      }
    });
    
    if (selectedEmployee) {
      filteredTasks = filteredTasks.filter(task => task.assigned_to === selectedEmployee.id);
    } else if (isMyTasksMode) {
      filteredTasks = filteredTasks.filter(task => task.assigned_to === currentUser?.id);
    }
    
    return filteredTasks.length > 0;
  };

  // Generate calendar days for a specific month
  const generateCalendarDays = (year, month) => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayWeekday = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const calendarDays = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDayWeekday; i++) {
      calendarDays.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(day);
    }
    
    return calendarDays;
  };

  const getTasksForDay = (day) => {
    if (!day || view !== 'days') return [];
    
    const targetDate = new Date(selectedYear, selectedMonth, day);
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(targetDate.getDate()).padStart(2, '0');
    const targetDateStr = `${year}-${month}-${dayStr}`;
    
    let filteredTasks = tasks.filter(task => {
      if (!task.created_at) return false;
      
      try {
        const taskCreatedDate = new Date(task.created_at);
        const taskYear = taskCreatedDate.getFullYear();
        const taskMonth = String(taskCreatedDate.getMonth() + 1).padStart(2, '0');
        const taskDay = String(taskCreatedDate.getDate()).padStart(2, '0');
        let taskDateStr = `${taskYear}-${taskMonth}-${taskDay}`;
        
        return taskDateStr === targetDateStr;
      } catch (error) {
        console.warn('Date parsing error for task:', task.id, task.created_at);
        return false;
      }
    });
    
    if (selectedEmployee) {
      filteredTasks = filteredTasks.filter(task => task.assigned_to === selectedEmployee.id);
    } else if (isMyTasksMode) {
      filteredTasks = filteredTasks.filter(task => task.assigned_to === currentUser?.id);
    }
    
    return filteredTasks;
  };

  const handleYearSelect = (year) => {
    setSelectedYear(year);
  };

  const handleMonthSelect = (monthIndex) => {
    setSelectedMonth(monthIndex);
    setView('days');
  };

  const handleDayClick = (day) => {
    if (!day) return;
    const selectedDate = new Date(selectedYear, selectedMonth, day);
    navigateToDayView(selectedDate);
  };

  // Handle day click in year view
  const handleYearViewDayClick = (year, month, day) => {
    if (!day) return;
    const selectedDate = new Date(year, month, day);
    navigateToDayView(selectedDate);
  };

  // Handle month click in year view (navigate to month view)
  const handleYearViewMonthClick = (monthIndex) => {
    setSelectedMonth(monthIndex);
    setView('days');
  };

  const navigateToToday = () => {
    const now = new Date();
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth());
    setCurrentDate(now);
    setView('days');
  };

  const goBack = () => {
    if (view === 'days') {
      setView('year');
    }
  };

  const navigateToAllEmployeesCalendar = () => {
    navigateToCalendar();
    setIsMyTasksMode(false);
  };

  const openTaskView = (task) => {
    setViewingTask(task);
  };

  const closeTaskView = () => {
    setViewingTask(null);
  };

  const openTaskById = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setViewingTask(task);
    }
  };

  const openAttachment = (attachment) => {
    if (attachment.type === 'link') {
      window.open(attachment.url, '_blank');
    } else {
      window.open(attachment.url, '_blank');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-amber-100 text-amber-800';
      case 'planned':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'high':
        return 'bg-orange-500';
      case 'urgent':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleTaskDelete = async (task) => {
    setTaskToDelete(task);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async (action) => {
    setShowDeleteDialog(false);
    if (!taskToDelete) return;
    
    try {
      await deleteTask(taskToDelete.id, action);
      
      setTodoList(prev => prev.map(todo => {
        if (todo.assignedDate) {
          const taskDate = new Date(taskToDelete.created_at);
          const todoDate = new Date(todo.assignedDate);
          
          if (taskDate.toDateString() === todoDate.toDateString() && 
              todo.title === taskToDelete.title) {
            return { ...todo, assignedDate: null };
          }
        }
        return todo;
      }));
      
      if (viewingTask && viewingTask.id === taskToDelete.id) {
        setViewingTask(null);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    } finally {
      setTaskToDelete(null);
    }
  };

  const openTaskFromNotification = (taskId) => {
    if (!taskId) {
      console.warn('No task ID provided to openTaskFromNotification');
      return;
    }
    setTaskToView(taskId);
  };

  // Handle drag start
  const handleDragStart = (e, task) => {
    if (!isAdmin) return;
    e.dataTransfer.setData('text/plain', JSON.stringify({ ...task, source: 'task' }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTask(task);
    
    const dragImage = document.createElement('div');
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.textContent = task.title;
    dragImage.className = 'bg-blue-500 text-white px-2 py-1 rounded text-sm';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedTask(null);
    setDropTarget(null);
  };

  // Handle drag over
  const handleDragOver = (e, day) => {
    if (!isAdmin || !day) return;
    e.preventDefault();
    
    const data = e.dataTransfer.getData('text/plain');
    if (data) {
      try {
        const parsedData = JSON.parse(data);
        if (parsedData.source === 'task') {
          e.dataTransfer.dropEffect = 'move';
        } else if (parsedData.source === 'todo') {
          e.dataTransfer.dropEffect = dragAction === 'copy' ? 'copy' : 'move';
        }
      } catch (error) {
        e.dataTransfer.dropEffect = 'move';
      }
    } else {
      e.dataTransfer.dropEffect = 'move';
    }
    
    setDropTarget(day);
  };

  // Handle drag leave
  const handleDragLeave = (e) => {
    if (e.target.classList.contains('calendar-day-cell')) {
      setDropTarget(null);
    }
  };

  // Handle drop on calendar day
  const handleDrop = async (e, day) => {
    e.preventDefault();
    if (!isAdmin || !day) return;
    
    const data = e.dataTransfer.getData('text/plain');
    if (!data) return;
    
    try {
      const parsedData = JSON.parse(data);
      
      if (parsedData.source === 'task') {
        await moveTaskToDay(parsedData, day);
      } else if (parsedData.source === 'todo') {
        await convertTodoToTask(parsedData, day);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
      alert(`Failed to handle drop: ${error.message}`);
    } finally {
      setDraggedTask(null);
      setDropTarget(null);
    }
  };

  // Function to move a task to a new day
  const moveTaskToDay = async (taskData, day) => {
    const year = selectedYear;
    const month = String(selectedMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const targetDateStr = `${year}-${month}-${dayStr}`;
    
    const targetDate = new Date(selectedYear, selectedMonth, day, 12, 0, 0);
    const formattedDate = targetDate.toISOString();
    
    try {
      const updatedTaskData = {
        created_at: formattedDate
      };
      
      const result = await updateTask(taskData.id, updatedTaskData);
      
      if (result.error) {
        console.error('Error updating task:', result.error);
        alert(`Failed to move task: ${result.error}`);
      } else {
        console.log('Task moved successfully:', result.task);
      }
    } catch (error) {
      console.error('Error moving task:', error);
      alert(`Failed to move task: ${error.message}`);
    }
  };

  // Function to process todo attachments
  const processTodoAttachments = async (attachments = []) => {
    if (!Array.isArray(attachments) || attachments.length === 0) {
      return [];
    }
    
    const filesToUpload = [];
    const existingAttachments = [];
    
    for (const attachment of attachments) {
      if (attachment.file && typeof attachment.file === 'object' && attachment.file instanceof File) {
        filesToUpload.push(attachment);
      } else if (attachment.url) {
        existingAttachments.push(attachment);
      }
    }
    
    const uploadedAttachments = [];
    for (let i = 0; i < filesToUpload.length; i++) {
      const fileAttachment = filesToUpload[i];
      
      try {
        const result = await tasksAPI.uploadFile(fileAttachment.file);
        
        if (result.task && result.task.attachments && Array.isArray(result.task.attachments) && result.task.attachments.length > 0) {
          const uploadedAttachment = result.task.attachments.find(attachment => 
            attachment.name === fileAttachment.name
          ) || result.task.attachments[0];
          
          if (uploadedAttachment && uploadedAttachment.url) {
            uploadedAttachments.push({
              id: fileAttachment.id,
              type: fileAttachment.type,
              url: uploadedAttachment.url,
              name: fileAttachment.name,
              size: fileAttachment.size
            });
          } else {
            throw new Error('Uploaded file missing URL');
          }
        } else {
          throw new Error('Invalid response from server: missing attachments');
        }
      } catch (uploadError) {
        throw new Error(`Failed to upload file "${fileAttachment.name}": ${uploadError.message || 'Unknown error'}`);
      }
    }
    
    const allAttachments = [...uploadedAttachments, ...existingAttachments];
    return allAttachments;
  };

  // Function to convert a todo to a task on a specific day
  const convertTodoToTask = async (todoData, day) => {
    try {
      if (dragAction === 'copy') {
        return await copyTodoToDay(todoData, day);
      } else {
        return await moveTodoToDay(todoData, day);
      }
    } catch (error) {
      console.error('Error converting todo to task:', error);
      alert(`Failed to convert todo to task: ${error.message || 'Please try again.'}`);
      throw error;
    }
  };

  // Function to copy a todo item to a specific day as a new task
  const copyTodoToDay = async (todoData, day) => {
    const targetDate = new Date(selectedYear, selectedMonth, day, 12, 0, 0);
    const formattedDate = targetDate.toISOString();
    
    try {
      const processedAttachments = await processTodoAttachments(todoData.attachments);
      
      const newTaskData = {
        title: todoData.title,
        description: todoData.description || 'Task created from todo list',
        created_at: formattedDate,
        due_date: formattedDate,
        priority: todoData.priority || 'medium',
        status: 'planned',
        assigned_to: currentUser?.id || null,
        estimated_hours: todoData.estimated_hours || 1.00,
        attachments: processedAttachments
      };
      
      const result = await createTask(newTaskData);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.task;
    } catch (error) {
      throw error;
    }
  };

  // Function to move a todo item to a specific day as a new task
  const moveTodoToDay = async (todoData, day) => {
    const targetDate = new Date(selectedYear, selectedMonth, day, 12, 0, 0);
    const formattedDate = targetDate.toISOString();
    
    try {
      const processedAttachments = await processTodoAttachments(todoData.attachments);
      
      const newTaskData = {
        title: todoData.title,
        description: todoData.description || 'Task created from todo list',
        created_at: formattedDate,
        due_date: formattedDate,
        priority: todoData.priority || 'medium',
        status: 'planned',
        assigned_to: currentUser?.id || null,
        estimated_hours: todoData.estimated_hours || 1.00,
        attachments: processedAttachments
      };
      
      const result = await createTask(newTaskData);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setTodoList(prev => prev.filter(t => t.id !== todoData.id));
      
      return result.task;
    } catch (error) {
      throw error;
    }
  };

  // Handle todo list drag start
  const handleTodoDragStart = (e, todo) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ ...todo, source: 'todo' }));
    e.dataTransfer.effectAllowed = dragAction === 'copy' ? 'copy' : 'move';
  };

  // Handle file upload for todo attachments
  const handleTodoFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    const fileAttachments = files.map((file, index) => {
      let type = 'document';
      if (file.type.startsWith('image/')) {
        type = 'photo';
      } else if (file.type.startsWith('video/')) {
        type = 'video';
      }
      
      return {
        id: Date.now() + index,
        type: type,
        file: file,
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file)
      };
    });
    
    setNewTodo(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...fileAttachments]
    }));
  };

  // Toggle todo completion status
  const toggleTodoCompletion = async (id) => {
    setTodoList(prev => {
      return prev.map(todo => {
        if (todo.id === id) {
          const updatedTodo = { ...todo, completed: !todo.completed };
          
          if (updatedTodo.completed && updatedTodo.assignedDate) {
            const correspondingTask = tasks.find(task => 
              task.title === updatedTodo.title && 
              new Date(task.created_at).toDateString() === new Date(updatedTodo.assignedDate).toDateString() &&
              task.assigned_to === currentUser?.id
            );
            
            if (correspondingTask) {
              updateTaskStatus(correspondingTask.id, 'completed');
            }
          }
          
          return updatedTodo;
        }
        return todo;
      });
    });
  };

  // Handle new todo form changes
  const handleTodoFormChange = (e) => {
    const { name, value } = e.target;
    setNewTodo(prev => ({
      ...prev,
      [name]: name === 'estimated_hours' ? parseFloat(value) || 0 : value
    }));
  };

  // Remove attachment from new todo
  const removeTodoAttachment = (id) => {
    setNewTodo(prev => {
      const attachments = prev.attachments.filter(attachment => attachment.id !== id);
      return { ...prev, attachments };
    });
  };

  // Add new todo item with file uploads
  const addNewTodo = async () => {
    if (newTodo.title.trim() === '') return;
    
    try {
      const attachmentsWithUrls = [];
      const filesToUpload = [];
      const linkAttachments = [];
      
      for (const attachment of newTodo.attachments) {
        if (attachment.file) {
          filesToUpload.push(attachment);
        } else if (attachment.type === 'link' && attachment.url) {
          linkAttachments.push(attachment);
        }
      }
      
      const uploadedAttachments = [];
      for (let i = 0; i < filesToUpload.length; i++) {
        const fileAttachment = filesToUpload[i];
        
        try {
          const result = await tasksAPI.uploadFile(fileAttachment.file);
          
          if (result.task && result.task.attachments && Array.isArray(result.task.attachments) && result.task.attachments.length > 0) {
            const uploadedAttachment = result.task.attachments.find(attachment => 
              attachment.name === fileAttachment.name
            ) || result.task.attachments[0];
            
            if (uploadedAttachment && uploadedAttachment.url) {
              uploadedAttachments.push({
                id: fileAttachment.id,
                type: fileAttachment.type,
                url: uploadedAttachment.url,
                name: fileAttachment.name,
                size: fileAttachment.size
              });
            } else {
              throw new Error('Uploaded file missing URL');
            }
          } else {
            throw new Error('Invalid response from server: missing attachments');
          }
        } catch (uploadError) {
          throw new Error(`Failed to upload file "${fileAttachment.name}": ${uploadError.message || 'Unknown error'}`);
        }
      }
      
      const allAttachments = [...uploadedAttachments, ...linkAttachments];
      
      const newTodoItem = {
        id: `todo${Date.now()}`,
        ...newTodo,
        completed: false,
        assignedDate: null,
        attachments: allAttachments
      };
      
      setTodoList(prev => [...prev, newTodoItem]);
      setNewTodo({
        title: '',
        description: '',
        priority: 'medium',
        estimated_hours: 1.00,
        attachments: []
      });
      setShowTodoForm(false);
    } catch (error) {
      console.error('Error adding todo with attachments:', error);
      alert(`Failed to add todo with attachments: ${error.message || 'Please try again.'}`);
    }
  };

  // Delete todo item
  const deleteTodo = (id) => {
    setTodoList(prev => prev.filter(todo => todo.id !== id));
  };

  // Handle drag action change
  const handleDragActionChange = (action) => {
    setDragAction(action);
  };

  // Handle task status change in calendar view
  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      const result = await updateTask(taskId, { status: newStatus });
      
      if (newStatus === 'completed') {
        const updatedTask = result.task;
        if (updatedTask) {
          setTodoList(prev => prev.map(todo => {
            if (todo.assignedDate && 
                todo.title === updatedTask.title &&
                new Date(todo.assignedDate).toDateString() === new Date(updatedTask.created_at).toDateString()) {
              return { ...todo, completed: true };
            }
            return todo;
          }));
        }
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  // Make this function available to other components
  window.openTaskFromNotification = openTaskFromNotification;

  const isMyTasksView = isMyTasksMode;

  return (
    <div className="p-6">
      {/* Header with navigation controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <h2 className="text-2xl font-bold text-gray-800">
            {isMyTasksView ? 'My Tasks Calendar' : 
             view === 'year' ? 'Calendar Overview' :
             `${monthNames[selectedMonth]} ${selectedYear}`}
          </h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMyTasksMode(!isMyTasksMode)}
            className={`px-3 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              isMyTasksView 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {isMyTasksView ? 'All Tasks' : 'My Tasks'}
          </button>
          
          <button
            onClick={navigateToToday}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Today
          </button>
          
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={goBack}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {isAdmin && selectedEmployee && (
              <button
                onClick={navigateToAllEmployeesCalendar}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                All Employees
              </button>
            )}
            
            <select
              value={selectedYear}
              onChange={(e) => handleYearSelect(parseInt(e.target.value))}
              className="px-3 py-2 text-sm border-t border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {generateYears().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar Section */}
        <div className="flex-1">
          {/* Year View - Show all months */}
          {view === 'year' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {monthNames.map((month, index) => {
                const isCurrentMonth = selectedYear === today.getFullYear() && index === today.getMonth();
                return (
                  <div 
                    key={index} 
                    className={`bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow ${
                      isCurrentMonth ? 'ring-2 ring-indigo-500' : ''
                    }`}
                  >
                    <div 
                      className="flex justify-between items-center mb-2 cursor-pointer hover:bg-gray-50 rounded p-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleYearViewMonthClick(index);
                      }}
                    >
                      <h3 className={`text-lg font-medium ${isCurrentMonth ? 'text-indigo-600' : 'text-gray-900'}`}>
                        {month}
                      </h3>
                      <span className="text-sm text-gray-500">{selectedYear}</span>
                    </div>
                    
                    {/* Mini calendar for the month */}
                    <div className="grid grid-cols-7 gap-1">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <div key={i} className="text-xs text-center text-gray-500 py-1">{day}</div>
                      ))}
                      
                      {generateCalendarDays(selectedYear, index).map((day, i) => {
                        const isCurrentDay = selectedYear === today.getFullYear() && 
                                             index === today.getMonth() && 
                                             day === today.getDate();
                        return (
                          <div 
                            key={i} 
                            className={`text-xs text-center py-4 rounded-full cursor-pointer hover:bg-gray-100 flex items-center justify-center ${
                              day && hasTasksOnDate(selectedYear, index, day) 
                                ? isCurrentDay 
                                  ? 'bg-indigo-600 text-white font-bold' 
                                  : 'bg-indigo-100 text-indigo-800 font-medium' 
                                : isCurrentDay
                                  ? 'bg-indigo-500 text-white font-bold'
                                  : day 
                                    ? 'text-gray-700' 
                                    : 'text-gray-300'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (day) {
                                handleYearViewDayClick(selectedYear, index, day);
                              }
                            }}
                          >
                            {day || ''}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Days View - Show calendar for selected month */}
          {view === 'days' && (
            <div className="bg-white rounded-lg shadow">
              {/* Month header */}
              <div className="flex items-center justify-center px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {monthNames[selectedMonth]} {selectedYear}
                </h3>
              </div>
              
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1 p-4">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={i} className="text-xs text-center text-gray-500 py-2">{day}</div>
                ))}
                
                {generateCalendarDays(selectedYear, selectedMonth).map((day, i) => {
                  const isCurrentDay = selectedYear === today.getFullYear() && 
                                       selectedMonth === today.getMonth() && 
                                       day === today.getDate();
                  const isDropTarget = day === dropTarget;
                  
                  return (
                    <div 
                      key={i} 
                      data-day={day}
                      className={`calendar-day-cell text-center py-2 rounded-lg cursor-pointer hover:bg-gray-100 flex flex-col items-center justify-start min-h-24 border ${
                        day && hasTasksOnDate(selectedYear, selectedMonth, day) 
                          ? isCurrentDay 
                            ? 'bg-indigo-600 text-white font-bold' 
                            : 'bg-indigo-100 text-indigo-800 font-medium' 
                        : isCurrentDay
                          ? 'bg-indigo-500 text-white font-bold'
                          : day 
                            ? 'text-gray-700' 
                            : 'text-gray-300'
                      } ${
                        isDropTarget ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-200' : ''
                      }`}
                      onClick={() => handleDayClick(day)}
                      onDragOver={(e) => handleDragOver(e, day)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, day)}
                    >
                      <div className="text-sm font-medium">
                        {day || ''}
                      </div>
                      {day && getTasksForDay(day).map(task => (
                        <div
                          key={task.id}
                          className={`task-item mt-1 p-1 rounded text-xs cursor-pointer hover:opacity-75 w-full ${
                            getStatusColor(task.status)
                          }`}
                          draggable={isAdmin}
                          onDragStart={(e) => handleDragStart(e, task)}
                          onClick={(e) => {
                            e.stopPropagation();
                            openTaskView(task);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="task-title truncate">{task.title}</span>
                            <div 
                              className="priority-indicator w-2 h-2 rounded-full ml-1" 
                              style={{ backgroundColor: getPriorityColor(task.priority) }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Todo List Section */}
        <div className="w-full lg:w-80">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Todo List</h3>
              <button
                onClick={() => setShowTodoForm(!showTodoForm)}
                className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
              >
                {showTodoForm ? 'Cancel' : 'Add Todo'}
              </button>
            </div>
            
            {showTodoForm && (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  addNewTodo();
                }}
                className="space-y-3 mb-4"
              >
                <div>
                  <label htmlFor="todoTitle" className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    id="todoTitle"
                    name="title"
                    value={newTodo.title}
                    onChange={handleTodoFormChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="todoDescription" className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    id="todoDescription"
                    name="description"
                    value={newTodo.description}
                    onChange={handleTodoFormChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    rows="2"
                  />
                </div>
                
                <div>
                  <label htmlFor="todoPriority" className="block text-sm font-medium text-gray-700">Priority</label>
                  <select
                    id="todoPriority"
                    name="priority"
                    value={newTodo.priority}
                    onChange={handleTodoFormChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="todoEstimatedHours" className="block text-sm font-medium text-gray-700">Estimated Hours</label>
                  <input
                    type="number"
                    id="todoEstimatedHours"
                    name="estimated_hours"
                    value={newTodo.estimated_hours}
                    onChange={handleTodoFormChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    step="0.01"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Attachments</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <input
                      type="file"
                      id="todoAttachments"
                      onChange={handleTodoFileUpload}
                      className="hidden"
                      multiple
                    />
                    <label
                      htmlFor="todoAttachments"
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      Upload Files
                    </label>
                  </div>
                  
                  {newTodo.attachments.map((attachment, index) => (
                    <div key={index} className="mt-2 flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm text-gray-700 truncate">{attachment.name}</span>
                      <button
                        type="button"
                        onClick={() => removeTodoAttachment(attachment.id)}
                        className="px-2 py-1 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowTodoForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Add Todo
                  </button>
                </div>
              </form>
            )}
            
            {/* Drag action selector for admins */}
            {isAdmin && (
              <div className="mb-4 flex space-x-2">
                <button
                  onClick={() => handleDragActionChange('copy')}
                  className={`flex-1 px-3 py-2 text-sm rounded-md ${
                    dragAction === 'copy' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Copy
                </button>
                <button
                  onClick={() => handleDragActionChange('move')}
                  className={`flex-1 px-3 py-2 text-sm rounded-md ${
                    dragAction === 'move' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Move
                </button>
              </div>
            )}
            
            <ul className="space-y-3 max-h-96 overflow-y-auto">
              {todoList.map(todo => (
                <li 
                  key={todo.id} 
                  className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                  draggable={isAdmin}
                  onDragStart={(e) => isAdmin && handleTodoDragStart(e, todo)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => toggleTodoCompletion(todo.id)}
                        className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <div className="ml-2">
                        <span className={`text-sm font-medium ${todo.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {todo.title}
                        </span>
                        {todo.description && (
                          <p className="mt-1 text-xs text-gray-600">{todo.description}</p>
                        )}
                        <div className="mt-1 flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            todo.priority === 'low' ? 'bg-green-100 text-green-800' :
                            todo.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            todo.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {todo.priority}
                          </span>
                          <span className="text-xs text-gray-500">
                            {todo.estimated_hours} hrs
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteTodo(todo.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6" />
                      </svg>
                    </button>
                  </div>
                  
                  {todo.attachments.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-500 mb-1">Attachments:</div>
                      <div className="flex flex-wrap gap-1">
                        {todo.attachments.map((attachment, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => openAttachment(attachment)}
                            className="text-xs bg-white border border-gray-300 rounded px-2 py-1 hover:bg-gray-50"
                          >
                            {attachment.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      {viewingTask && (
        <TaskDetail 
          task={viewingTask} 
          onClose={closeTaskView}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && taskToDelete && (
        <DeleteConfirmationDialog
          task={taskToDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setShowDeleteDialog(false);
            setTaskToDelete(null);
          }}
        />
      )}
    </div>
  );
};

export default EnhancedCalendar;