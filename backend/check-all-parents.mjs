import mongoose from 'mongoose';
import { env } from './src/config/env.js';
import User from './src/models/User.js';
import Applicant from './src/models/Applicant.js';

mongoose.connect(env.mongoUri).then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Check all parent users
    const parents = await User.find({ role: 'parent' });
    console.log('All parent users in database:');
    parents.forEach(parent => {
      console.log(`- Username: "${parent.username}", ID: ${parent._id}, Role: ${parent.role}`);
    });
    
    // Check for variations of the username
    const searchTerms = ['atta saa', 'atta saa', 'attasaa'];
    for (const term of searchTerms) {
      const parent = await User.findOne({ username: term });
      if (parent) {
        console.log(`\nFound parent with username "${term}":`);
        console.log('- ID:', parent._id);
        console.log('- Name:', parent.name);
        console.log('- Role:', parent.role);
        
        const applicants = await Applicant.find({ parentUser: parent._id }).sort({ createdAt: -1 });
        console.log('- Applicants linked:', applicants.length);
        
        if (applicants.length > 0) {
          const latest = applicants[0];
          console.log('- Latest applicant:');
          console.log('  - Name:', latest.fullName);
          console.log('  - Status:', latest.status);
          console.log('  - Payment Status:', latest.paymentStatus);
          console.log('  - Can Pay:', latest.status === 'exam_passed' && latest.paymentStatus !== 'payment_completed' ? 'YES' : 'NO');
        }
      } else {
        console.log(`No parent found with username "${term}"`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}).catch(err => {
  console.error('Database connection error:', err);
  process.exit(1);
});
