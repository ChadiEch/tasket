import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EnhancedCalendar from '../components/EnhancedCalendar';
import { AppProvider } from '../context/AppContext';

// Mock the useApp hook
jest.mock('../context/AppContext', () => ({
  useApp: () => ({
    tasks: [
      {
        id: '1',
        title: 'Test Task',
        created_at: '2023-05-15',
        assigned_to: '1',
        created_by: '1',
        status: 'planned',
        priority: 'medium'
      }
    ],
    navigateToDayView: jest.fn(),
    selectedEmployee: null,
    navigateToCalendar: jest.fn(),
    currentUser: { id: '1', role: 'admin' },
    isAdmin: true,
    deleteTask: jest.fn(),
    updateTask: jest.fn()
  }),
  AppProvider: ({ children }) => <div>{children}</div>
}));

describe('Drag and Drop Functionality', () => {
  test('renders draggable task items for admin users', () => {
    render(
      <AppProvider>
        <EnhancedCalendar />
      </AppProvider>
    );
    
    // Check that the task is rendered
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    
    // Check that the task item has draggable attribute
    const taskItem = screen.getByText('Test Task').closest('div');
    expect(taskItem).toHaveAttribute('draggable', 'true');
  });

  test('shows visual feedback during drag operations', () => {
    render(
      <AppProvider>
        <EnhancedCalendar />
      </AppProvider>
    );
    
    const taskItem = screen.getByText('Test Task').closest('div');
    
    // Simulate drag start
    fireEvent.dragStart(taskItem, {
      dataTransfer: {
        effectAllowed: 'move'
      }
    });
    
    // Check that visual feedback is applied
    expect(taskItem).toHaveClass('opacity-50');
  });
});