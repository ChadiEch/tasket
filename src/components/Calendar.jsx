import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import DraggableTaskItem from './DraggableTaskItem'

const Calendar = () => {
  const { tasks, navigateToDayView, selectedEmployee, user, isAdmin, updateTask } = useApp() // Use updateTask instead of updateTaskCreatedAt
  const [currentDate, setCurrentDate] = useState(new Date())
  const [draggedTask, setDraggedTask] = useState(null) // State for dragged task
  const [dropTarget, setDropTarget] = useState(null) // State for drop target

  const today = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
  const firstDayWeekday = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  // Generate calendar days
  const calendarDays = []
  
  // Add empty cells for days before month starts
  for (let i = 0; i < firstDayWeekday; i++) {
    calendarDays.push(null)
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  const getTasksForDay = (day) => {
    if (!day) return []
    
    // Create date for the specific day using local timezone
    const targetDate = new Date(currentYear, currentMonth, day)
    const year = targetDate.getFullYear()
    const month = String(targetDate.getMonth() + 1).padStart(2, '0')
    const dayStr = String(targetDate.getDate()).padStart(2, '0')
    const targetDateStr = `${year}-${month}-${dayStr}`
    
    // Filter tasks by created_at date instead of due_date
    let filteredTasks = tasks.filter(task => {
      if (!task.created_at) return false
      
      // Handle different date formats and ensure proper comparison with timezone awareness
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
    if (selectedEmployee) {
      filteredTasks = filteredTasks.filter(task => task.assigned_to === selectedEmployee.id)
    }
    
    return filteredTasks
  }

  const handleDayClick = (day) => {
    if (!day) return
    const selectedDate = new Date(currentYear, currentMonth, day)
    navigateToDayView(selectedDate)
  }

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + direction)
      return newDate
    })
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
    if (e.target.classList.contains('min-h-[60px]') || e.target.classList.contains('min-h-[80px]')) {
      setDropTarget(null);
    }
  };

  // Handle drop
  const handleDrop = async (e, day) => {
    e.preventDefault();
    if (!isAdmin || !draggedTask || !day) return;
    
    // Create a date string for the target day (this ensures we keep the correct calendar day)
    const year = currentYear;
    const month = String(currentMonth + 1).padStart(2, '0'); // Months are 0-indexed
    const dayStr = String(day).padStart(2, '0');
    const targetDateStr = `${year}-${month}-${dayStr}`;
    
    // Create the date string for the backend in a way that preserves the calendar day
    // We'll create a date at noon to avoid timezone conversion issues
    const targetDate = new Date(currentYear, currentMonth, day, 12, 0, 0);
    const formattedDate = targetDate.toISOString();
    
    console.log('Moving task:', draggedTask.id);
    console.log('Target date string:', targetDateStr);
    console.log('Target date (noon):', targetDate);
    console.log('Formatted date for backend:', formattedDate);
    
    try {
      // Use the regular updateTask function but send only the created_at field
      const updatedTaskData = {
        created_at: formattedDate
      };
      
      const result = await updateTask(draggedTask.id, updatedTaskData);
      
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
        alert('Task moved successfully!');
      }
    } catch (error) {
      console.error('Error moving task:', error);
      alert(`Failed to move task: ${error.message}`);
    } finally {
      setDraggedTask(null);
      setDropTarget(null);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6">
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        {/* Calendar Header */ }
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">
            {selectedEmployee ? `${selectedEmployee.name}'s Calendar` : `${monthNames[currentMonth]} ${currentYear}`}
          </h2>
          <div className="flex space-x-1 md:space-x-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 touch-manipulation"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-2 md:px-3 py-2 text-xs md:text-sm border border-gray-300 rounded-md hover:bg-gray-50 touch-manipulation"
            >
              Today
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 touch-manipulation"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Day Names */ }
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="p-1 md:p-2 text-center text-xs md:text-sm font-medium text-gray-500">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.slice(0, 1)}</span>
            </div>
          ))}
        </div>

        {/* Calendar Grid */ }
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const dayTasks = getTasksForDay(day)
            const isToday = day && 
              currentYear === today.getFullYear() && 
              currentMonth === today.getMonth() && 
              day === today.getDate()
            const isDropTarget = day === dropTarget

            return (
              <div
                key={index}
                onClick={() => handleDayClick(day)}
                onDragOver={(e) => day && handleDragOver(e, day)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => day && handleDrop(e, day)}
                className={`
                  min-h-[60px] md:min-h-[80px] p-1 md:p-2 border border-gray-100 cursor-pointer hover:bg-gray-50 touch-manipulation relative
                  ${day ? 'bg-white' : 'bg-gray-50'}
                  ${isToday ? 'bg-blue-50 border-blue-200' : ''}
                  ${isDropTarget && isAdmin && draggedTask ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-200' : ''}
                `}
              >
                {day && isDropTarget && isAdmin && draggedTask && (
                  <div className="absolute top-0 right-0 bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] md:w-5 md:h-5 md:text-xs">
                    ↓
                  </div>
                )}
                {day && (
                  <>
                    <div className={`text-xs md:text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                      {day}
                    </div>
                    {dayTasks.length > 0 && (
                      <div className="mt-1 space-y-1">
                        {/* Show fewer tasks on mobile */ }
                        {dayTasks.slice(0, window.innerWidth < 768 ? 1 : 2).map(task => (
                          <div key={task.id} className="relative group">
                            <DraggableTaskItem
                              task={task}
                              isAdmin={isAdmin}
                              onTaskClick={handleDayClick}
                              onDragStart={handleDragStart}
                              onDragEnd={handleDragEnd}
                              isDragging={draggedTask && draggedTask.id === task.id}
                            />
                          </div>
                        ))}
                        {dayTasks.length > (window.innerWidth < 768 ? 1 : 2) && (
                          <div className="text-xs text-gray-500">
                            +{dayTasks.length - (window.innerWidth < 768 ? 1 : 2)} more
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Calendar