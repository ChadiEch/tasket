# Frontend Integration Guide for Task Trash Functionality

## Overview
This guide explains how to integrate the task trash functionality into the frontend application.

## API Integration

### 1. Move Task to Trash
```javascript
// Move task to trash
async function moveTaskToTrash(taskId) {
  try {
    const response = await fetch(`/api/tasks/${taskId}?action=trash`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      // Show success message
      showToast('Task moved to trash successfully');
      // Refresh task list
      refreshTaskList();
    } else {
      const error = await response.json();
      showToast(error.message, 'error');
    }
  } catch (error) {
    showToast('Error moving task to trash', 'error');
  }
}

// Permanently delete task
async function permanentlyDeleteTask(taskId) {
  try {
    const response = await fetch(`/api/tasks/${taskId}?action=delete`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      showToast('Task deleted permanently');
      refreshTaskList();
    } else {
      const error = await response.json();
      showToast(error.message, 'error');
    }
  } catch (error) {
    showToast('Error deleting task permanently', 'error');
  }
}
```

### 2. Restore Task from Trash
```javascript
async function restoreTask(taskId) {
  try {
    const response = await fetch(`/api/tasks/${taskId}/restore`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      showToast('Task restored successfully');
      refreshTaskList();
    } else {
      const error = await response.json();
      showToast(error.message, 'error');
    }
  } catch (error) {
    showToast('Error restoring task', 'error');
  }
}
```

### 3. Permanently Delete from Trash
```javascript
async function permanentlyDeleteFromTrash(taskId) {
  try {
    const response = await fetch(`/api/tasks/${taskId}/permanent`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      showToast('Task permanently deleted');
      refreshTrashList();
    } else {
      const error = await response.json();
      showToast(error.message, 'error');
    }
  } catch (error) {
    showToast('Error permanently deleting task', 'error');
  }
}
```

### 4. Get Trashed Tasks
```javascript
async function getTrashedTasks() {
  try {
    const response = await fetch('/api/tasks/trashed', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.tasks;
    } else {
      throw new Error('Failed to fetch trashed tasks');
    }
  } catch (error) {
    showToast('Error fetching trashed tasks', 'error');
    return [];
  }
}
```

## UI Components

### 1. Delete Confirmation Dialog
```jsx
function DeleteConfirmationDialog({ task, onClose, onConfirm }) {
  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Delete Task</h3>
        <p>Are you sure you want to delete "{task.title}"?</p>
        <div className="button-group">
          <button 
            className="btn-danger" 
            onClick={() => onConfirm('delete')}
          >
            Delete Permanently
          </button>
          <button 
            className="btn-warning" 
            onClick={() => onConfirm('trash')}
          >
            Move to Trash
          </button>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 2. Trash View Component
```jsx
function TrashView() {
  const [trashedTasks, setTrashedTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrashedTasks();
  }, []);

  const loadTrashedTasks = async () => {
    setLoading(true);
    const tasks = await getTrashedTasks();
    setTrashedTasks(tasks);
    setLoading(false);
  };

  const handleRestore = async (taskId) => {
    await restoreTask(taskId);
    loadTrashedTasks(); // Refresh the list
  };

  const handlePermanentDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to permanently delete this task?')) {
      await permanentlyDeleteFromTrash(taskId);
      loadTrashedTasks(); // Refresh the list
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="trash-view">
      <h2>Trash</h2>
      {trashedTasks.length === 0 ? (
        <p>No tasks in trash</p>
      ) : (
        <div className="task-list">
          {trashedTasks.map(task => (
            <div key={task.id} className="task-item trashed">
              <h4>{task.title}</h4>
              <p>Trashed on: {new Date(task.trashed_at).toLocaleDateString()}</p>
              <div className="actions">
                <button 
                  className="btn-success"
                  onClick={() => handleRestore(task.id)}
                >
                  Restore
                </button>
                <button 
                  className="btn-danger"
                  onClick={() => handlePermanentDelete(task.id)}
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 3. Task Item with Trash Status
```jsx
function TaskItem({ task, onDelete }) {
  const isTrashed = task.status === 'trashed';
  
  return (
    <div className={`task-item ${isTrashed ? 'trashed' : ''}`}>
      <h4>{task.title}</h4>
      {isTrashed && (
        <span className="trash-badge">In Trash</span>
      )}
      <p>{task.description}</p>
      <div className="actions">
        {isTrashed ? (
          <>
            <button 
              className="btn-success"
              onClick={() => restoreTask(task.id)}
            >
              Restore
            </button>
            <button 
              className="btn-danger"
              onClick={() => permanentlyDeleteFromTrash(task.id)}
            >
              Delete Permanently
            </button>
          </>
        ) : (
          <button 
            className="btn-danger"
            onClick={() => onDelete(task)}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
```

## Styling

### CSS for Trash Indicators
```css
.task-item.trashed {
  background-color: #fff0f0;
  border-left: 4px solid #dc3545;
}

.trash-badge {
  background-color: #dc3545;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  margin-left: 10px;
}

.btn-warning {
  background-color: #ffc107;
  border-color: #ffc107;
  color: #212529;
}

.btn-warning:hover {
  background-color: #e0a800;
  border-color: #d39e00;
}
```

## Notifications

### Toast Messages
```javascript
function showToast(message, type = 'success') {
  // Implementation depends on your toast library
  // Example with a simple toast function
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}
```

## Error Handling

### Common Error Scenarios
1. **Permission Denied**: Show appropriate error message
2. **Task Not Found**: Refresh the list
3. **Network Errors**: Show retry option
4. **File Deletion Failures**: Log and notify user

## Best Practices

1. **User Confirmation**: Always confirm destructive actions
2. **Visual Feedback**: Clearly indicate trashed tasks
3. **Undo Option**: Consider adding a brief undo option for immediate deletions
4. **Loading States**: Show loading indicators during operations
5. **Accessibility**: Ensure all actions are keyboard accessible