import { Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth/useAuthStore';
import Landing from '../pages/Landing';

/**
 * Ở route "/": chưa đăng nhập → trang Landing (tên dự án, thông tin, nút Đăng nhập).
 * Đã đăng nhập → render Outlet (MainLayout + Trang chủ, ...).
 */
function LandingOrApp() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Landing />;
  }

  return <Outlet />;
}

export default LandingOrApp;
