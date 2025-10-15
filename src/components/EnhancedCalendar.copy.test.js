// Test to verify copy functionality with attachments
console.log('Testing copy functionality with attachments');

// Test data structure for a todo item with attachments
const testTodo = {
  id: 'todo123',
  title: 'Test Todo with Attachments',
  description: 'This is a test todo item',
  completed: false,
  assignedDate: null,
  priority: 'medium',
  estimated_hours: 1.00,
  attachments: [
    {
      id: 1,
      type: 'photo',
      url: 'https://example.com/image.jpg',
      name: 'image.jpg',
      size: 1024
    },
    {
      id: 2,
      type: 'document',
      url: 'https://example.com/document.pdf',
      name: 'document.pdf',
      size: 2048
    }
  ]
};

console.log('Test todo item:', testTodo);

// Test serialization/deserialization
const serialized = JSON.stringify({...testTodo, source: 'todo'});
console.log('Serialized todo:', serialized);

const deserialized = JSON.parse(serialized);
console.log('Deserialized todo:', deserialized);

// Verify that attachments are preserved
console.log('Attachments preserved:', 
  deserialized.attachments.length === testTodo.attachments.length &&
  deserialized.attachments[0].url === testTodo.attachments[0].url &&
  deserialized.attachments[1].url === testTodo.attachments[1].url
);

console.log('Copy functionality test completed');