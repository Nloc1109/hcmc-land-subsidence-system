import { create } from 'zustand';

// Khôi phục trạng thái đăng nhập từ localStorage khi load trang
const getInitialAuth = () => {
  try {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');
    if (token && userStr) {
      const user = JSON.parse(userStr);
      return { isAuthenticated: true, user };
    }
  } catch (_) {}
  return { isAuthenticated: false, user: null };
};

const initial = getInitialAuth();

export const useAuthStore = create((set) => ({
  isAuthenticated: initial.isAuthenticated,
  user: initial.user,
  login: (user) => set({ isAuthenticated: true, user }),
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    set({ isAuthenticated: false, user: null });
  },
}));

