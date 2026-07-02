import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './Pages/Login';
import Dashboard from './Pages/Dashboard';
import OrdersList from './Pages/OrdersList';
import OrderDetail from './Pages/OrderDetail';
import OrderCreate from './Pages/OrderCreate';
import OrderTrack from './Pages/OrderTrack';
import Notifications from './Pages/Notifications';
import Users from './Pages/Users';
import UserForm from './Pages/UserForm';
import Profile from './Pages/Profile';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login"        element={<Login />} />
        <Route path="/track/:token" element={<OrderTrack />} />

        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/"             element={<Dashboard />} />
          <Route path="/orders"       element={<OrdersList />} />
          <Route path="/orders/new"   element={<OrderCreate />} />
          <Route path="/orders/:id"   element={<OrderDetail />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile"      element={<Profile />} />

          <Route path="/users"     element={<ProtectedRoute requiredRole="ADMIN"><Users /></ProtectedRoute>} />
          <Route path="/users/new" element={<ProtectedRoute requiredRole="ADMIN"><UserForm /></ProtectedRoute>} />
          <Route path="/users/:id" element={<ProtectedRoute requiredRole="ADMIN"><UserForm /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
