import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import TaskDetail from './tasks/TaskDetail'
import DeleteConfirmationDialog from './tasks/DeleteConfirmationDialog'

const EnhancedCalendar = ({ view: propView }) => {
  const { tasks, navigateToDayView, selectedEmployee, navigateToCalendar, currentUser, isAdmin, deleteTask, updateTask, createTask, updateTaskStatus } = useApp()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState('year') // 'year' or 'days'
  const [isMyTasksMode, setIsMyTasksMode] = useState(propView === 'my-tasks') // Whether we're filtering by current user
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [viewingTask, setViewingTask] = useState(null)
  const [taskToView, setTaskToView] = useState(null) // For opening a specific task
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState(null)
  const [draggedTask, setDraggedTask] = useState(null) // State for dragged task
  const [dropTarget, setDropTarget] = useState(null) // State for drop target
  
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
  const [dragAction, setDragAction] = useState('copy'); // 'copy' or 'move'

  const today = new Date();

  // Save todo list to localStorage whenever it changes, scoped to current user
  useEffect(() => {
    localStorage.setItem(`calendarTodos_${currentUser?.id || 'guest'}`, JSON.stringify(todoList));
  }, [todoList, currentUser?.id]);

  // Check if there's a task to view when component mounts or when tasks change
  useEffect(() => {
    if (taskToView) {
      // Add a small delay to ensure tasks are loaded
      const timer = setTimeout(() => {
        const task = tasks.find(t => t.id === taskToView);
        if (task) {
          setViewingTask(task);
        } else {
          console.warn(`Task with ID ${taskToView} not found`);
        }
        setTaskToView(null); // Clear it after processing
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
    const currentYear = new Date().getFullYear()
    const years = []
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      years.push(i)
    }
    return years
  }

  // Generate months for selection
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Check if a date has tasks for the selected employee
  const hasTasksOnDate = (year, month, day) => {
    const targetDate = new Date(year, month, day)
    const yearStr = targetDate.getFullYear()
    const monthStr = String(targetDate.getMonth() + 1).padStart(2, '0')
    const dayStr = String(targetDate.getDate()).padStart(2, '0')
    const targetDateStr = `${yearStr}-${monthStr}-${dayStr}`

    // Filter tasks by created_at date instead of due_date
    let filteredTasks = tasks.filter(task => {
      if (!task.created_at) return false
      
      let taskDateStr
      try {
        // Parse the date with timezone awareness
        const taskCreatedDate = new Date(task.created_at)
        
        // Extract date part using local time (this handles timezone conversion properly)
        const taskYear = taskCreatedDate.getFullYear()
        const taskMonth = String(taskCreatedDate.getMonth() + 1).padStart(2, '0')
        const taskDay = String(taskCreatedDate.getDate()).padStart(2, '0')
        taskDateStr = `${taskYear}-${taskMonth}-${taskDay}`
        
        return taskDateStr === targetDateStr
      } catch (error) {
        return false
      }
    })
    
    // If there's a selected employee, filter tasks to show only those assigned to the selected employee
    // For "My Tasks" view, filter by current user
    if (selectedEmployee) {
      filteredTasks = filteredTasks.filter(task => task.assigned_to === selectedEmployee.id)
    } else if (isMyTasksMode) {
      // Filter by current user for "My Tasks" view
      filteredTasks = filteredTasks.filter(task => task.assigned_to === currentUser?.id)
    }
    
    return filteredTasks.length > 0
  }

  // Generate calendar days for a specific month
  const generateCalendarDays = (year, month) => {
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const firstDayWeekday = firstDayOfMonth.getDay()
    const daysInMonth = lastDayOfMonth.getDate()

    const calendarDays = []
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDayWeekday; i++) {
      calendarDays.push(null)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(day)
    }
    
    return calendarDays
  }

  const getTasksForDay = (day) => {
    if (!day || view !== 'days') return []
    
    // Create date for the specific day using local timezone
    const targetDate = new Date(selectedYear, selectedMonth, day)
    const year = targetDate.getFullYear()
    const month = String(targetDate.getMonth() + 1).padStart(2, '0')
    const dayStr = String(targetDate.getDate()).padStart(2, '0')
    const targetDateStr = `${year}-${month}-${dayStr}`
    
    // Filter tasks by created_at date instead of due_date
    let filteredTasks = tasks.filter(task => {
      if (!task.created_at) return false
      
      // Handle different date formats and ensure proper comparison
      let taskDateStr
      try {
        // Parse the date with timezone awareness
        const taskCreatedDate = new Date(task.created_at)
        
        // Extract date part using local time to match how dates are displayed in the UI
        const taskYear = taskCreatedDate.getFullYear()
        const taskMonth = String(taskCreatedDate.getMonth() + 1).padStart(2, '0')
        const taskDay = String(taskCreatedDate.getDate()).padStart(2, '0')
        taskDateStr = `${taskYear}-${taskMonth}-${taskDay}`
        
        return taskDateStr === targetDateStr
      } catch (error) {
        console.warn('Date parsing error for task:', task.id, task.created_at)
        return false
      }
    })
    
    // If there's a selected employee, filter tasks to show only those assigned to the selected employee
    // For "My Tasks" view, filter by current user
    if (selectedEmployee) {
      filteredTasks = filteredTasks.filter(task => task.assigned_to === selectedEmployee.id)
    } else if (isMyTasksMode) {
      // Filter by current user for "My Tasks" view
      filteredTasks = filteredTasks.filter(task => task.assigned_to === currentUser?.id)
    }
    
    return filteredTasks
  }

  const handleYearSelect = (year) => {
    setSelectedYear(year)
    // Keep view as 'year' to show all months on the same page
  }

  const handleMonthSelect = (monthIndex) => {
    setSelectedMonth(monthIndex)
    setView('days')
  }

  const handleDayClick = (day) => {
    if (!day) return
    const selectedDate = new Date(selectedYear, selectedMonth, day)
    navigateToDayView(selectedDate)
  }

  // Handle day click in year view
  const handleYearViewDayClick = (year, month, day) => {
    if (!day) return
    const selectedDate = new Date(year, month, day)
    navigateToDayView(selectedDate)
  }

  // Handle month click in year view (navigate to month view)
  const handleYearViewMonthClick = (monthIndex) => {
    setSelectedMonth(monthIndex)
    setView('days')
  }

  const navigateToToday = () => {
    const now = new Date()
    setSelectedYear(now.getFullYear())
    setSelectedMonth(now.getMonth())
    setCurrentDate(now)
    setView('days')
  }

  const goBack = () => {
    if (view === 'days') {
      setView('year');
    }
    // Keep selectedEmployee context when going back
  };

  const navigateToAllEmployeesCalendar = () => {
    // Navigate to calendar view but keep the selected employee context
    navigateToCalendar();
    // Also exit my tasks mode when navigating to all employees
    setIsMyTasksMode(false);
  };

  const openTaskView = (task) => {
    setViewingTask(task)
  }

  const closeTaskView = () => {
    setViewingTask(null)
  }

  const openTaskById = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setViewingTask(task);
    }
  }

  const openAttachment = (attachment) => {
    if (attachment.type === 'link') {
      window.open(attachment.url, '_blank')
    } else {
      // For documents and photos, open in a new tab
      window.open(attachment.url, '_blank')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in-progress':
        return 'bg-amber-100 text-amber-800'
      case 'planned':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'bg-green-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'high':
        return 'bg-orange-500'
      case 'urgent':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const handleTaskDelete = async (task) => {
    setTaskToDelete(task)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async (action) => {
    setShowDeleteDialog(false);
    if (!taskToDelete) return;
    
    try {
      await deleteTask(taskToDelete.id, action);
      
      // If task was deleted, remove it from todo list assigned dates
      setTodoList(prev => prev.map(todo => {
        if (todo.assignedDate) {
          // Check if this todo is assigned to the deleted task's date
          const taskDate = new Date(taskToDelete.created_at);
          const todoDate = new Date(todo.assignedDate);
          
          if (taskDate.toDateString() === todoDate.toDateString() && 
              todo.title === taskToDelete.title) {
            return { ...todo, assignedDate: null };
          }
        }
        return todo;
      }));
      
      // Close task detail if it's open for the deleted task
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

  // Function to open a task by ID (to be called from other components)
  const openTaskFromNotification = (taskId) => {
    if (!taskId) {
      console.warn('No task ID provided to openTaskFromNotification');
      return;
    }
    setTaskToView(taskId);
  }

  // Handle drag start
  const handleDragStart = (e, task) => {
    if (!isAdmin) return;
    // Include source information to distinguish between tasks and todos
    e.dataTransfer.setData('text/plain', JSON.stringify({ ...task, source: 'task' }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTask(task);
    // Set drag image to improve UX
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
    if (!isAdmin || !day || !draggedTask) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(day);
  };

  // Handle drag leave
  const handleDragLeave = (e) => {
    // Only clear drop target if we're leaving the calendar day cell
    if (e.target.classList.contains('min-h-24')) {
      setDropTarget(null);
    }
  };

  // Handle drop on calendar day (updated to handle both tasks and todos)
  const handleDrop = async (e, day) => {
    e.preventDefault();
    if (!isAdmin || !day) return;
    
    const data = e.dataTransfer.getData('text/plain');
    if (!data) return;
    
    try {
      const parsedData = JSON.parse(data);
      
      // Check what type of item is being dropped
      if (parsedData.source === 'task') {
        // Moving a task from one day to another
        await moveTaskToDay(parsedData, day);
      } else if (parsedData.source === 'todo') {
        // Moving a todo to a calendar day (convert to task)
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
    // Create a date string for the target day (this ensures we keep the correct calendar day)
    const year = selectedYear;
    const month = String(selectedMonth + 1).padStart(2, '0'); // Months are 0-indexed
    const dayStr = String(day).padStart(2, '0');
    const targetDateStr = `${year}-${month}-${dayStr}`;
    
    // Create the date string for the backend in a way that preserves the calendar day
    // We'll create a date at noon to avoid timezone conversion issues
    const targetDate = new Date(selectedYear, selectedMonth, day, 12, 0, 0);
    const formattedDate = targetDate.toISOString();
    
    console.log('Moving task:', taskData.id);
    console.log('Target date string:', targetDateStr);
    console.log('Target date (noon):', targetDate);
    console.log('Formatted date for backend:', formattedDate);
    
    try {
      // Use the regular updateTask function but send only the created_at field
      const updatedTaskData = {
        created_at: formattedDate
      };
      
      const result = await updateTask(taskData.id, updatedTaskData);
      
      console.log('Update task result:', result);
      
      if (result.error) {
        console.error('Error updating task:', result.error);
        // Show a more user-friendly error message
        alert(`Failed to move task: ${result.error}`);
      } else {
        console.log('Task moved successfully:', result.task);
        // Log the new created_at value
        console.log('New created_at value:', result.task.created_at);
        // Show success message
        console.log('Task moved successfully!');
      }
    } catch (error) {
      console.error('Error moving task:', error);
      alert(`Failed to move task: ${error.message}`);
    }
  };

  // Function to convert a todo to a task on a specific day
  const convertTodoToTask = async (todoData, day) => {
    // Create the date string for the backend in a way that preserves the calendar day
    const year = selectedYear;
    const month = String(selectedMonth + 1).padStart(2, '0'); // Months are 0-indexed
    const dayStr = String(day).padStart(2, '0');
    const targetDateStr = `${year}-${month}-${dayStr}`;
    
    // Create the date string for the backend in a way that preserves the calendar day
    // We'll create a date at noon to avoid timezone conversion issues
    const targetDate = new Date(selectedYear, selectedMonth, day, 12, 0, 0);
    const formattedDate = targetDate.toISOString();
    
    try {
      // Create a new task based on the todo item
      const newTaskData = {
        title: todoData.title,
        description: todoData.description || 'Task created from todo list',
        created_at: formattedDate,
        due_date: formattedDate,
        priority: todoData.priority || 'medium',
        status: 'planned',
        assigned_to: currentUser?.id || null,
        estimated_hours: todoData.estimated_hours || 1.00
      };
      
      const result = await createTask(newTaskData);
      
      if (result.error) {
        console.error('Error creating task:', result.error);
        alert(`Failed to create task: ${result.error}`);
      } else {
        console.log('Task created successfully:', result.task);
        
        // If moving (not copying), remove from todo list
        if (dragAction === 'move') {
          setTodoList(prev => prev.filter(t => t.id !== todoData.id));
        } else {
          // If copying, update todo list to show assigned date
          setTodoList(prev => prev.map(t => 
            t.id === todoData.id ? { ...t, assignedDate: targetDate } : t
          ));
        }
        
        // Show success message
        console.log('Task created successfully!');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert(`Failed to create task: ${error.message}`);
    }
  };

  // Handle todo list drag start
  const handleTodoDragStart = (e, todo) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ ...todo, source: 'todo' }));
    e.dataTransfer.effectAllowed = dragAction === 'copy' ? 'copy' : 'move';
  };

  // Handle todo drop on calendar day
  const handleTodoDrop = async (e, day) => {
    e.preventDefault();
    const todoData = e.dataTransfer.getData('text/plain');
    if (!todoData) return;
    
    const todo = JSON.parse(todoData);
    if (!todo) return;
    
    // Create the date string for the backend in a way that preserves the calendar day
    const year = selectedYear;
    const month = String(selectedMonth + 1).padStart(2, '0'); // Months are 0-indexed
    const dayStr = String(day).padStart(2, '0');
    const targetDateStr = `${year}-${month}-${dayStr}`;
    
    // Create the date string for the backend in a way that preserves the calendar day
    // We'll create a date at noon to avoid timezone conversion issues
    const targetDate = new Date(selectedYear, selectedMonth, day, 12, 0, 0);
    const formattedDate = targetDate.toISOString();
    
    try {
      // Create a new task based on the todo item
      const newTaskData = {
        title: todo.title,
        description: todo.description || 'Task created from todo list',
        created_at: formattedDate,
        due_date: formattedDate,
        priority: todo.priority || 'medium',
        status: 'planned',
        assigned_to: currentUser?.id || null,
        estimated_hours: todo.estimated_hours || 1.00
      };
      
      const result = await createTask(newTaskData);
      
      if (result.error) {
        console.error('Error creating task:', result.error);
        alert(`Failed to create task: ${result.error}`);
      } else {
        console.log('Task created successfully:', result.task);
        
        // If moving (not copying), remove from todo list
        if (dragAction === 'move') {
          setTodoList(prev => prev.filter(t => t.id !== todo.id));
        } else {
          // If copying, update todo list to show assigned date
          setTodoList(prev => prev.map(t => 
            t.id === todo.id ? { ...t, assignedDate: targetDate } : t
          ));
        }
        
        // Show success message
        console.log('Task created successfully!');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert(`Failed to create task: ${error.message}`);
    }
  };

  // Toggle todo completion status
  const toggleTodoCompletion = async (id) => {
    setTodoList(prev => {
      return prev.map(todo => {
        if (todo.id === id) {
          const updatedTodo = { ...todo, completed: !todo.completed };
          
          // If todo is marked as completed and it's assigned to a date, 
          // we should also mark the corresponding task as completed
          if (updatedTodo.completed && updatedTodo.assignedDate) {
            // Find the task in the tasks list that matches this todo
            const correspondingTask = tasks.find(task => 
              task.title === updatedTodo.title && 
              new Date(task.created_at).toDateString() === new Date(updatedTodo.assignedDate).toDateString() &&
              task.assigned_to === currentUser?.id
            );
            
            if (correspondingTask) {
              // Update the task status to completed
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

  // Handle attachment changes for new todo
  const handleTodoAttachmentChange = (e) => {
    const { name, value } = e.target;
    setNewTodo(prev => {
      const attachments = prev.attachments && prev.attachments.length > 0 
        ? [...prev.attachments] 
        : [{ id: Date.now(), type: 'link', url: '', name: '' }];
      
      attachments[0] = { ...attachments[0], [name]: value };
      
      return {
        ...prev,
        attachments
      };
    });
  };

  // Add attachment to new todo
  const addTodoAttachment = () => {
    if (newTodo.attachments && newTodo.attachments.length > 0 && newTodo.attachments[0].url) {
      const newAttachment = {
        id: Date.now(),
        type: 'link',
        url: newTodo.attachments[0].url,
        name: newTodo.attachments[0].name || newTodo.attachments[0].url
      };
      setNewTodo(prev => ({
        ...prev,
        attachments: [newAttachment]
      }));
    }
  };

  // Remove attachment from new todo
  const removeTodoAttachment = (index) => {
    setNewTodo(prev => {
      const attachments = [...prev.attachments];
      attachments.splice(index, 1);
      return { ...prev, attachments };
    });
  };

  // Add new todo item
  const addNewTodo = () => {
    if (newTodo.title.trim() === '') return;
    
    const newTodoItem = {
      id: `todo${Date.now()}`,
      ...newTodo,
      completed: false,
      assignedDate: null,
      attachments: newTodo.attachments || []
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
      
      // If task is marked as completed, update corresponding todo item
      if (newStatus === 'completed') {
        const updatedTask = result.task;
        if (updatedTask) {
          setTodoList(prev => prev.map(todo => {
            // Check if this todo corresponds to the completed task
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

  // Make this function available to other components through context or props
  // For now, we'll just export it as a named export
  window.openTaskFromNotification = openTaskFromNotification;

  // Check if we're in "My Tasks" view
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
                    onClick={() => handleYearViewMonthClick(index)}
                  >
                    <div className="flex justify-between items-center mb-2">
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
                            className={`text-xs text-center py-1 rounded-full ${
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
              <div className="p-6">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                      {day.substring(0, 3)}
                    </div>
                  ))}
                </div>
                
                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-1">
                  {generateCalendarDays(selectedYear, selectedMonth).map((day, index) => {
                    const isCurrentDay = selectedYear === today.getFullYear() && 
                                         selectedMonth === today.getMonth() && 
                                         day === today.getDate();
                    const isDropTarget = day === dropTarget;

                    return (
                      <div
                        key={index}
                        onClick={() => handleDayClick(day)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (day) {
                            // Check what type of item is being dragged
                            const data = e.dataTransfer.getData('text/plain');
                            if (data) {
                              try {
                                const parsedData = JSON.parse(data);
                                if (parsedData.source === 'task') {
                                  // Moving a task between days
                                  e.dataTransfer.dropEffect = 'move';
                                } else if (parsedData.source === 'todo') {
                                  // Moving a todo to a day
                                  e.dataTransfer.dropEffect = dragAction === 'copy' ? 'copy' : 'move';
                                }
                              } catch (error) {
                                // Not a valid JSON, default to move
                                e.dataTransfer.dropEffect = 'move';
                              }
                            } else {
                              // Default to move for tasks
                              e.dataTransfer.dropEffect = 'move';
                            }
                            setDropTarget(day);
                          }
                        }}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => day && handleDrop(e, day)}
                        className={`
                          min-h-24 p-2 border rounded-lg relative
                          ${day ? 'cursor-pointer hover:bg-gray-50' : ''}
                          ${isCurrentDay
                            ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-300'
                            : 'border-gray-200'
                          }
                          ${dropTarget === day
                            ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-200'
                            : ''
                          }
                        `}
                      >
                        {day && isDropTarget && (
                          <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                            {dragAction === 'copy' ? 'C' : 'M'}
                          </div>
                        )}
                        {day && (
                          <>
                            <div className={`text-sm font-medium mb-1 ${
                              isCurrentDay ? 'text-blue-700 font-bold' : 'text-gray-900'
                            }`}>
                              {day}
                            </div>
                            <div className="space-y-1 overflow-y-auto max-h-32">
                              {getTasksForDay(day).slice(0, 10).map(task => (
                                <div 
                                  key={task.id}
                                  className="relative group"
                                >
                                  <div
                                    draggable={isAdmin}
                                    onDragStart={(e) => isAdmin && handleDragStart(e, task)}
                                    onDragEnd={handleDragEnd}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openTaskView(task);
                                    }}
                                    className={`text-xs p-1 rounded truncate cursor-pointer hover:bg-opacity-80 ${
                                      task.status === 'completed' 
                                        ? 'bg-green-100 text-green-800 line-through' 
                                        : task.priority === 'high' || task.priority === 'urgent'
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-blue-100 text-blue-800'
                                    } ${
                                      isAdmin ? 'cursor-move touch-manipulation' : 'cursor-pointer'
                                    } ${
                                      draggedTask && draggedTask.id === task.id ? 'opacity-50 ring-2 ring-blue-500' : ''
                                    }`}
                                  >
                                    {task.title}
                                    {isAdmin && (
                                      <span className="ml-1 text-xs opacity-70">⋮⋮</span>
                                    )}
                                  </div>
                                  {isAdmin && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTaskDelete(task);
                                      }}
                                      className="absolute top-0 right-0 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                      title="Delete task"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  )}
                                  {isAdmin && (
                                    <select
                                      value={task.status}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        handleTaskStatusChange(task.id, e.target.value);
                                      }}
                                      className="absolute bottom-0 right-0 w-6 h-4 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <option value="planned">Planned</option>
                                      <option value="in-progress">In Progress</option>
                                      <option value="completed">Completed</option>
                                    </select>
                                  )}
                                </div>
                              ))}
                              {getTasksForDay(day).length > 10 && (
                                <div className="text-xs text-gray-500">
                                  +{getTasksForDay(day).length - 10} more
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )

                  })}
                </div>
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
            
            {/* Add new todo form */}
            {showTodoForm && (
              <div className="mb-4 p-3 border border-gray-200 rounded-md bg-gray-50">
                <div className="space-y-3">
                  <input
                    type="text"
                    name="title"
                    value={newTodo.title}
                    onChange={handleTodoFormChange}
                    placeholder="Todo title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                  <textarea
                    name="description"
                    value={newTodo.description}
                    onChange={handleTodoFormChange}
                    placeholder="Description (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    rows="2"
                  />
                  
                  {/* Attachments for todo - matching TaskForm implementation */}
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-700">Attachments</h4>
                      {newTodo.attachments.length > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {newTodo.attachments.length} attached
                        </span>
                      )}
                    </div>
                    
                    {/* Add Attachment Form - simplified version of TaskForm */}
                    <div className="bg-gray-50 p-2 rounded-md mb-2">
                      <div className="grid grid-cols-1 gap-1 mb-1">
                        <input
                          type="url"
                          name="url"
                          value={newTodo.attachments && newTodo.attachments.length > 0 ? newTodo.attachments[0]?.url || '' : ''}
                          onChange={handleTodoAttachmentChange}
                          placeholder="Enter URL"
                          className="p-1 border rounded text-xs"
                        />
                        <input
                          type="text"
                          name="name"
                          value={newTodo.attachments && newTodo.attachments.length > 0 ? newTodo.attachments[0]?.name || '' : ''}
                          onChange={handleTodoAttachmentChange}
                          placeholder="Link name (optional)"
                          className="p-1 border rounded text-xs"
                        />
                        <button
                          type="button"
                          onClick={addTodoAttachment}
                          className="px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
                        >
                          Add Link
                        </button>
                      </div>
                    </div>
                    
                    {/* Attachment List - matching TaskForm */}
                    <div className="space-y-1">
                      {newTodo.attachments.map((attachment, index) => (
                        <div key={attachment.id} className="flex items-center justify-between p-1 bg-white border rounded">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            <span className="text-xs truncate max-w-[120px]">{attachment.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeTodoAttachment(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      
                      {newTodo.attachments.length === 0 && (
                        <p className="text-xs text-gray-500 italic">No attachments added</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Priority</label>
                      <select
                        name="priority"
                        value={newTodo.priority}
                        onChange={handleTodoFormChange}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Hours</label>
                      <input
                        type="number"
                        name="estimated_hours"
                        value={newTodo.estimated_hours}
                        onChange={handleTodoFormChange}
                        min="0.25"
                        step="0.25"
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      />
                    </div>
                  </div>
                  <button
                    onClick={addNewTodo}
                    className="w-full px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                  >
                    Add Todo
                  </button>
                </div>
              </div>
            )}

            {/* Drag action selector */}
            <div className="mb-4 flex space-x-2">
              <button
                onClick={() => handleDragActionChange('copy')}
                className={`flex-1 px-3 py-2 rounded-md text-sm ${
                  dragAction === 'copy' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Copy
              </button>
              <button
                onClick={() => handleDragActionChange('move')}
                className={`flex-1 px-3 py-2 rounded-md text-sm ${
                  dragAction === 'move' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Move
              </button>
            </div>
            
            {/* Todo list items */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {todoList.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No todos yet</p>
              ) : (
                todoList.map(todo => (
                  <div 
                    key={todo.id}
                    draggable
                    onDragStart={(e) => handleTodoDragStart(e, todo)}
                    className={`p-3 border rounded-md cursor-move hover:bg-gray-50 relative ${
                      todo.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                    }`}
                  >
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="absolute top-1 right-1 text-gray-400 hover:text-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => toggleTodoCompletion(todo.id)}
                        className="mt-1 mr-2"
                      />
                      <div className="flex-1">
                        <p className={`text-sm ${todo.completed ? 'line-through text-green-600' : 'text-gray-900'}`}>
                          {todo.title}
                        </p>
                        {todo.description && (
                          <p className={`text-xs mt-1 ${todo.completed ? 'text-green-500' : 'text-gray-500'}`}>
                            {todo.description}
                          </p>
                        )}
                        {todo.attachments && todo.attachments.length > 0 && (
                          <div className="mt-2">
                            <h5 className="text-xs font-medium text-gray-600 mb-1">Attachments:</h5>
                            <div className="space-y-1">
                              {todo.attachments.map((attachment, index) => (
                                <div key={index} className="flex items-center text-xs p-1 bg-gray-50 rounded">
                                  <svg className="w-3 h-3 text-blue-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                  </svg>
                                  <span className="truncate">{attachment.name || attachment.url}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center mt-2">
                          <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                            todo.priority === 'low' ? 'bg-green-500' :
                            todo.priority === 'medium' ? 'bg-yellow-500' :
                            todo.priority === 'high' ? 'bg-orange-500' :
                            'bg-red-500'
                          }`}></span>
                          <span className="text-xs text-gray-500">
                            {todo.estimated_hours} hrs
                          </span>
                        </div>
                        {todo.assignedDate && (
                          <p className="text-xs text-gray-500 mt-1">
                            Assigned: {new Date(todo.assignedDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-4 text-xs text-gray-500">
              <p>Drag todos to calendar days to create tasks</p>
              <p className="mt-1">Select Copy/Move before dragging</p>
              <p className="mt-1">Check todos to mark them as completed</p>
            </div>
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
            setShowDeleteDialog(false)
            setTaskToDelete(null)
          }}
        />
      )}
    </div>
  )
}

export default EnhancedCalendar