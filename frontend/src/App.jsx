import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import AnimatedBackground from './components/AnimatedBackground';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/Home';
import LoginPage from './pages/auth/Login';
import RegisterPage from './pages/auth/Register';
import './styles/App.css';

function App() {
  return (
    <Router>
      <AnimatedBackground />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected routes với layout */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          {/* Các routes khác sẽ thêm sau */}
        </Route>
        
        {/* Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
