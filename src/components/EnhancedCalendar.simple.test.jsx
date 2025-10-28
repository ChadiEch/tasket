// Simple test to verify EnhancedCalendar.rebuilt.jsx renders without crashing
import React from 'react';
import { render } from '@testing-library/react';
import EnhancedCalendar from './EnhancedCalendar.rebuilt';

// Mock the useApp hook
vi.mock('../context/AppContext', () => ({
  useApp: () => ({
    tasks: [],
    navigateToDayView: vi.fn(),
    selectedEmployee: null,
    navigateToCalendar: vi.fn(),
    currentUser: { id: 'user1', name: 'Test User' },
    isAdmin: true,
    deleteTask: vi.fn(),
    updateTask: vi.fn(),
    createTask: vi.fn(),
    updateTaskStatus: vi.fn()
  })
}));

// Mock the tasksAPI
vi.mock('../lib/api', () => ({
  tasksAPI: {
    uploadFile: vi.fn()
  }
}));

// Mock child components
vi.mock('./tasks/TaskDetail', () => () => <div>Task Detail</div>);
vi.mock('./tasks/DeleteConfirmationDialog', () => () => <div>Delete Confirmation</div>);

test('renders EnhancedCalendar without crashing', () => {
  expect(() => {
    render(<EnhancedCalendar />);
  }).not.toThrow();
});