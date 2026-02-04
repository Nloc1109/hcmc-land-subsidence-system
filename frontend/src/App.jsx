import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AnimatedBackground from './components/AnimatedBackground';
import LandingOrApp from './routes/LandingOrApp';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleBasedRoute from './routes/RoleBasedRoute';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/Home';
import LoginPage from './pages/auth/Login';
import RegisterPage from './pages/auth/Register';
import ReportsPage from './pages/reports/Reports';
import NewsPage from './pages/news/News';
import DiagnosisPage from './pages/diagnosis/Diagnosis';
import AiPredictionPage from './pages/ai/AiPrediction';
import UserManagementPage from './pages/admin/UserManagement';
import LoginLogsPage from './pages/admin/LoginLogs';
import DeepAnalysisPage from './pages/analysis/DeepAnalysis';
import './styles/App.css';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AnimatedBackground />
      <Routes>
        {/* Public: trang giới thiệu + nút Đăng nhập */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* "/": chưa đăng nhập → Landing (tên dự án, thông tin, nút Đăng nhập); đã đăng nhập → ProtectedRoute → MainLayout + Trang chủ, ... */}
        <Route path="/" element={<LandingOrApp />}>
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              {/* Tất cả role đều có thể truy cập Trang chủ */}
              <Route index element={<HomePage />} />
              
              {/* Viewer: Chỉ Trang chủ và Tin tức */}
              <Route element={<RoleBasedRoute allowedRoles={['Viewer', 'Admin', 'Manager', 'Analyst', 'Operator']} />}>
                <Route path="news" element={<NewsPage />} />
              </Route>
              
              {/* Analyst: Trang chủ, Báo cáo, Phân tích chuyên sâu */}
              <Route element={<RoleBasedRoute allowedRoles={['Analyst', 'Admin', 'Manager']} />}>
                <Route path="reports" element={<ReportsPage />} />
              </Route>
              
              <Route element={<RoleBasedRoute allowedRoles={['Analyst', 'Admin']} />}>
                <Route path="analysis" element={<DeepAnalysisPage />} />
              </Route>
              
              {/* Operator: Trang chủ, Chẩn đoán, AI Dự đoán */}
              <Route element={<RoleBasedRoute allowedRoles={['Operator', 'Admin', 'Manager']} />}>
                <Route path="diagnosis" element={<DiagnosisPage />} />
              </Route>
              
              <Route element={<RoleBasedRoute allowedRoles={['Operator', 'Admin', 'Manager']} />}>
                <Route path="ai-prediction" element={<AiPredictionPage />} />
              </Route>
              
              {/* Admin: Tất cả chức năng */}
              <Route element={<RoleBasedRoute allowedRoles={['Admin']} />}>
                <Route path="admin/users" element={<UserManagementPage />} />
                <Route path="admin/login-logs" element={<LoginLogsPage />} />
              </Route>
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
