import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth/useAuthStore';

/**
 * Bảo vệ route dựa trên role
 * @param {Array<string>} allowedRoles - Danh sách các role được phép truy cập
 */
function RoleBasedRoute({ allowedRoles = [] }) {
  const user = useAuthStore((state) => state.user);
  
  // Nếu chưa đăng nhập
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin có thể truy cập tất cả
  const userRole = user.role || user.roleName || user.RoleName;
  if (userRole === 'Admin') {
    return <Outlet />;
  }

  // Kiểm tra role hiện tại
  
  // Nếu role không được phép
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default RoleBasedRoute;

