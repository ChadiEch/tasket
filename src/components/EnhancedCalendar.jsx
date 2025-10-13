import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import TaskDetail from './tasks/TaskDetail'
import DeleteConfirmationDialog from './tasks/DeleteConfirmationDialog'
import DraggableTaskItem from './DraggableTaskItem'

const EnhancedCalendar = ({ view: propView }) => {
  const { tasks, navigateToDayView, selectedEmployee, navigateToCalendar, currentUser, isAdmin, deleteTask, updateTask } = useApp()
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

  const today = new Date()

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
        
        // Extract date part using UTC to match backend storage
        // This ensures we compare the actual calendar date, not the local time representation
        const taskYear = taskCreatedDate.getUTCFullYear()
        const taskMonth = String(taskCreatedDate.getUTCMonth() + 1).padStart(2, '0')
        const taskDay = String(taskCreatedDate.getUTCDate()).padStart(2, '0')
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
    setShowDeleteDialog(false)
    if (!taskToDelete) return
    
    try {
      await deleteTask(taskToDelete.id, action)
      // Close task detail if it's open for the deleted task
      if (viewingTask && viewingTask.id === taskToDelete.id) {
        setViewingTask(null)
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      alert('Failed to delete task')
    } finally {
      setTaskToDelete(null)
    }
  }

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
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
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

  // Handle drop
  const handleDrop = async (e, day) => {
    e.preventDefault();
    if (!isAdmin || !draggedTask || !day) return;
    
    // Calculate the new date using UTC to avoid timezone issues
    // Create a date string in YYYY-MM-DD format directly
    const year = selectedYear;
    const month = String(selectedMonth + 1).padStart(2, '0'); // Months are 0-indexed
    const dayStr = String(day).padStart(2, '0');
    const dateString = `${year}-${month}-${dayStr}`;
    
    // Create a date object for the start of the day in local time
    const newDate = new Date(selectedYear, selectedMonth, day, 0, 0, 0, 0);
    
    // Format the date to ISO string for the backend, but ensure it represents the correct day
    // We'll use the date string to create a proper UTC date
    const formattedDate = newDate.toISOString();
    
    console.log('Moving task:', draggedTask.id);
    console.log('Target date string:', dateString);
    console.log('New date (local):', newDate);
    console.log('Formatted date for backend:', formattedDate);
    
    try {
      // Update the task's created_at date
      const updatedTaskData = {
        ...draggedTask,
        created_at: formattedDate
      };
      
      // Call the updateTask function from context
      const result = await updateTask(draggedTask.id, updatedTaskData);
      
      if (result.error) {
        console.error('Error updating task:', result.error);
        alert('Failed to move task. Please try again.');
      } else {
        console.log('Task moved successfully:', result.task);
      }
    } catch (error) {
      console.error('Error moving task:', error);
      alert('Failed to move task. Please try again.');
    } finally {
      setDraggedTask(null);
      setDropTarget(null);
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
                    onDragOver={(e) => day && handleDragOver(e, day)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => day && handleDrop(e, day)}
                    className={`
                      min-h-24 p-2 border rounded-lg relative
                      ${day ? 'cursor-pointer hover:bg-gray-50' : ''}
                      ${isCurrentDay
                        ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-300'
                        : 'border-gray-200'
                      }
                      ${isDropTarget && isAdmin && draggedTask
                        ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-200'
                        : ''
                      }
                    `}
                  >
                    {day && isDropTarget && isAdmin && draggedTask && (
                      <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                        ↓
                      </div>
                    )}
                    {day && (
                      <>
                        <div className={`text-sm font-medium mb-1 ${
                          isCurrentDay ? 'text-blue-700 font-bold' : 'text-gray-900'
                        }`}>
                          {day}
                        </div>
                        <div className="space-y-1">
                          {getTasksForDay(day).slice(0, 3).map(task => (
                            <div 
                              key={task.id}
                              className="relative group"
                            >
                              <DraggableTaskItem
                                task={task}
                                isAdmin={isAdmin}
                                onTaskClick={openTaskView}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                isDragging={draggedTask && draggedTask.id === task.id}
                              />
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
                            </div>
                          ))}
                          {getTasksForDay(day).length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{getTasksForDay(day).length - 3} more
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