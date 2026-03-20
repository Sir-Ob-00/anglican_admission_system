# Anglican Admission System Documentation

This document is the primary, end-to-end reference for the Anglican Admission System (AAS). It covers system purpose, architecture, configuration, data model, API endpoints, frontend routes, and operational workflows.

## Table of Contents
1. Overview
2. Architecture
3. Roles and Permissions
4. Core Workflows
5. Project Structure
6. Backend API
7. Frontend Application
8. Data Model (MongoDB)
9. Configuration and Environment Variables
10. Security
11. File Storage and Uploads
12. Backups and Restore
13. Logging and Reporting
14. Local Development
15. Deployment Notes

## 1. Overview
The Anglican Admission System is a full-stack admission management platform for Anglican schools. It manages applicants, entrance exams, admission decisions, payments, documents, and parent interactions, with role-based dashboards for staff and parents.

Key capabilities:
- Applicant intake and status tracking
- Entrance exam scheduling, publishing, and grading
- Admission approvals and confirmations
- Parent document uploads
- Payment initiation and verification
- Notifications and activity logs
- System backups and restores

## 2. Architecture
The system is a classic SPA + API setup.
- Frontend: React + Vite + TailwindCSS
- Backend: Node.js + Express + MongoDB (Mongoose)
- Auth: JWT bearer tokens
- Storage: Local filesystem for uploaded documents and backups

High-level flow:
1. Frontend authenticates via `/api/auth/login`.
2. JWT token is stored in `localStorage` and sent as `Authorization: Bearer <token>` on requests.
3. Backend enforces role-based access via middleware.
4. Public exam endpoints are provided without authentication for examinees.

## 3. Roles and Permissions
Defined roles (from `backend/src/utils/roles.js`):
- `admin`
- `headteacher`
- `assistantHeadteacher`
- `teacher`
- `parent`

Role access is enforced on every secured API route using `requireRoles(...)`. Routes that are not protected are limited to:
- Auth registration / login
- Public exam endpoints
- Health check

## 4. Core Workflows

### 4.1 Applicant Lifecycle
Applicant status values (`ApplicantStatuses`):
`pending_review` -> `exam_scheduled` -> `exam_completed` -> `exam_passed` / `exam_failed`
-> `awaiting_payment` -> `payment_completed` -> `admitted` or `rejected`

### 4.2 Exam Lifecycle
Exam status values:
`draft` -> `scheduled` -> `active` -> `completed`

Typical flow:
1. Headteacher creates exam (draft).
2. Assistant Headteacher or Teacher adds questions.
3. Headteacher assigns exam to applicant.
4. Assigned supervisor publishes exam.
5. Applicant takes exam via public entrance exam portal.
6. Auto-grading creates an exam result; teacher may add manual scores.
7. Assistant Headteacher recommends; Headteacher decides final result.

### 4.3 Admissions
1. After a pass + payment verification, Headteacher approves admission.
2. Admission records are created with a unique admission number.
3. Admission confirmation is downloadable for staff and parents.

### 4.4 Payments
1. Initiate payment by staff.
2. Parent or staff verifies payment.
3. Receipt is downloadable for staff/parents.

## 5. Project Structure

Root:
- `backend/` API server
- `frontend/` React SPA
- `docs/` Documentation (this file)
- `README.md` quick overview

Backend (key directories):
```
backend/
  server.js
  src/
    app.js
    config/
    controllers/
    middleware/
    models/
    routes/
    services/
    uploads/
    utils/
```

Frontend (key directories):
```
frontend/
  src/
    components/
    context/
    pages/
    routes/
    services/
    utils/
```

## 6. Backend API
Base URL (default): `http://localhost:5000`

Authentication: `Authorization: Bearer <JWT>`

### 6.1 Auth
Public routes:
- `POST /api/auth/register` Create a Parent user
- `POST /api/auth/bootstrap-admin` Create the first Admin user (optional bootstrap token)
- `POST /api/auth/login` Login and receive JWT

Protected routes:
- `POST /api/auth/logout` Client-side logout acknowledgement
- `GET /api/auth/me` Fetch current user

### 6.2 Users (Admin/Headteacher)
- `GET /api/users`
- `POST /api/users` (Admin only)
- `GET /api/users/:id`
- `PUT /api/users/:id` (Admin only)
- `DELETE /api/users/:id` (Admin only)

### 6.3 Applicants
- `POST /api/applicants` (Headteacher, Assistant Headteacher)
- `GET /api/applicants`
- `GET /api/applicants/:id`
- `PUT /api/applicants/:id`
- `DELETE /api/applicants/:id` (Headteacher)

### 6.4 Exams
- `POST /api/exams` (Headteacher)
- `GET /api/exams`
- `GET /api/exams/:id`
- `PUT /api/exams/:id` (Headteacher)
- `PUT /api/exams/:id/supervisor` (Headteacher, Assistant Headteacher)
- `POST /api/exams/:id/publish` (Assistant Headteacher, Teacher)
- `GET /api/exams/:id/questions`
- `POST /api/exams/:id/questions` (Assistant Headteacher, Teacher)
- `POST /api/exams/assign/applicant/:id` (Headteacher)
- `POST /api/exams/results/:id/recommendation` (Assistant Headteacher)
- `POST /api/exams/results/:id/teacher-assessment` (Teacher)
- `POST /api/exams/results/:id/decision` (Headteacher)
- `POST /api/exams/submit` (Authenticated users)

### 6.5 Exam Questions
- `GET /api/exam-questions`
- `POST /api/exam-questions`
- `PUT /api/exam-questions/:id`
- `DELETE /api/exam-questions/:id`

### 6.6 Exam Results
- `GET /api/exam-results`
- `GET /api/exam-results/:id`

### 6.7 Admissions
- `POST /api/admissions/approve` (Headteacher)
- `POST /api/admissions/reject` (Headteacher)
- `GET /api/admissions`
- `GET /api/admissions/:id`
- `GET /api/admissions/applicant/:applicantId/confirmation`

### 6.8 Payments
- `GET /api/payments`
- `POST /api/payments/initiate`
- `POST /api/payments` (alias)
- `POST /api/payments/verify`
- `GET /api/payments/:id/receipt`

### 6.9 Documents
- `POST /api/documents/upload`
- `POST /api/documents` (alias)
- `GET /api/documents`
- `GET /api/documents/:applicantId`
- `PUT /api/documents/:id/verify`

### 6.10 Teachers
- `GET /api/teachers`
- `POST /api/teachers`
- `PUT /api/teachers/:id`
- `PUT /api/teachers/:id/activate`
- `PUT /api/teachers/:id/deactivate`
- `POST /api/teachers/:id/reset-password`

### 6.11 Parents
- `GET /api/parents`
- `POST /api/parents`
- `PUT /api/parents/:id`
- `POST /api/parents/link-student`

### 6.12 Classes
- `GET /api/classes`
- `POST /api/classes`
- `PUT /api/classes/:id`

### 6.13 Students
- `GET /api/students`
- `GET /api/students/:id`

### 6.14 Dashboard
- `GET /api/dashboard/summary`
- `GET /api/dashboard/headteacher`
- `GET /api/dashboard/assistant`
- `GET /api/dashboard/teacher`
- `GET /api/dashboard/parent`

### 6.15 Notifications
- `GET /api/notifications`
- `PUT /api/notifications/:id/read`
- `POST /api/notifications/:id/read`

### 6.16 Reports
- `GET /api/reports`

### 6.17 Activity Logs
- `GET /api/activity-logs`

### 6.18 Backups
- `POST /api/backups/create`
- `GET /api/backups`
- `GET /api/backups/:id/download`
- `POST /api/backups/:id/restore` (Admin only)

### 6.19 Public Exam Endpoints
No authentication required.
- `GET /api/public/exams/:id`
- `GET /api/public/exams/:id/questions`
- `POST /api/public/exams/submit`
- `GET /api/public/entrance-exams/:code`
- `GET /api/public/entrance-exams/:code/questions`
- `POST /api/public/entrance-exams/submit`

### 6.20 Health Check
- `GET /health` -> `{ ok: true }`

## 7. Frontend Application
Default dev URL: `http://localhost:5173`

Main route groups:
- Public pages: landing, about, login, public exams
- Protected dashboard layout for all authenticated users
- Role-specific home pages:
  - `/admin`
  - `/headteacher`
  - `/assistant-headteacher`
  - `/teacher`
  - `/parent`

Protected application pages:
- Applicants: `/applicants`, `/applicants/new`, `/applicants/:id`
- Admissions: `/admissions`, `/admissions/:id`
- Exams: `/exams`, `/exams/:id/questions`, `/exams/:id/results`, `/exams/:id/take`, `/exams/scores`
- Payments: `/payments`, `/payments/initiate`
- Documents: `/documents`
- Classes: `/classes`
- Teachers: `/teachers`
- Students: `/students`
- Parents: `/parents`, `/parents/link`
- Reports: `/reports`
- Notifications: `/notifications`
- Settings: `/settings/users`, `/settings/backup`, `/settings/logs`

Auth token handling:
- Stored as `aas_token` in `localStorage`
- User profile stored as `aas_user`
- `AuthContext` refreshes `/api/auth/me` on load

## 8. Data Model (MongoDB)

### Users
Fields: `name`, `email`, `username`, `passwordHash`, `role`, `isActive`, `twoFactorEnabled`

### Applicants
Fields: `fullName`, `dateOfBirth`, `gender`, `classApplyingFor`, `parentUser`, `parentName`,
`address`, `parentContact`, `status`, `exam`, `examAssignedAt`, `examScore`, `paymentStatus`,
`admissionStatus`, `createdBy`

### Exams
Fields: `code`, `title`, `classLevel`, `subjects`, `supervisorTeacher`, `supervisorUser`,
`scheduledAt`, `durationMinutes`, `passMark`, `status`, `publishedAt`, `createdBy`

### Exam Questions
Fields: `exam`, `subject`, `text`, `options`, `correctIndex`, `points`

### Exam Results
Fields: `exam`, `applicant`, `fullName`, `score`, `totalPoints`, `percentage`, `result`,
`manualScore`, `manualTotalPoints`, `overallScore`, `overallTotalPoints`, `overallPercentage`,
`answers`, `submittedAt`, `gradedAt`, `submissionMeta`, `teacherAssessment`,
`assistantRecommendation`, `finalDecision`

### Admissions
Fields: `applicant`, `admissionNumber`, `approvedBy`, `approvedAt`

### Payments
Fields: `applicant`, `amount`, `method`, `status`, `initiatedBy`, `paidBy`, `paidAt`, `reference`

### Documents
Fields: `applicant`, `documentType`, `filePath`, `originalName`, `mimeType`, `size`,
`uploadedBy`, `verified`, `verifiedBy`, `verifiedAt`

### Classes
Fields: `name`, `teacher`, `capacity`

### Teachers
Fields: `user`, `staffId`, `subject`

### Parents
Fields: `user`, `phone`, `address`

### Students
Fields: `applicant`, `admissionNumber`, `fullName`, `classAssigned`, `parentUser`

### Parent-Student Links
Fields: `parentUser`, `student`, `linkedBy`, `linkedAt`

### Notifications
Fields: `user`, `applicant`, `type`, `message`, `read`, `createdAt`

### Activity Logs
Fields: `user`, `action`, `ipAddress`, `meta`, `timestamp`

### Backups
Fields: `name`, `status`, `createdBy`, `notes`, `filePath`

## 9. Configuration and Environment Variables
Backend (`backend/.env`):
- `NODE_ENV` (default: `development`)
- `PORT` (default: `5000`)
- `MONGO_URI` (default: `mongodb://localhost:27017/anglican-admission-system`)
- `CORS_ORIGIN` (default: `http://localhost:5173`)
- `JWT_SECRET` (default: `change_me_dev_secret`)
- `JWT_EXPIRES_IN` (default: `1d`)
- `RATE_LIMIT_WINDOW_MS` (default: 900000)
- `RATE_LIMIT_MAX` (default: 300)
- `UPLOAD_MAX_BYTES` (default: 10485760)
- `BACKUP_SCHEDULE_MINUTES` (default: 0)
- `BOOTSTRAP_TOKEN` (default: empty)

Frontend (`frontend/.env`):
- `VITE_API_BASE_URL` (default: `http://localhost:5000`)

## 10. Security
Security measures in place:
- JWT auth with server-side verification
- Role-based access control for all protected routes
- `helmet` security headers
- Rate limiting across all requests
- Bcrypt password hashing
- User activation status check on every request

## 11. File Storage and Uploads
Uploads are stored locally in:
- `backend/src/uploads/documents`
- `backend/src/uploads/backups`

Static file access:
- `GET /uploads/<path>` is served by the backend for uploaded files.

## 12. Backups and Restore
Manual:
- Create via `POST /api/backups/create`
- Download via `GET /api/backups/:id/download`
- Restore via `POST /api/backups/:id/restore` (Admin only)

Automatic:
- Controlled by `BACKUP_SCHEDULE_MINUTES`
- If set to > 0, periodic backups run at that interval

## 13. Logging and Reporting
Activity logs:
- Captured in `ActivityLog` model
- Exposed via `GET /api/activity-logs` (Admin, Headteacher)

Reports:
- Available via `GET /api/reports`
- Intended for dashboards and analytics in `Reports` page

Notifications:
- `Notification` records are created for key events
- Exposed via `GET /api/notifications`

## 14. Local Development

Backend:
```bash
cd backend
npm install
npm run dev
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

## 15. Deployment Notes
- Use a managed MongoDB instance for production.
- Set a strong `JWT_SECRET`.
- Restrict `CORS_ORIGIN` to the deployed frontend URL.
- Consider storing uploads and backups in object storage (S3, GCS) for scale.

