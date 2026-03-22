# Anglican Admission System - Complete Setup Guide

## Overview
The Anglican Admission Management System has been refactored to use Paystack for payment processing. Parents can now initiate payments directly from their dashboard, and payments are verified automatically via webhooks.

## 🚀 Current Site Flow

### 1. Registration & Login
- **Public Registration**: Parents can register accounts (defaults to parent role)
- **Admin User Management**: Admin can create staff accounts (headteacher, assistant headteacher, teachers)
- **Role-Based Access**: Each user type has specific permissions and dashboard views

### 2. Application Process
- **Applicant Creation**: Staff create applicant records with parent information
- **Parent Linking**: Applicants can be linked to existing parent users
- **Document Upload**: Required documents uploaded for each applicant

### 3. Examination Process
- **Exam Scheduling**: Assistant headteacher schedules entrance exams
- **Exam Taking**: Students take exams online or offline
- **Result Processing**: Exam results are recorded and reviewed
- **Approval Workflow**: Assistant headteacher recommends, headteacher makes final decision

### 4. Payment Process (NEW - Paystack Integration)
- **Parent-Initiated**: Parents click "Pay Admission Fee" on their dashboard
- **Paystack Integration**: Secure payment processing via Paystack
- **Automatic Verification**: Webhook-based payment confirmation
- **Manual Fallback**: Staff can verify manual payment submissions

### 5. Admission Process
- **Admission Generation**: Successful applicants receive admission numbers
- **Class Assignment**: Students assigned to classes with teachers
- **Final Documentation**: Complete student records created

## 👥 Login Credentials

### System Administrators
#### **Admin**
- **Username**: `admin`
- **Password**: `admin123`
- **Access**: Full system administration, user management, reports

#### **Headteacher**
- **Username**: `headteacher1`
- **Password**: `head123`
- **Access**: Exam approval, admission decisions, staff oversight

#### **Assistant Headteacher**
- **Username**: `assistanthead`
- **Password**: `assist123`
- **Access**: Exam scheduling, payment verification, applicant review

### Teaching Staff
#### **Class Teacher 1**
- **Username**: `KOpoku`
- **Password**: `opoku123`
- **Access**: Student management, class assignments, exam results

#### **Class Teacher 2**
- **Username**: `@popoku`
- **Password**: `12345`
- **Access**: Student management, class assignments, exam results

### Parents
#### **Parent User**
- **Username**: `attasaa`
- **Password**: `parent123`
- **Access**: View applicant status, pay admission fees, track progress

## 🔧 Backend Setup

### 1. Environment Variables
Create `.env` file with:
```env
# Server Configuration
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/anglican-admission-system
CORS_ORIGIN=http://localhost:5173

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=1d

# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key_here
FRONTEND_URL=http://localhost:5173

# Currency Configuration
CURRENCY=GHS # Ghana Cedis
ADMISSION_FEE=50000 # ₵500.00 in pesewas

# Other Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300
UPLOAD_MAX_BYTES=10485760
```

### 2. Dependencies
Install required packages:
```bash
npm install
# Key dependencies include:
# - axios (for Paystack API)
# - mongoose (database)
# - express (server)
# - jsonwebtoken (authentication)
```

### 3. Database Setup
- **MongoDB**: Ensure MongoDB is running on `localhost:27017`
- **Collections**: System creates collections automatically
- **Bootstrap Data**: Use bootstrap token for initial data setup

## 💳 Paystack Payment Integration

### 1. Get Paystack Credentials
1. Sign up at [Paystack](https://paystack.co/)
2. Go to Settings → API Keys → Webhooks
3. Copy your **Secret Key**
4. Add webhook URL: `https://your-backend-url.com/api/payments/webhook`

### 2. Payment Flow Details
- **Step 1**: Parent logs in and views dashboard
- **Step 2**: Clicks "Pay Admission Fee" for unpaid applicant
- **Step 3**: System generates unique payment reference
- **Step 4**: Redirect to Paystack payment page
- **Step 5**: Parent completes payment (card/bank transfer)
- **Step 6**: Paystack sends webhook to backend
- **Step 7**: Backend verifies payment and updates status
- **Step 8**: Parent sees confirmation on dashboard

### 3. Payment Features
- **Real-time Status**: Payment status updates automatically
- **Secure Processing**: All payments handled by Paystack in Ghana Cedis (GHS)
- **Duplicate Prevention**: Unique references prevent double payments
- **Manual Fallback**: Staff can verify manual payment submissions
- **Email Notifications**: Automatic payment confirmations

### 4. Payment Amounts & Fees
- **Admission Fee**: ₵500.00 (Ghana Cedis)
- **Paystack Fees**: Handled by Paystack (varies by payment method)
- **Currency**: Ghana Cedis (GHS)
- **Amount in Pesewas**: Backend multiplies by 100 for Paystack API

## 🎯 Role-Based Features

### Admin Dashboard
- **User Management**: Create and manage all user accounts
- **System Overview**: View all applicants, students, teachers, parents
- **Reports**: Generate admission and payment reports
- **Settings**: Configure system parameters

### Headteacher Dashboard
- **Exam Approval**: Review and approve exam results
- **Admission Decisions**: Make final admission decisions
- **Staff Oversight**: Monitor teacher and assistant performance
- **Analytics**: View admission statistics and trends

### Assistant Headteacher Dashboard
- **Exam Management**: Schedule and manage entrance exams
- **Applicant Review**: Review applicant documents and eligibility
- **Payment Verification**: Verify manual payment submissions
- **Communication**: Coordinate with parents and staff

### Teacher Dashboard
- **Student Management**: View assigned students and their progress
- **Class Management**: Manage class schedules and assignments
- **Exam Results**: Enter and view student exam scores
- **Parent Communication**: Respond to parent inquiries

### Parent Dashboard
- **Application Tracking**: View applicant status and progress
- **Payment Management**: Pay admission fees and view payment history
- **Document Upload**: Upload required documents
- **Communication**: Receive notifications and messages

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Public registration (parents only)

### Payment Endpoints
#### New Paystack Integration
- `POST /api/payments/initialize` - Initialize payment (Parents only)
- `POST /api/payments/webhook` - Paystack webhook (no auth required)
- `GET /api/payments/admission` - View admission payments
- `GET /api/payments/submissions` - View manual submissions (Admin only)
- `POST /api/payments/verify-submission` - Verify manual submission

#### Legacy Endpoints (Still Available)
- `GET /api/payments` - List legacy payments
- `POST /api/payments/initiate` - Legacy initiation (Admin only)
- `POST /api/payments/verify` - Legacy verification

### Applicant Management
- `GET /api/applicants` - List applicants (role-filtered)
- `POST /api/applicants` - Create new applicant
- `GET /api/applicants/:id` - Get applicant details
- `PUT /api/applicants/:id` - Update applicant

### Exam Management
- `GET /api/exams` - List exams
- `POST /api/exams` - Create exam
- `GET /api/exams/:id/results` - View exam results
- `POST /api/exams/:id/scores` - Enter exam scores

## 🗄️ Database Collections

### Core Collections
- `users` - User accounts and authentication
- `applicants` - Applicant records and application data
- `students` - Enrolled student records
- `teachers` - Teacher profiles and assignments
- `classes` - Class information and schedules
- `parents` - Parent profiles and contact information

### Payment Collections
#### New Paystack Integration
- `admissionpayments` - New payment records with Paystack integration
- `paymentsubmissions` - Manual payment submissions for verification

#### Legacy Collections
- `payments` - Original payment records (kept for compatibility)

### Supporting Collections
- `examresults` - Entrance exam results and scores
- `admissions` - Admission decisions and numbers
- `documents` - Uploaded applicant documents
- `notifications` - System notifications and messages
- `activitylogs` - System activity and audit logs

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure session management
- **Role-Based Access**: Users can only access authorized features
- **Password Hashing**: Secure password storage with bcrypt
- **Session Management**: Automatic token expiration

### Payment Security
- **Webhook Signature Verification**: Prevents fake webhook calls
- **Paystack Integration**: Secure payment processing by trusted provider
- **Duplicate Prevention**: Unique references prevent double payments
- **Server-Side Verification**: Always verify with Paystack API

### Data Protection
- **Input Validation**: All user inputs are validated and sanitized
- **Rate Limiting**: API endpoints protected against abuse
- **CORS Configuration**: Cross-origin requests properly controlled
- **Helmet Security**: Security headers for HTTP requests

## 🧪 Testing Guide

### 1. Login Testing
Test each user role with the provided credentials:
1. **Admin Access**: Full system administration features
2. **Headteacher Access**: Exam approval and admission decisions
3. **Assistant Headteacher**: Exam scheduling and payment verification
4. **Teacher Access**: Student and class management
5. **Parent Access**: Application tracking and payment

### 2. Payment Flow Testing
1. **Login as Parent**: Use `attasaa` / `parent123`
2. **Navigate to Dashboard**: Should show applicant information
3. **Check Payment Status**: Look for "Pay Admission Fee" button
4. **Initiate Payment**: Click button and redirect to Paystack
5. **Test Payment**: Use Paystack test card `4084084084084081`
6. **Verify Completion**: Check dashboard for payment confirmation

### 3. Manual Payment Testing
1. **Login as Assistant Headteacher**: Use `assistanthead` / `assist123`
2. **Navigate to `/payments/submissions`**: View manual submissions
3. **Test Verification**: Approve/reject payment submissions
4. **Check Results**: Verify payment status updates

### 4. Webhook Testing
Use Paystack's webhook testing tools or ngrok for local testing:
```bash
# For local development with ngrok
ngrok http 5000
# Update Paystack webhook URL to ngrok URL
```

## 🐛 Troubleshooting

### Common Issues & Solutions

#### Login Issues
1. **Invalid Credentials**: Check username/password combinations above
2. **Role Access**: Ensure users are accessing correct dashboards
3. **Session Expiry**: Login again if session expires

#### Payment Issues
1. **"Cannot find package 'axios'** - Run `npm install axios`
2. **Webhook not working** - Check Paystack webhook URL configuration
3. **Payment not verifying** - Verify Paystack secret key is correct
4. **Button not showing** - Check applicant status and payment status

#### Database Issues
1. **MongoDB Connection**: Ensure MongoDB is running on localhost:27017
2. **Collection Issues**: Check if collections exist and have data
3. **Bootstrap Data**: Use bootstrap token for initial setup

### Debug Information
The parent dashboard includes debug information to help troubleshoot payment issues:
- Applicant status and payment status
- Latest applicant information
- Parent data structure

## 💳 Paystack Test Cards

### Development Testing
Use these Paystack test cards for development (work with Ghana Cedis GHS):
- **Success Card**: `4084084084084081`
- **Failure Card**: `4084084084084082`
- **3DS Card**: `5060666666666666666`

### Test Scenarios
1. **Successful Payment**: Use success card to test complete flow
2. **Failed Payment**: Use failure card to test error handling
3. **Webhook Testing**: Test webhook verification and status updates

## 📋 Migration Notes

### Backward Compatibility
- **Legacy Payment System**: Original payment methods still available
- **Data Migration**: Existing payment records preserved
- **User Accounts**: All existing user accounts remain functional

### System Evolution
- **Payment Flow**: Moved from staff-initiated to parent-initiated payments
- **Security**: Enhanced with Paystack integration and webhook verification
- **User Experience**: Improved parent dashboard with real-time status updates

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Paystack API keys set up
- [ ] Webhook URL configured in Paystack dashboard
- [ ] Database connection tested
- [ ] All user roles tested

### Post-Deployment
- [ ] Payment flow tested with real Paystack integration
- [ ] Webhook verification working
- [ ] All user dashboards functioning
- [ ] Email notifications configured
- [ ] Backup systems in place

## 📞 Support

For issues with:
- **Paystack Integration**: Check Paystack documentation and API status
- **System Setup**: Review this guide and check environment configuration
- **User Access**: Verify login credentials and role assignments
- **Payment Issues**: Check webhook configuration and Paystack settings
