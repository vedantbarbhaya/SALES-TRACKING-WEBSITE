import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/Dashboard';
import SalesHistoryPage from './pages/SalesHistoryPage';
import SaleDetailsPage from './pages/SalesDetailsPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import NewSalePage from './pages/NewSalePage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/sales">
              <Route index element={<SalesHistoryPage />} />
              <Route path="new" element={<NewSalePage />} />
              <Route path=":id" element={<SaleDetailsPage />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;