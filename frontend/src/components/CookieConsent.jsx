import { useState, useEffect } from 'react';
import { Button, Modal, Typography } from 'antd';
import { useAuthStore } from '../store/auth/useAuthStore';
import './CookieConsent.css';

const COOKIE_NAME = 'cookie_consent';
const COOKIE_MAX_AGE_DAYS = 30;

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

function setCookie(name, value, maxAgeDays) {
  const maxAge = maxAgeDays * 24 * 60 * 60;
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function CookieConsent() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [visible, setVisible] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setVisible(false);
      return;
    }
    const value = getCookie(COOKIE_NAME);
    if (!value) {
      setVisible(true);
    }
  }, [isAuthenticated]);

  const handleAccept = () => {
    setCookie(COOKIE_NAME, 'accepted', COOKIE_MAX_AGE_DAYS);
    setVisible(false);
    setPolicyOpen(false);
  };

  const handleReject = () => {
    setCookie(COOKIE_NAME, 'rejected', COOKIE_MAX_AGE_DAYS);
    setVisible(false);
    setPolicyOpen(false);
  };

  if (!visible) return null;

  return (
    <>
      <div className="cookie-consent-bar">
        <div className="cookie-consent-inner">
          <p className="cookie-consent-text">
            Chúng tôi sử dụng cookie để cải thiện trải nghiệm, phân tích lưu lượng và cá nhân hóa nội dung.
            Bằng việc tiếp tục sử dụng trang web, bạn có thể đồng ý với việc sử dụng cookie của chúng tôi.
          </p>
          <div className="cookie-consent-buttons">
            <Button type="link" onClick={() => setPolicyOpen(true)} className="cookie-btn-link">
              Tìm hiểu thêm
            </Button>
            <Button onClick={handleReject} className="cookie-btn-reject">
              Từ chối
            </Button>
            <Button type="primary" onClick={handleAccept} className="cookie-btn-accept">
              Chấp nhận
            </Button>
          </div>
        </div>
      </div>

      <Modal
        title="Chính sách Cookie"
        open={policyOpen}
        onCancel={() => setPolicyOpen(false)}
        footer={[
          <Button key="close" onClick={() => setPolicyOpen(false)}>
            Đóng
          </Button>,
          <Button key="reject" onClick={handleReject}>
            Từ chối
          </Button>,
          <Button key="accept" type="primary" onClick={handleAccept}>
            Chấp nhận
          </Button>,
        ]}
        width={560}
      >
        <Typography.Paragraph>
          <strong>Cookie là gì?</strong> Cookie là các tệp văn bản nhỏ được lưu trên thiết bị của bạn khi bạn truy cập trang web. Chúng giúp trang web ghi nhớ lựa chọn và hoạt động ổn định hơn.
        </Typography.Paragraph>
        <Typography.Paragraph>
          <strong>Chúng tôi sử dụng cookie để:</strong> Cải thiện trải nghiệm sử dụng, phân tích lưu lượng truy cập (ẩn danh), ghi nhớ đăng nhập và thiết lập của bạn. Chúng tôi không chia sẻ dữ liệu cookie với bên thứ ba cho mục đích quảng cáo.
        </Typography.Paragraph>
        <Typography.Paragraph>
          <strong>Quyền của bạn:</strong> Bạn có thể chấp nhận hoặc từ chối cookie. Bạn cũng có thể thay đổi cài đặt cookie bất kỳ lúc nào trong trình duyệt. Việc từ chối một số cookie có thể ảnh hưởng đến chức năng của trang web.
        </Typography.Paragraph>
      </Modal>
    </>
  );
}

export default CookieConsent;
