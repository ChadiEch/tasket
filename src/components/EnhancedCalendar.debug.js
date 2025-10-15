// Simple debug script to test EnhancedCalendar functionality
console.log('EnhancedCalendar debug script loaded');

// Test improved file name deduplication
function testFileNameDeduplication() {
  const testCases = [
    'test.png',
    'test.png.png',
    'document.pdf.pdf',
    'image.jpeg.jpeg',
    'file.txt.backup.txt'
  ];
  
  testCases.forEach(fileName => {
    // Simulate the improved deduplication logic
    let result = fileName;
    
    // More precise duplicate extension removal
    // Look for patterns like .ext.ext and remove the first .ext
    const dotParts = fileName.split('.');
    if (dotParts.length >= 3) {
      // Check if the last two parts are the same (e.g., png, png)
      if (dotParts[dotParts.length - 1] === dotParts[dotParts.length - 2]) {
        // Remove the second-to-last part
        dotParts.splice(dotParts.length - 2, 1);
        result = dotParts.join('.');
      }
    }
    
    console.log(`Input: ${fileName} -> Output: ${result}`);
  });
}

// Run the test
testFileNameDeduplication();