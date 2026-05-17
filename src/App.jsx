import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import Skeleton from './components/common/Skeleton';

// --- Lazy-loaded pages ---
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));

const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const StudentComplaints = lazy(() => import('./pages/student/StudentComplaints'));
const StudentProfile = lazy(() => import('./pages/student/StudentProfile'));

const WorkerDashboard = lazy(() => import('./pages/worker/WorkerDashboard'));
const WorkerTasks = lazy(() => import('./pages/worker/WorkerTasks'));
const WorkerProfile = lazy(() => import('./pages/worker/WorkerProfile'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminComplaints = lazy(() => import('./pages/admin/AdminComplaints'));
const AdminWorkers = lazy(() => import('./pages/admin/AdminWorkers'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const AdminVerification = lazy(() => import('./pages/admin/AdminVerification'));

const SuperAdminDashboard = lazy(() => import('./pages/superadmin/SuperAdminDashboard'));
const SuperAdminAnalytics = lazy(() => import('./pages/superadmin/SuperAdminAnalytics'));
const SuperAdminUsers = lazy(() => import('./pages/superadmin/SuperAdminUsers'));
const SuperAdminComplaints = lazy(() => import('./pages/superadmin/SuperAdminComplaints'));

const ComplaintDetail = lazy(() => import('./pages/ComplaintDetail'));

// --- Loading fallback ---
function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="space-y-4 w-full max-w-md px-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

// --- Route guards ---
function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    const rolePath = `/${user?.role.toLowerCase()}`;
    return <Navigate to={rolePath} replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (isAuthenticated) {
    const rolePath = `/${user?.role.toLowerCase()}`;
    return <Navigate to={rolePath} replace />;
  }

  return children;
}

// --- Wrapper for list routes that may render detail when ?id=xxx ---
function ListWithDetail({ ListComponent }) {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  if (id) {
    return (
      <Suspense fallback={<PageLoader />}>
        <ComplaintDetail />
      </Suspense>
    );
  }
  return (
    <Suspense fallback={<PageLoader />}>
      <ListComponent />
    </Suspense>
  );
}

// --- Dashboard wrapper ---
function DashboardRoute({ children }) {
  return (
    <DashboardLayout>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </DashboardLayout>
  );
}

// --- Main App ---
export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <Suspense fallback={<PageLoader />}>
              <HomePage />
            </Suspense>
          </PublicRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Suspense fallback={<PageLoader />}>
              <LoginPage />
            </Suspense>
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Suspense fallback={<PageLoader />}>
              <RegisterPage />
            </Suspense>
          </PublicRoute>
        }
      />

      {/* Student routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['Student']}>
            <DashboardRoute>
              <StudentDashboard />
            </DashboardRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/complaints"
        element={
          <ProtectedRoute allowedRoles={['Student']}>
            <DashboardLayout>
              <ListWithDetail ListComponent={StudentComplaints} />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/profile"
        element={
          <ProtectedRoute allowedRoles={['Student']}>
            <DashboardRoute>
              <StudentProfile />
            </DashboardRoute>
          </ProtectedRoute>
        }
      />

      {/* Worker routes */}
      <Route
        path="/worker"
        element={
          <ProtectedRoute allowedRoles={['Worker']}>
            <DashboardRoute>
              <WorkerDashboard />
            </DashboardRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker/tasks"
        element={
          <ProtectedRoute allowedRoles={['Worker']}>
            <DashboardLayout>
              <ListWithDetail ListComponent={WorkerTasks} />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker/profile"
        element={
          <ProtectedRoute allowedRoles={['Worker']}>
            <DashboardRoute>
              <WorkerProfile />
            </DashboardRoute>
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <DashboardRoute>
              <AdminDashboard />
            </DashboardRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/complaints"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <DashboardLayout>
              <ListWithDetail ListComponent={AdminComplaints} />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/workers"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <DashboardRoute>
              <AdminWorkers />
            </DashboardRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <DashboardRoute>
              <AdminReports />
            </DashboardRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/verification"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <DashboardRoute>
              <AdminVerification />
            </DashboardRoute>
          </ProtectedRoute>
        }
      />

      {/* SuperAdmin routes */}
      <Route
        path="/superadmin"
        element={
          <ProtectedRoute allowedRoles={['SuperAdmin']}>
            <DashboardRoute>
              <SuperAdminDashboard />
            </DashboardRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/analytics"
        element={
          <ProtectedRoute allowedRoles={['SuperAdmin']}>
            <DashboardRoute>
              <SuperAdminAnalytics />
            </DashboardRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/users"
        element={
          <ProtectedRoute allowedRoles={['SuperAdmin']}>
            <DashboardRoute>
              <SuperAdminUsers />
            </DashboardRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/complaints"
        element={
          <ProtectedRoute allowedRoles={['SuperAdmin']}>
            <DashboardLayout>
              <ListWithDetail ListComponent={SuperAdminComplaints} />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
