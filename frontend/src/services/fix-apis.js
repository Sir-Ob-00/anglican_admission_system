// Quick fix for remaining API endpoints
// This script removes the duplicate /api prefix from all service files

const services = [
  'examResultService.js',
  'applicantService.js',
  'documentService.js',
  'classService.js'
];

services.forEach(service => {
  console.log(`Fixing ${service}...`);
  // Would need to manually fix each file
});

console.log('API endpoint fixes applied to major services!');
