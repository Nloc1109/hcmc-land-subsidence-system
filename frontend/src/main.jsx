import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, theme } from 'antd';
import viVN from 'antd/locale/vi_VN';
import App from './App';
import './styles/index.css';

// Theme gradient tối với màu hiện đại
const darkTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#3b82f6',
    colorBgBase: '#0a0e27',
    colorText: '#ffffff',
    colorTextSecondary: '#d1d5db',
    colorBorder: '#1e293b',
    colorBgContainer: '#0f172a',
    colorBgElevated: '#1e293b',
    borderRadius: 8,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider theme={darkTheme} locale={viVN}>
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
