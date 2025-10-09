# Trash Functionality Documentation

## Overview
This document explains the trash functionality implemented in the Tasket application, which allows users to either permanently delete tasks or move them to a trash bin where they can be restored later.

## Features

### 1. Dual Delete Options
When deleting a task, users can choose between:
- **Move to Trash**: Safely moves tasks to a trash bin where they can be restored
- **Permanent Delete**: Immediately removes tasks and all associated attachments

### 2. Trash Management
- Dedicated trash page to view all deleted tasks
- Restore functionality to bring tasks back to their previous state
- Permanent delete option for tasks in the trash
- Automatic cleanup of trashed tasks after 30 days

## Implementation Details

### Backend
The backend implementation includes:
- Extended Task model with trash-related fields:
  - `status`: Added 'trashed' to the enum values
  - `trashed_at`: Timestamp when task was moved to trash
  - `restored_at`: Timestamp when task was restored from trash
  - `status_before_trash`: Stores the task's status before being moved to trash
- New API endpoints:
  - `GET /api/tasks/trashed` - Get all trashed tasks
  - `DELETE /api/tasks/:id?action=trash` - Move task to trash
  - `DELETE /api/tasks/:id?action=delete` - Permanently delete task
  - `PUT /api/tasks/:id/restore` - Restore task from trash
  - `DELETE /api/tasks/:id/permanent` - Permanently delete trashed task
- Scheduled cleanup service that automatically deletes trashed tasks after 30 days

### Frontend
The frontend implementation includes:
- **TrashPage Component**: Dedicated page to manage trashed tasks with:
  - List view of all trashed tasks
  - Individual restore and permanent delete buttons
  - Bulk operations for multiple tasks
  - Selection checkboxes for bulk operations
- **DeleteConfirmationDialog Component**: Modal dialog for choosing delete options
- **Sidebar Navigation**: Added "Trash" link to navigation menu
- **TaskDetail Component**: Updated to show delete options with confirmation dialog
- **API Integration**: Updated API library with trash-related functions

## Usage

### Moving Tasks to Trash
1. Open a task detail view
2. Click the "Delete" button (admin only)
3. Choose "Move to Trash" in the confirmation dialog
4. The task will be moved to the trash bin

### Restoring Tasks from Trash
1. Navigate to the Trash page
2. Find the task you want to restore
3. Click the "Restore" button
4. The task will be restored to its previous state

### Permanently Deleting Tasks
1. From task detail view:
   - Click "Delete"
   - Choose "Delete Permanently" in the confirmation dialog
2. From Trash page:
   - Click "Delete" button next to a trashed task
   - Confirm permanent deletion
   - Or use bulk operations to delete multiple tasks

### Bulk Operations
1. Navigate to the Trash page
2. Select multiple tasks using checkboxes
3. Click "Restore Selected" or "Delete Selected"
4. Confirm the bulk operation

## File Handling

### When Moving to Trash
- Files remain in the uploads directory
- Task metadata is updated to reflect trashed status

### When Permanently Deleting
- All associated attachment files are removed from the file system
- Task record is removed from the database

## Automatic Cleanup
- Trashed tasks are automatically permanently deleted after 30 days
- This process runs daily at midnight
- Users are not notified of automatic cleanup

## Permissions
- Only task creators or admins can trash, restore, or permanently delete tasks
- Users can only see their own trashed tasks unless they are admins

## Best Practices
1. Use trash for tasks you might need later
2. Regularly review trashed tasks to free up storage
3. Be cautious with permanent deletion as it cannot be undone
4. Educate users about the difference between trash and permanent delete