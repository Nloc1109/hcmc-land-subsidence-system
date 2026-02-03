import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AnimatedBackground from './components/AnimatedBackground';
import LandingOrApp from './routes/LandingOrApp';
import ProtectedRoute from './routes/ProtectedRoute';
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
import './styles/App.css';

function App() {
  return (
    <Router>
      <AnimatedBackground />
      <Routes>
        {/* Public: trang giới thiệu + nút Đăng nhập */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* "/": chưa đăng nhập → Landing (tên dự án, thông tin, nút Đăng nhập); đã đăng nhập → ProtectedRoute → MainLayout + Trang chủ, ... */}
        <Route path="/" element={<LandingOrApp />}>
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route index element={<HomePage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="news" element={<NewsPage />} />
              <Route path="diagnosis" element={<DiagnosisPage />} />
              <Route path="ai-prediction" element={<AiPredictionPage />} />
              <Route path="admin/users" element={<UserManagementPage />} />
              <Route path="admin/login-logs" element={<LoginLogsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
