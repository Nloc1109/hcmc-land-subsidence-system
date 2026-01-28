import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import AnimatedBackground from './components/AnimatedBackground';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/Home';
import Dashboard from './pages/dashboard/Dashboard';
import LoginPage from './pages/auth/Login';
import RegisterPage from './pages/auth/Register';
import ReportsPage from './pages/reports/Reports';
import NewsPage from './pages/news/News';
import DiagnosisPage from './pages/diagnosis/Diagnosis';
import AiPredictionPage from './pages/ai/AiPrediction';
import './styles/App.css';

function App() {
  return (
    <Router>
      <AnimatedBackground />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected routes với layout (giả định đã đăng nhập để xử lý giao diện) */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="diagnosis" element={<DiagnosisPage />} />
          <Route path="ai-prediction" element={<AiPredictionPage />} />
        </Route>
        
        {/* Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
