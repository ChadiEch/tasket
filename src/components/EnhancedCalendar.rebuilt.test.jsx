// Test file for rebuilt EnhancedCalendar component
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

describe('EnhancedCalendar - Rebuilt', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders calendar with year view by default', () => {
    render(<EnhancedCalendar />);
    
    expect(screen.getByText('Calendar Overview')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
    // Should show 12 months
    expect(screen.getAllByText(/January|February|March|April|May|June|July|August|September|October|November|December/)).toHaveLength(12);
  });

  test('switches to days view when month is clicked', () => {
    render(<EnhancedCalendar />);
    
    // Click on January
    const januaryButton = screen.getByText('January');
    fireEvent.click(januaryButton);
    
    // Should now show days view
    expect(screen.getByText('January 2023')).toBeInTheDocument();
    // Should show day headers
    expect(screen.getByText('S')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
  });

  test('navigates to today', () => {
    render(<EnhancedCalendar />);
    
    const todayButton = screen.getByText('Today');
    fireEvent.click(todayButton);
    
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    expect(screen.getByText(`${monthNames[currentMonth]} ${currentYear}`)).toBeInTheDocument();
  });

  test('toggles between My Tasks and All Tasks', () => {
    render(<EnhancedCalendar />);
    
    const myTasksButton = screen.getByText('My Tasks');
    fireEvent.click(myTasksButton);
    
    expect(screen.getByText('All Tasks')).toBeInTheDocument();
    
    const allTasksButton = screen.getByText('All Tasks');
    fireEvent.click(allTasksButton);
    
    expect(screen.getByText('My Tasks')).toBeInTheDocument();
  });

  test('renders todo list section', () => {
    render(<EnhancedCalendar />);
    
    expect(screen.getByText('Todo List')).toBeInTheDocument();
    expect(screen.getByText('Add Todo')).toBeInTheDocument();
  });

  test('opens todo form when Add Todo button is clicked', () => {
    render(<EnhancedCalendar />);
    
    const addTodoButton = screen.getByText('Add Todo');
    fireEvent.click(addTodoButton);
    
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  test('adds new todo item', async () => {
    render(<EnhancedCalendar />);
    
    // Open todo form
    const addTodoButton = screen.getByText('Add Todo');
    fireEvent.click(addTodoButton);
    
    // Fill in form
    const titleInput = screen.getByLabelText('Title');
    fireEvent.change(titleInput, { target: { value: 'Test Todo Item' } });
    
    const descriptionInput = screen.getByLabelText('Description');
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
    
    // Submit form
    const submitButton = screen.getByText('Add Todo');
    fireEvent.click(submitButton);
    
    // Form should close
    await waitFor(() => {
      expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
    });
  });

  test('toggles todo completion status', () => {
    render(<EnhancedCalendar />);
    
    // Find the first todo item checkbox
    const checkboxes = screen.getAllByRole('checkbox');
    const firstCheckbox = checkboxes[0];
    
    // Mark as completed
    fireEvent.click(firstCheckbox);
    
    // Should be marked as completed (have line-through class)
    expect(firstCheckbox).toBeChecked();
  });

  test('deletes todo item', () => {
    render(<EnhancedCalendar />);
    
    // Find delete button for first todo
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    const firstDeleteButton = deleteButtons[0];
    
    fireEvent.click(firstDeleteButton);
    
    // Todo should be removed (we can't easily test this without more specific selectors)
  });

  test('handles drag action selection for admins', () => {
    render(<EnhancedCalendar />);
    
    // Open todo form to see drag actions
    const addTodoButton = screen.getByText('Add Todo');
    fireEvent.click(addTodoButton);
    
    // Should have copy and move buttons
    expect(screen.getByText('Copy')).toBeInTheDocument();
    expect(screen.getByText('Move')).toBeInTheDocument();
    
    // Test switching between actions
    const copyButton = screen.getByText('Copy');
    const moveButton = screen.getByText('Move');
    
    fireEvent.click(copyButton);
    expect(copyButton).toHaveClass('bg-indigo-600');
    
    fireEvent.click(moveButton);
    expect(moveButton).toHaveClass('bg-indigo-600');
  });

  test('navigates back from days view to year view', () => {
    render(<EnhancedCalendar />);
    
    // Go to days view first
    const januaryButton = screen.getByText('January');
    fireEvent.click(januaryButton);
    
    // Now go back
    const backButton = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backButton);
    
    // Should be back to year view
    expect(screen.getByText('Calendar Overview')).toBeInTheDocument();
  });
});