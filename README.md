# Anglican Admission System

A full-stack admission management system designed for Anglican schools.  
The system manages applicants, entrance exams, payments, admissions, and parent interactions.

---

## Features

- Applicant management
- Online entrance exams
- Automated exam grading
- Admission approval workflow
- Parent document uploads
- Admission fee payment
- Role-based dashboards
- Notifications
- Activity logs
- System backup

---

## Tech Stack

Frontend
- React
- React Router
- Axios
- TailwindCSS

Backend
- Node.js
- Express
- MongoDB
- Mongoose
- JWT Authentication

---

## Project Structure



---

## Roles in the System

### Admin
- View reports
- Manage users
- System backup
- Activity logs

### Headteacher
- Add applicants
- Manage admissions
- Assign entrance exams
- Manage teachers and classes

### Assistant Headteacher
- Conduct reviews
- Assign teachers for exams
- Manage payments

### Class Teacher
- Conduct entrance exams
- Enter exam scores

### Parent
- View applicant status
- Upload documents
- Pay admission fees

---

## Installation

Clone repository



# 🏫 School Admission System — Backend API

A full-featured, role-based admission management system built with **Node.js / Express** and **MongoDB**.

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your database credentials and secrets
```

### 3. Seed default users
```bash
npm run seed
```

### 4. Start the server
```bash
npm run dev     # development (with nodemon)
npm start       # production
```

---

## 🔐 Default Credentials (after seed)

| Role                   | Email                        | Password           |
|------------------------|------------------------------|--------------------|
| Admin                  | admin@school.com             | Admin@1234         |
| Headteacher            | headteacher@school.com       | Headteacher@1234   |
| Assistant Headteacher  | assistant@school.com         | Assistant@1234     |
| Class Teacher          | teacher@school.com           | Teacher@1234       |

---

## 📁 Project Structure

```
src/
├── server.js                    # Express app entry point
├── config/
│   ├── db.js                     # MongoDB connection
│   ├── seed.js                   # Seed initial data
│   ├── logger.js                 # Winston logger
│   └── permissions.js            # Role-permission map
├── controllers/
│   ├── authController.js        # Auth, 2FA, password reset
│   ├── applicantController.js   # Admission workflow
│   ├── examController.js        # Exam lifecycle & grading
│   ├── paymentController.js     # Payments
│   ├── documentController.js    # File uploads
│   └── mainController.js        # Users, classes, reports, backups...
├── middleware/
│   ├── auth.js                  # JWT + permission guards
│   ├── activityLog.js           # Activity logging
│   ├── errorHandler.js          # Validation + error handling
│   └── upload.js                # Multer file uploads
├── routes/
│   └── index.js                 # All API routes
└── services/
    └── notificationService.js   # In-app + email notifications
```

---

## 📋 Database Collections

| Collection                | Purpose                              |
|---------------------------|--------------------------------------|
| `users`                     | All system users                     |
| `parents`                   | Parent profiles                      |
| `applicants`                | Admission applicants                 |
| `parentstudentlinks`      | Parent ↔ Student relationship        |
| `classes`                   | School classes                       |
| `teachers`                  | Teacher profiles                     |
| `exams`                     | Entrance exams                       |
| `examquestions`           | Questions per exam                   |
| `examresults`             | Graded results                       |
| `admissions`                | Formal admission records             |
| `students`                  | Admitted student records             |
| `payments`                  | Admission fee payments               |
| `documents`                 | Uploaded supporting documents        |
| `notifications`             | In-app notifications                 |
| `activitylogs`            | Full audit trail                     |
| `backups`                   | Database backup records              |

---

## 🔄 Admission Workflow States

```
pending_review → exam_scheduled → exam_in_progress → exam_submitted
    → exam_passed / exam_failed → awaiting_payment → payment_confirmed → admitted
                                                                       ↘ rejected
```

---

## 🌐 API Reference

### Auth
| Method | Endpoint                    | Description           |
|--------|-----------------------------|-----------------------|
| POST   | /api/auth/register          | Register user         |
| POST   | /api/auth/login             | Login + JWT           |
| POST   | /api/auth/refresh           | Refresh access token  |
| GET    | /api/auth/me                | Get current user      |
| POST   | /api/auth/forgot-password   | Send reset email      |
| POST   | /api/auth/reset-password    | Reset password        |
| POST   | /api/auth/verify-email      | Verify email          |
| POST   | /api/auth/change-password   | Change password       |
| POST   | /api/auth/2fa/setup         | Get 2FA QR code       |
| POST   | /api/auth/2fa/enable        | Enable 2FA            |
| POST   | /api/auth/2fa/disable       | Disable 2FA           |

### Applicants
| Method | Endpoint                        | Description                   |
|--------|----------------------------------|-------------------------------|
| GET    | /api/applicants                  | List applicants (filtered)    |
| POST   | /api/applicants                  | Add applicant                 |
| GET    | /api/applicants/:id              | Get applicant details         |
| PUT    | /api/applicants/:id              | Update applicant              |
| PATCH  | /api/applicants/:id/status       | Update admission status       |
| POST   | /api/applicants/:id/link-parent  | Link parent to applicant      |

### Exams
| Method | Endpoint                              | Description                  |
|--------|---------------------------------------|------------------------------|
| GET    | /api/exams                            | List exams                   |
| POST   | /api/exams                            | Create exam                  |
| GET    | /api/exams/:id                        | Get exam + questions         |
| POST   | /api/exams/:id/questions              | Add questions                |
| PATCH  | /api/exams/:id/publish                | Publish exam                 |
| POST   | /api/exams/:examId/assign/:applicantId| Assign exam to applicant     |
| POST   | /api/exams/assign-teacher/:examId     | Assign teacher to exam       |
| POST   | /api/exams/start                      | Start exam (access token)    |
| PATCH  | /api/exams/session/:id/tab-switch     | Record tab switch            |
| POST   | /api/exams/session/:id/submit         | Submit exam (auto-graded)    |
| PATCH  | /api/exams/results/:applicantId/recommend | Teacher recommendation   |

### Payments
| Method | Endpoint                        | Description              |
|--------|---------------------------------|--------------------------|
| GET    | /api/payments                   | List payments            |
| POST   | /api/payments/initiate          | Initiate payment         |
| POST   | /api/payments/:reference/verify | Verify payment           |
| GET    | /api/payments/:reference        | Get payment details      |

### Documents
| Method | Endpoint                            | Description         |
|--------|-------------------------------------|---------------------|
| POST   | /api/documents/upload/:applicantId  | Upload document     |
| GET    | /api/documents/:applicantId         | Get documents       |
| PATCH  | /api/documents/:id/verify           | Verify document     |
| DELETE | /api/documents/:id                  | Delete document     |

### Other Endpoints
```
GET  /api/users                       List users
PUT  /api/users/:id                   Update user
DELETE /api/users/:id                 Deactivate user

GET  /api/teachers                    List teachers
PUT  /api/teachers/:id                Update teacher

GET  /api/classes                     List classes
POST /api/classes                     Create class
PUT  /api/classes/:id                 Update class
POST /api/classes/:id/assign-teacher  Assign teacher
GET  /api/classes/:id/students        List students in class

GET  /api/students                    List students

GET  /api/timetable                   Get timetable
POST /api/timetable                   Add timetable entry

GET  /api/parents                     List parents

GET  /api/notifications               Get notifications
PATCH /api/notifications/:id/read     Mark as read

GET  /api/activity-logs               Activity logs

GET  /api/reports/dashboard           Dashboard stats
GET  /api/reports/admissions          Admission summary report

GET  /api/requirements                List requirements
POST /api/requirements                Create requirement

GET  /api/backups                     List backups
POST /api/backups                     Trigger backup

GET  /health                          Health check
```

---

## 🔒 Security Features

- **JWT Authentication** with access + refresh tokens
- **Role-based access control** (5 roles, granular permissions)
- **Two-Factor Authentication** (TOTP via authenticator app)
- **Account lockout** after 5 failed login attempts
- **Rate limiting** on all routes (stricter on auth)
- **Helmet** security headers
- **Bcrypt** password hashing (12 salt rounds)
- **Tab-switch detection** during exams
- **Auto-submission** on timer expiry / tab limit exceeded

---

## 📧 Notifications

All key workflow events trigger:
1. **In-app notification** (stored in DB, fetched by frontend)
2. **Email notification** (via SMTP / Nodemailer)

Events: exam_scheduled, exam_passed, exam_failed, awaiting_payment, admitted, rejected
