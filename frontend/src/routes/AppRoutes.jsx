import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import DashboardLayout from "../components/layout/DashboardLayout";
import Landing from "../pages/public/Landing";
import About from "../pages/public/About";
import PublicTakeExam from "../pages/public/PublicTakeExam";
import ExamSubmitted from "../pages/public/ExamSubmitted";
import EntranceExamStart from "../pages/public/EntranceExamStart";
import EntranceExamPortal from "../pages/public/EntranceExamPortal";
import EntranceExamSubmitted from "../pages/public/EntranceExamSubmitted";
import Dashboard from "../pages/dashboard/Dashboard";
import ApplicantsList from "../pages/applicants/ApplicantsList";
import AddApplicant from "../pages/applicants/AddApplicant";
import ApplicantDetails from "../pages/applicants/ApplicantDetails";
import ApplicantReview from "../pages/applicants/ApplicantReview";
import AdmissionsList from "../pages/admissions/AdmissionsList";
import AdmissionDetails from "../pages/admissions/AdmissionDetails";
import StudentDetails from "../pages/admissions/StudentDetails";
import ExamsList from "../pages/exams/ExamsList";
import CreateExam from "../pages/exams/CreateExam";
import EditExam from "../pages/exams/EditExam";
import ExamQuestions from "../pages/exams/ExamQuestions";
import ExamResults from "../pages/exams/ExamResults";
import TeacherAssignedExams from "../pages/exams/TeacherAssignedExams";
import TeacherAssignedExamDetails from "../pages/exams/TeacherAssignedExamDetails";
import TakeExam from "../pages/exams/TakeExam";
import ExamScoreView from "../pages/exams/ExamScoreView";
import EnterExamScores from "../pages/exams/EnterExamScores";
import PaymentsList from "../pages/payments/PaymentsList";
import PaymentSubmissions from "../pages/payments/PaymentSubmissions";
import PaymentVerification from "../pages/payments/PaymentVerification";
// Removed: InitiatePayment - parents now pay directly from dashboard
import Documents from "../pages/documents/Documents";
import ClassesList from "../pages/classes/ClassesList";
import TeachersList from "../pages/teachers/TeachersList";
import ParentsList from "../pages/parents/ParentsList";
import LinkParent from "../pages/parents/LinkParent";
import Reports from "../pages/reports/Reports";
import Notifications from "../pages/notifications/Notifications";
import Settings from "../pages/settings/Settings";
import UsersManagement from "../pages/settings/UsersManagement";
import BackupSystem from "../pages/settings/BackupSystem";
import ActivityLogs from "../pages/settings/ActivityLogs";
import SystemReset from "../pages/admin/SystemReset";
import StudentsList from "../pages/students/StudentsList";
import NotFound from "../pages/NotFound";
import CameraTest from "../pages/test/CameraTest";
import MfaLogin from "../pages/auth/MfaLogin";
import TwoFactorAuth from "../pages/auth/TwoFactorAuth";
import ForgotPassword from "../pages/auth/ForgotPassword";
import TwoFactorTest from "../pages/test/TwoFactorTest";
import OTPTest from "../pages/test/OTPTest";
import { roleHomePath } from "../utils/helpers";

function Home() {
  return <Landing />;
}

function RoleHomeRedirect() {
  const { role } = useAuth();
  console.log("RoleHomeRedirect - role:", role);
  console.log("RoleHomeRedirect - path:", roleHomePath(role));
  return <Navigate to={roleHomePath(role)} replace />;
}

function RoleOnly({ allow, children }) {
  const { role } = useAuth();
  // Convert both to lowercase for comparison
  if (role?.toLowerCase() !== allow.toLowerCase()) {
    return <Navigate to={roleHomePath(role)} replace />;
  }
  return children;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/2fa" element={<TwoFactorAuth />} />
        <Route path="/mfa" element={<MfaLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/test-2fa" element={<TwoFactorTest />} />
        <Route path="/test-otp" element={<OTPTest />} />
        <Route path="/exam/:id" element={<PublicTakeExam />} />
        <Route path="/exam/:id/submitted" element={<ExamSubmitted />} />
        <Route path="/entrance-exam" element={<EntranceExamStart />} />
        <Route path="/entrance-exam/:code" element={<EntranceExamPortal />} />
        <Route path="/entrance-exam/:code/submitted" element={<EntranceExamSubmitted />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/payments/verify" element={<PaymentVerification />} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<RoleHomeRedirect />} />

            <Route
              path="/admin"
              element={
                <RoleOnly allow="admin">
                  <Dashboard />
                </RoleOnly>
              }
            />
            <Route
              path="/admin/system-reset"
              element={
                <RoleOnly allow="admin">
                  <SystemReset />
                </RoleOnly>
              }
            />
            <Route
              path="/headteacher"
              element={
                <RoleOnly allow="headteacher">
                  <Dashboard />
                </RoleOnly>
              }
            />
            <Route
              path="/assistant-headteacher"
              element={
                <RoleOnly allow="assistantHeadteacher">
                  <Dashboard />
                </RoleOnly>
              }
            />
            <Route
              path="/teacher"
              element={
                <RoleOnly allow="teacher">
                  <Dashboard />
                </RoleOnly>
              }
            />
            <Route
              path="/parent"
              element={
                <RoleOnly allow="parent">
                  <Dashboard />
                </RoleOnly>
              }
            />

            <Route path="/applicants" element={<ApplicantsList />} />
            <Route path="/applicants/new" element={<AddApplicant />} />
            <Route path="/applicants/:id" element={<ApplicantDetails />} />
            <Route path="/applicants/:id/review" element={<ApplicantReview />} />

            <Route path="/admissions" element={<AdmissionsList />} />
            <Route path="/admissions/:id" element={<AdmissionDetails />} />
            <Route path="/admissions/students/:id" element={<StudentDetails />} />

            <Route path="/exams" element={<ExamsList />} />
            <Route path="/exams/new" element={<CreateExam />} />
            <Route path="/exams/assigned" element={<TeacherAssignedExams />} />
            <Route path="/exams/assigned/:id" element={<TeacherAssignedExamDetails />} />
            <Route path="/exams/scores" element={<EnterExamScores />} />
            <Route path="/exams/:id/edit" element={<EditExam />} />
            <Route path="/exams/:id/questions" element={<ExamQuestions />} />
            <Route path="/exams/:id/results" element={<ExamResults />} />
            <Route path="/exams/session/:sessionId/take" element={<TakeExam />} />
            <Route path="/exams/:id/take" element={<TakeExam />} />
            <Route path="/exams/:id/score" element={<ExamScoreView />} />

            <Route path="/payments" element={<PaymentsList />} />
            <Route path="/payments/submissions" element={<PaymentSubmissions />} />
            // Removed: /payments/initiate - parents now pay directly from dashboard

            <Route path="/documents" element={<Documents />} />
            <Route path="/classes" element={<ClassesList />} />
            <Route path="/teachers" element={<TeachersList />} />
            <Route path="/students" element={<StudentsList />} />

            <Route path="/parents" element={<ParentsList />} />
            <Route path="/parents/link" element={<LinkParent />} />

            <Route path="/reports" element={<Reports />} />
            <Route path="/notifications" element={<Notifications />} />

            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/users" element={<UsersManagement />} />
            <Route path="/settings/backup" element={<BackupSystem />} />
            <Route path="/settings/logs" element={<ActivityLogs />} />
          </Route>
        </Route>

        <Route path="/test/camera" element={<CameraTest />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
