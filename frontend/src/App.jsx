import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/Dashboard';
import SalesHistoryPage from './pages/SalesHistoryPage';
import SaleDetailsPage from './pages/SalesDetailsPage';
import NewSalePage from './pages/NewSalePage';

// Admin-only route wrapper
const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (user?.role !== 'admin') {
    return <Navigate to="/sales/new" replace />;
  }
  
  return children;
};

// Protected route with role-based redirect
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Default route handler based on user role
const DefaultRoute = () => {
  const { user } = useAuth();
  return <Navigate to={user?.role === 'admin' ? "/dashboard" : "/sales/new"} replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes wrapped in Layout */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            {/* Default route */}
            <Route index element={<DefaultRoute />} />
            
            {/* Admin-only routes */}
            <Route path="/dashboard" element={
              <AdminRoute>
                <DashboardPage />
              </AdminRoute>
            } />

            {/* Sales routes - accessible to all authenticated users */}
            <Route path="/sales">
              <Route index element={<Navigate to="history" replace />} />
              <Route path="history" element={<SalesHistoryPage />} />
              <Route path="new" element={<NewSalePage />} />
              <Route path=":id" element={<SaleDetailsPage />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<DefaultRoute />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;