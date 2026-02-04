import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth/useAuthStore';

/**
 * Bảo vệ route: chưa đăng nhập thì chuyển về /login.
 * Đã đăng nhập thì render Outlet (MainLayout + nội dung).
 */
function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
