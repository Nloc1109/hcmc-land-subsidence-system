import { App } from 'antd';

/**
 * Custom hook để sử dụng message từ Ant Design App context
 * Thay vì dùng message.success() trực tiếp, dùng hook này để tránh warning
 */
export const useMessage = () => {
  const { message } = App.useApp();
  return message;
};

