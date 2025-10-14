// Test file upload functionality
const testFileUpload = async () => {
  try {
    // Create a mock file for testing
    const fileContent = 'This is a test file for upload testing';
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const file = new File([blob], 'test-file.txt', { type: 'text/plain' });
    
    console.log('Testing file upload with file:', file.name);
    
    // Test the uploadFile function from tasksAPI
    const { tasksAPI } = await import('./src/lib/api.js');
    
    console.log('Calling tasksAPI.uploadFile...');
    const result = await tasksAPI.uploadFile(file);
    
    console.log('Upload result:', result);
    
    if (result && result.task && result.task.attachments && result.task.attachments.length > 0) {
      console.log('✅ File upload successful!');
      console.log('Uploaded file URL:', result.task.attachments[0].url);
      return true;
    } else {
      console.error('❌ File upload failed: Invalid response structure');
      return false;
    }
  } catch (error) {
    console.error('❌ File upload failed with error:', error);
    return false;
  }
};

// Run the test
testFileUpload();