import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, theme, App as AntApp } from 'antd';
import viVN from 'antd/locale/vi_VN';
import App from './App';
import './styles/index.css';

// Theme sáng "đất/cát" + xanh nước cho hệ thống quản lý sụt lún đất
const lightTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    // Brand / CTA
    colorPrimary: '#2563eb',

    // Surfaces (không trắng gắt)
    colorBgBase: '#f5ede8',
    colorBgContainer: '#f7f0ea',
    colorBgElevated: '#f7f0ea',

    // Text
    colorText: '#0f172a',
    colorTextSecondary: '#475569',

    // Borders
    colorBorder: '#d4c4b8',

    // Shape / typography
    borderRadius: 12,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider theme={lightTheme} locale={viVN}>
      <AntApp>
        <App />
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>
);
