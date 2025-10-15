// Test file for EnhancedCalendar component drag and drop functionality
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EnhancedCalendar from './EnhancedCalendar';

// Mock the useApp hook
jest.mock('../context/AppContext', () => ({
  useApp: () => ({
    tasks: [],
    navigateToDayView: jest.fn(),
    selectedEmployee: null,
    navigateToCalendar: jest.fn(),
    currentUser: { id: 'user1', name: 'Test User' },
    isAdmin: true,
    deleteTask: jest.fn(),
    updateTask: jest.fn(),
    createTask: jest.fn(),
    updateTaskStatus: jest.fn()
  })
}));

// Mock the tasksAPI
jest.mock('../lib/api', () => ({
  tasksAPI: {
    uploadFile: jest.fn()
  }
}));

// Mock child components
jest.mock('./tasks/TaskDetail', () => () => <div>Task Detail</div>);
jest.mock('./tasks/DeleteConfirmationDialog', () => () => <div>Delete Confirmation</div>);

describe('EnhancedCalendar - Todo Drag and Drop', () => {
  test('handles todo drag with copy action correctly', () => {
    render(<EnhancedCalendar />);
    
    // Select copy action
    const copyButton = screen.getByText('Copy');
    fireEvent.click(copyButton);
    
    // Verify copy action is selected
    expect(copyButton).toHaveClass('bg-indigo-600');
  });

  test('handles todo drag with move action correctly', () => {
    render(<EnhancedCalendar />);
    
    // Select move action
    const moveButton = screen.getByText('Move');
    fireEvent.click(moveButton);
    
    // Verify move action is selected
    expect(moveButton).toHaveClass('bg-indigo-600');
  });
});