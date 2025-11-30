import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import AdminLayout from './components/AdminLayout';
import UserList from './pages/users/UserList';
import UserDetail from './pages/users/UserDetail';
import EnhancedUserManagement from './pages/users/EnhancedUserManagement';
import VocabularyList from './pages/content/VocabularyList';
import GeneratedContentList from './pages/content/GeneratedContentList';
import GrammarList from './pages/content/GrammarList';
import UserAnalytics from './pages/analytics/UserAnalytics';
import AIAnalytics from './pages/analytics/AIAnalytics';
import ContentAnalytics from './pages/analytics/ContentAnalytics';
import CohortAnalytics from './pages/analytics/CohortAnalytics';
import SystemHealth from './pages/monitoring/SystemHealth';
import ErrorLogs from './pages/monitoring/ErrorLogs';
import AuditLogs from './pages/monitoring/AuditLogs';
import Settings from './pages/settings/Settings';
import AdminUsers from './pages/settings/AdminUsers';
import { PermissionProvider } from './contexts/PermissionContext';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <PermissionProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<EnhancedUserManagement />} />
            <Route path="users/list" element={<UserList />} />
            <Route path="users/:id" element={<UserDetail />} />

            {/* Content Routes */}
            <Route path="content" element={<Navigate to="content/vocabulary" replace />} />
            <Route path="content/vocabulary" element={<VocabularyList />} />
            <Route path="content/generated" element={<GeneratedContentList />} />
            <Route path="content/grammar" element={<GrammarList />} />

            {/* Analytics Routes */}
            <Route path="analytics" element={<Navigate to="analytics/cohorts" replace />} />
            <Route path="analytics/cohorts" element={<CohortAnalytics />} />
            <Route path="analytics/users" element={<UserAnalytics />} />
            <Route path="analytics/ai" element={<AIAnalytics />} />
            <Route path="analytics/content" element={<ContentAnalytics />} />

            {/* Monitoring Routes */}
            <Route path="monitoring" element={<Navigate to="monitoring/health" replace />} />
            <Route path="monitoring/health" element={<SystemHealth />} />
            <Route path="monitoring/errors" element={<ErrorLogs />} />
            <Route path="monitoring/audit" element={<AuditLogs />} />

            {/* Settings Routes */}
            <Route path="settings" element={<Navigate to="settings/general" replace />} />
            <Route path="settings/general" element={<Settings />} />
            <Route path="settings/admins" element={<AdminUsers />} />
          </Route>
        </Routes>
      </Router>
    </PermissionProvider>
  );
}

export default App;
