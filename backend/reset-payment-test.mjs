import mongoose from 'mongoose';
import { env } from './src/config/env.js';
import Applicant from './src/models/Applicant.js';

mongoose.connect(env.mongoUri).then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Find Kwaku Cena's applicant and reset payment status for testing
    const applicant = await Applicant.findOne({ fullName: 'Kwaku Cena' });
    
    if (applicant) {
      console.log('Found applicant:', applicant.fullName);
      console.log('Current status:', applicant.status);
      console.log('Current payment status:', applicant.paymentStatus);
      
      // Reset to allow payment testing
      await Applicant.updateOne(
        { _id: applicant._id },
        { 
          $set: { 
            paymentStatus: 'not_paid',
            status: 'exam_passed' // Ensure status allows payment
          } 
        }
      );
      
      console.log('✅ Payment status reset to "not_paid"');
      console.log('✅ Status set to "exam_passed"');
      console.log('✅ Now parent "attasaa" can test payment flow');
      
    } else {
      console.log('Applicant "Kwaku Cena" not found');
    }
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}).catch(err => {
  console.error('Database connection error:', err);
  process.exit(1);
});
