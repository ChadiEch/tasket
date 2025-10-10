# Admin Created At Field

This document explains how the "Created At" field works for admin users in the Tasket application.

## Overview

Admin users now have the ability to manually set the "Created At" date and time when creating or editing tasks. This feature is useful for backdating tasks or setting specific creation timestamps.

## How It Works

### Frontend (TaskForm Component)

1. When an admin user opens the task form, they will see a new "Created At" field in the form
2. The field is pre-filled with the current date and time
3. Admins can modify this field to any valid date and time
4. The field is only visible to admin users

### Backend (Task Controller)

1. When creating a task, if an admin provides a `created_at` value, it will be used as the task's creation timestamp
2. When updating a task, if an admin provides a `created_at` value, it will update the task's creation timestamp
3. The system validates that the provided date is valid before applying it
4. Non-admin users cannot modify the `created_at` field

## Technical Implementation

### Frontend Changes

1. Added a `created_at` field to the form state in TaskForm.jsx
2. Added a datetime-local input field that is only visible to admin users
3. Added helper functions to format dates properly for the input field

### Backend Changes

1. Modified the `createTask` function to accept and validate a `created_at` field from admin users
2. Modified the `updateTask` function to accept and validate a `created_at` field from admin users
3. Added validation to ensure the provided date is valid before applying it

## Usage

### Creating a Task with Custom Created At Date

1. As an admin, open the "Add Task" form
2. Fill in the task details as usual
3. Modify the "Created At" field to the desired date and time
4. Submit the form

### Editing a Task's Created At Date

1. As an admin, open the "Edit Task" form for an existing task
2. Modify the "Created At" field to the desired date and time
3. Submit the form

## Validation

The system performs the following validation on the `created_at` field:

1. Only admin users can modify the `created_at` field
2. The provided value must be a valid date
3. If an invalid date is provided, the system will use the default behavior (current timestamp)

## Security

1. Only users with the "admin" role can modify the `created_at` field
2. Non-admin users cannot see or modify this field
3. All date values are validated before being applied to the database

## Example

An admin might use this feature to:
- Backdate a task that was completed offline
- Set a specific creation time for reporting purposes
- Match the creation timestamp with an external system

## Limitations

1. The feature is only available to admin users
2. The date must be provided in a valid format
3. There is no audit trail for when the `created_at` field is modified