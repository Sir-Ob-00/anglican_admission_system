import mongoose from 'mongoose';
import { env } from './src/config/env.js';
import User from './src/models/User.js';
import Applicant from './src/models/Applicant.js';

mongoose.connect(env.mongoUri).then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Check parent user
    const parent = await User.findOne({ username: 'atta saa' });
    console.log('Parent user:', parent ? 'Found' : 'Not found');
    
    if (parent) {
      console.log('Parent ID:', parent._id);
      console.log('Parent role:', parent.role);
      
      const applicants = await Applicant.find({ parentUser: parent._id }).sort({ createdAt: -1 });
      console.log('Applicants for this parent:', applicants.length);
      
      if (applicants.length > 0) {
        const latest = applicants[0];
        console.log('Latest applicant details:');
        console.log('- ID:', latest._id);
        console.log('- Name:', latest.fullName);
        console.log('- Status:', latest.status);
        console.log('- Payment Status:', latest.paymentStatus);
        console.log('- Parent User ID:', latest.parentUser);
        console.log('- Class Applying For:', latest.classApplyingFor);
        
        // Check if payment should be allowed
        const canPay = latest.status === 'exam_passed' && latest.paymentStatus !== 'payment_completed';
        console.log('Can pay?', canPay);
        console.log('Payment button should show?', canPay ? 'YES' : 'NO');
      } else {
        console.log('No applicants found for this parent');
      }
    } else {
      console.log('Parent user not found in database');
    }
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}).catch(err => {
  console.error('Database connection error:', err);
  process.exit(1);
});
