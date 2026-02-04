import { useState, useEffect } from 'react';
import { Button, Modal, Form, Select, Input, message } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import notificationsApi from '../api/notifications';
import './SendReportButton.css';

/**
 * Chuyển reportData (string hoặc object) thành chuỗi để gửi lên server / in vào PDF.
 * Object → dạng key: value hoặc mảng dòng văn bản dễ đọc.
 */
function serializeReportData(reportData) {
  if (reportData == null) return '';
  if (typeof reportData === 'string') return reportData.trim();
  if (Array.isArray(reportData)) return reportData.map((line) => String(line)).join('\n');
  if (typeof reportData === 'object') {
    return Object.entries(reportData)
      .map(([k, v]) => `${k}: ${v == null ? '—' : (typeof v === 'object' ? JSON.stringify(v) : String(v))}`)
      .join('\n');
  }
  return String(reportData);
}

/**
 * Nút "Báo cáo" – báo cáo kịp thời tới vai trò/người nhận.
 * Luồng: Chọn vai trò → Chọn người nhận (hoặc gửi cả vai trò) → Tiêu đề tự sinh, chỉ điền nội dung chi tiết.
 * @param {string} sourcePageName - Tên trang (hiển thị trong tiêu đề tự sinh), ví dụ: "Trang chủ", "Báo cáo", "Chẩn đoán"
 * @param {string} [type='default'] - 'primary' | 'default'
 * @param {boolean} [showLabel=true] - Hiển thị chữ "Báo cáo" cạnh icon
 * @param {string|object|string[]} [reportData] - Số liệu / thông tin cần báo cáo (hiển thị trong PDF/Excel mục "Số liệu cần báo cáo")
 */
const SendReportButton = ({ sourcePageName = 'Hệ thống', type = 'default', showLabel = true, reportData }) => {
  const [open, setOpen] = useState(false);
  const [recipients, setRecipients] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [sending, setSending] = useState(false);
  const [form] = Form.useForm();

  const recipientByRole = recipients.reduce((acc, r) => {
    const role = r.RoleName || r.roleName || 'Khác';
    if (!acc[role]) acc[role] = [];
    acc[role].push(r);
    return acc;
  }, {});
  const roleOptions = Object.keys(recipientByRole).sort().map((role) => ({ value: role, label: role }));

  const generateTitle = () => {
    return `Báo cáo từ ${sourcePageName} - ${dayjs().format('DD/MM/YYYY HH:mm')}`;
  };

  const openModal = async () => {
    setOpen(true);
    form.resetFields();
    form.setFieldsValue({ title: generateTitle() });
    setLoadingRecipients(true);
    try {
      const data = await notificationsApi.getRecipients();
      setRecipients(data.recipients || []);
    } catch (err) {
      message.error('Không tải được danh sách người nhận');
      setRecipients([]);
    } finally {
      setLoadingRecipients(false);
    }
  };

  const onRoleChange = () => {
    form.setFieldsValue({ toUserId: undefined, toRoleName: undefined });
  };

  useEffect(() => {
    if (open) {
      form.setFieldsValue({ title: generateTitle() });
    }
  }, [open]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSending(true);
      const title = values.title || generateTitle();
      const payload = {
        title,
        message: values.message?.trim() || '',
        notificationType: 'Report',
      };
      const dataStr = serializeReportData(reportData);
      if (dataStr) payload.reportData = dataStr;
      if (values.attachmentFormat === 'pdf' || values.attachmentFormat === 'excel') {
        payload.attachmentFormat = values.attachmentFormat;
      }
      if (values.sendToType === 'role') {
        payload.toRoleName = values.toRoleName;
      } else {
        payload.toUserId = values.toUserId;
      }
      await notificationsApi.send(payload);
      message.success('Đã gửi báo cáo');
      setOpen(false);
      form.resetFields();
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.response?.data?.message || 'Gửi báo cáo thất bại');
    } finally {
      setSending(false);
    }
  };

  const selectedRole = Form.useWatch('toRoleName', form);
  const sendToType = Form.useWatch('sendToType', form) || 'user';
  const usersInRole = selectedRole ? (recipientByRole[selectedRole] || []) : [];

  return (
    <>
      <Button
        type={type}
        icon={<FileTextOutlined />}
        onClick={openModal}
        className="send-report-btn"
      >
        {showLabel ? 'Báo cáo' : null}
      </Button>
      <Modal
        title="Báo cáo kịp thời"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleSubmit}
        confirmLoading={sending}
        okText="Gửi báo cáo"
        width={520}
        destroyOnClose
        className="send-report-modal"
      >
        <p className="send-report-desc">
          Chọn vai trò và người nhận, nội dung tiêu đề được tạo tự động. Bạn chỉ cần điền <strong>nội dung chi tiết</strong> bên dưới.
        </p>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            sendToType: 'user',
            attachmentFormat: 'pdf',
            title: generateTitle(),
          }}
        >
          <Form.Item name="sendToType" label="Gửi tới">
            <Select
              options={[
                { value: 'user', label: 'Một người cụ thể' },
                { value: 'role', label: 'Tất cả người thuộc vai trò' },
              ]}
              onChange={onRoleChange}
            />
          </Form.Item>

          <Form.Item
            name="toRoleName"
            label="Vai trò nhận"
            rules={[{ required: true, message: 'Chọn vai trò' }]}
          >
            <Select
              placeholder="Chọn vai trò"
              options={roleOptions}
              loading={loadingRecipients}
              onChange={() => form.setFieldsValue({ toUserId: undefined })}
            />
          </Form.Item>

          {sendToType === 'user' && (
            <Form.Item
              name="toUserId"
              label="Người nhận"
              rules={[{ required: true, message: 'Chọn người nhận' }]}
            >
              <Select
                placeholder="Chọn người nhận"
                showSearch
                optionFilterProp="label"
                options={usersInRole.map((r) => ({
                  value: r.UserId,
                  label: `${r.FullName || r.Username} (${r.RoleName})`,
                }))}
              />
            </Form.Item>
          )}

          <Form.Item
            name="attachmentFormat"
            label="Đính kèm file"
            tooltip="File được tạo tự động (thông tin người gửi, người nhận, số liệu báo cáo và nội dung). PDF xem trực tiếp trên trình duyệt, Excel tải về."
          >
            <Select
              options={[
                { value: 'none', label: 'Không đính kèm' },
                { value: 'pdf', label: 'PDF (xem trực tiếp trên trình duyệt)' },
                { value: 'excel', label: 'Excel (tải file)' },
              ]}
            />
          </Form.Item>

          <Form.Item name="title" label="Tiêu đề (tự động)">
            <Input disabled className="send-report-title-readonly" />
          </Form.Item>

          <Form.Item
            name="message"
            label="Nội dung chi tiết"
            rules={[{ required: true, message: 'Vui lòng nhập nội dung chi tiết' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Nhập nội dung báo cáo chi tiết (bắt buộc)..."
              maxLength={1000}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default SendReportButton;
