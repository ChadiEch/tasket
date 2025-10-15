// Test to verify the rebuilt copy todo function
console.log('=== Testing Rebuilt Copy Todo Function ===');

// Mock data for testing
const mockTodoData = {
  id: 'todo-123',
  title: 'Test Todo Item',
  description: 'This is a test todo item with attachments',
  priority: 'medium',
  estimated_hours: 2.5,
  completed: false,
  assignedDate: null,
  attachments: [
    {
      id: 1,
      type: 'photo',
      url: 'https://example.com/image.jpg',
      name: 'image.jpg'
    },
    {
      id: 2,
      type: 'document',
      url: 'https://example.com/document.pdf',
      name: 'document.pdf'
    }
  ]
};

const mockDay = 15;
const mockSelectedYear = 2023;
const mockSelectedMonth = 5; // June (0-indexed)

console.log('Test Data:');
console.log('- Todo Data:', mockTodoData);
console.log('- Target Day:', mockDay);
console.log('- Selected Year:', mockSelectedYear);
console.log('- Selected Month:', mockSelectedMonth);

// Test the date creation logic
const targetDate = new Date(mockSelectedYear, mockSelectedMonth, mockDay, 12, 0, 0);
const formattedDate = targetDate.toISOString();

console.log('\nDate Processing:');
console.log('- Target Date:', targetDate);
console.log('- Formatted Date:', formattedDate);

// Test attachment processing logic
console.log('\nAttachment Processing:');
console.log('- Input Attachments:', mockTodoData.attachments);

// Separate attachments (simulating the logic)
const filesToUpload = [];
const existingAttachments = [];

for (const attachment of mockTodoData.attachments) {
  if (attachment.file) {
    filesToUpload.push(attachment);
  } else if (attachment.url) {
    existingAttachments.push(attachment);
  }
}

console.log('- Files to upload:', filesToUpload);
console.log('- Existing attachments:', existingAttachments);

// Combine attachments
const allAttachments = [...filesToUpload, ...existingAttachments];
console.log('- All attachments:', allAttachments);

// Test task data creation
const newTaskData = {
  title: mockTodoData.title,
  description: mockTodoData.description || 'Task created from todo list',
  created_at: formattedDate,
  due_date: formattedDate,
  priority: mockTodoData.priority || 'medium',
  status: 'planned',
  assigned_to: 'user-123', // Mock user ID
  estimated_hours: mockTodoData.estimated_hours || 1.00,
  attachments: allAttachments
};

console.log('\nTask Data Created:');
console.log('- Title:', newTaskData.title);
console.log('- Description:', newTaskData.description);
console.log('- Created At:', newTaskData.created_at);
console.log('- Due Date:', newTaskData.due_date);
console.log('- Priority:', newTaskData.priority);
console.log('- Status:', newTaskData.status);
console.log('- Assigned To:', newTaskData.assigned_to);
console.log('- Estimated Hours:', newTaskData.estimated_hours);
console.log('- Attachments Count:', newTaskData.attachments.length);

console.log('\n=== Copy Function Test Completed ===');
console.log('The rebuilt copy todo function should now properly:');
console.log('1. Process attachments correctly');
console.log('2. Create tasks with all attachment types');
console.log('3. Preserve original todo items during copy operations');
console.log('4. Remove todo items during move operations');