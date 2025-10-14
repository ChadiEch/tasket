// Test file for EnhancedCalendar component
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

describe('EnhancedCalendar', () => {
  test('renders todo list section', () => {
    render(<EnhancedCalendar />);
    
    expect(screen.getByText('Todo List')).toBeInTheDocument();
    expect(screen.getByText('Add Todo')).toBeInTheDocument();
  });

  test('opens todo form when Add Todo button is clicked', () => {
    render(<EnhancedCalendar />);
    
    const addTodoButton = screen.getByText('Add Todo');
    fireEvent.click(addTodoButton);
    
    expect(screen.getByPlaceholderText('Todo title')).toBeInTheDocument();
  });
});