import express from 'express';
import path from 'path';
import fs from 'fs';
import { getPool } from '../db/mssql.js';
import { authenticate } from '../middleware/auth.js';
import { generateReportPdf, generateReportExcel } from '../services/reportAttachment.js';

const router = express.Router();
router.use(authenticate);

/**
 * GET /api/v1/notifications
 * Danh sách thông báo của user đăng nhập (người nhận), có thông tin người gửi.
 * Fallback: nếu chưa chạy migration SenderId thì trả về danh sách không có sender.
 */
router.get('/', async (req, res) => {
  const safeList = () => {
    if (!res.headersSent) {
      res.status(200).json({
        items: [],
        total: 0,
        page: parseInt(req.query?.page) || 1,
        limit: parseInt(req.query?.limit) || 20,
      });
    }
  };
  try {
    const userId = req.user?.userId;
    if (userId == null) {
      return safeList();
    }
    const { page = 1, limit = 20, unreadOnly } = req.query;
    let pool;
    try {
      pool = await getPool();
    } catch (poolErr) {
      console.error('GET /notifications getPool failed:', poolErr?.message || poolErr);
      return safeList();
    }
    const offset = (Math.max(1, parseInt(page)) - 1) * Math.min(50, parseInt(limit) || 20);
    const limitVal = Math.min(50, parseInt(limit) || 20);
    let whereClause = 'n.UserId = @UserId';
    if (unreadOnly === 'true') {
      whereClause += ' AND n.IsRead = 0';
    }

    let result;
    const listQueryWithAttachment = `
      SELECT
        n.NotificationId,
        n.Title,
        n.Message,
        n.NotificationType,
        n.IsRead,
        n.ReadAt,
        n.CreatedAt,
        n.SenderId,
        n.AttachmentPath,
        n.AttachmentFileName,
        n.AttachmentMimeType,
        sender.Username AS SenderUsername,
        sender.FullName AS SenderFullName,
        r.RoleName AS SenderRole
      FROM Notifications n
      LEFT JOIN Users sender ON n.SenderId = sender.UserId
      LEFT JOIN Roles r ON sender.RoleId = r.RoleId
      WHERE ${whereClause}
      ORDER BY n.CreatedAt DESC
      OFFSET @Offset ROWS
      FETCH NEXT @Limit ROWS ONLY
    `;
    const listQueryWithoutAttachment = `
      SELECT
        n.NotificationId,
        n.Title,
        n.Message,
        n.NotificationType,
        n.IsRead,
        n.ReadAt,
        n.CreatedAt,
        n.SenderId,
        NULL AS AttachmentPath,
        NULL AS AttachmentFileName,
        NULL AS AttachmentMimeType,
        sender.Username AS SenderUsername,
        sender.FullName AS SenderFullName,
        r.RoleName AS SenderRole
      FROM Notifications n
      LEFT JOIN Users sender ON n.SenderId = sender.UserId
      LEFT JOIN Roles r ON sender.RoleId = r.RoleId
      WHERE ${whereClause}
      ORDER BY n.CreatedAt DESC
      OFFSET @Offset ROWS
      FETCH NEXT @Limit ROWS ONLY
    `;
    const listQueryNoSender = `
      SELECT
        n.NotificationId,
        n.Title,
        n.Message,
        n.NotificationType,
        n.IsRead,
        n.ReadAt,
        n.CreatedAt,
        NULL AS SenderId,
        NULL AS AttachmentPath,
        NULL AS AttachmentFileName,
        NULL AS AttachmentMimeType,
        NULL AS SenderUsername,
        NULL AS SenderFullName,
        NULL AS SenderRole
      FROM Notifications n
      WHERE ${whereClause}
      ORDER BY n.CreatedAt DESC
      OFFSET @Offset ROWS
      FETCH NEXT @Limit ROWS ONLY
    `;
    try {
      const request = pool.request();
      request.input('UserId', userId);
      request.input('Offset', offset);
      request.input('Limit', limitVal);
      result = await request.query(listQueryWithAttachment);
    } catch (queryErr) {
      const msg = String((queryErr && queryErr.message) || '');
      const req2 = pool.request();
      req2.input('UserId', userId);
      req2.input('Offset', offset);
      req2.input('Limit', limitVal);
      const isColumnOrObjectError = /SenderId|AttachmentPath|AttachmentFileName|Invalid column|invalid column name|Invalid object name/i.test(msg);
      if (isColumnOrObjectError) {
        try {
          result = await req2.query(listQueryNoSender);
        } catch (e2) {
          const msg2 = String((e2 && e2.message) || '');
          if (/Invalid object name|Invalid column|invalid column name/i.test(msg2)) {
            result = { recordset: [] };
          } else throw e2;
        }
      } else {
        try {
          result = await req2.query(listQueryNoSender);
        } catch (eFallback) {
          const msgF = String((eFallback && eFallback.message) || '');
          if (/Invalid object name|Invalid column/i.test(msgF)) {
            result = { recordset: [] };
          } else throw queryErr;
        }
      }
    }

    let total = 0;
    try {
      const countReq = pool.request();
      countReq.input('UserId', userId);
      const countQuery =
        unreadOnly === 'true'
          ? 'SELECT COUNT(*) AS Total FROM Notifications n WHERE n.UserId = @UserId AND n.IsRead = 0'
          : 'SELECT COUNT(*) AS Total FROM Notifications n WHERE n.UserId = @UserId';
      const countResult = await countReq.query(countQuery);
      total = countResult.recordset[0].Total;
    } catch (countErr) {
      const msg = String((countErr && countErr.message) || '');
      if (/Invalid object name|Invalid column/i.test(msg)) total = 0;
      else throw countErr;
    }
    res.json({
      items: result.recordset || [],
      total,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
  } catch (err) {
    console.error('Error GET /notifications:', err);
    safeList();
  }
});

/**
 * GET /api/v1/notifications/unread-count
 * Số thông báo chưa đọc (cho badge trên nav).
 * Luôn trả 200 + { unreadCount } (0 khi lỗi) để UI không vỡ.
 */
router.get('/unread-count', async (req, res) => {
  const sendSafe = () => {
    try {
      if (!res.headersSent) res.status(200).json({ unreadCount: 0 });
    } catch (e) {
      console.error('sendSafe unread-count', e);
    }
  };
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('UserId', req.user?.userId)
      .query(`
        SELECT COUNT(*) AS UnreadCount
        FROM Notifications
        WHERE UserId = @UserId AND IsRead = 0
      `);
    if (!res.headersSent && result?.recordset?.[0]) {
      res.status(200).json({ unreadCount: result.recordset[0].UnreadCount });
    } else if (!res.headersSent) {
      sendSafe();
    }
  } catch (err) {
    console.error('Error GET /notifications/unread-count:', err);
    sendSafe();
  }
});

/**
 * POST /api/v1/notifications
 * Gửi thông báo tới một user (theo userId hoặc gửi tới cả role).
 * Body: { toUserId?, toRoleName?, title, message, notificationType?, attachmentFormat?: 'pdf'|'excel', reportData?: string }
 * Nếu attachmentFormat = 'pdf' hoặc 'excel' thì tạo file đính kèm (thông tin hai bên + nội dung).
 */
router.post('/', async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { toUserId, toRoleName, title, message, notificationType, attachmentFormat, reportData } = req.body || {};

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ message: 'Tiêu đề không được để trống' });
    }

    const pool = await getPool();
    let recipientUserIds = [];

    if (toUserId != null) {
      const one = await pool
        .request()
        .input('UserId', parseInt(toUserId))
        .query('SELECT UserId FROM Users WHERE UserId = @UserId AND IsActive = 1');
      if (one.recordset.length === 0) {
        return res.status(400).json({ message: 'Không tìm thấy người nhận' });
      }
      recipientUserIds = [one.recordset[0].UserId];
    } else if (toRoleName && typeof toRoleName === 'string') {
      const byRole = await pool
        .request()
        .input('RoleName', toRoleName.trim())
        .input('SenderId', senderId)
        .query(`
          SELECT u.UserId FROM Users u
          INNER JOIN Roles r ON u.RoleId = r.RoleId
          WHERE r.RoleName = @RoleName AND u.IsActive = 1 AND u.UserId <> @SenderId
        `);
      recipientUserIds = byRole.recordset.map((r) => r.UserId);
      if (recipientUserIds.length === 0) {
        return res.status(400).json({ message: 'Không có người nhận nào thuộc role này' });
      }
    } else {
      return res.status(400).json({ message: 'Cần chọn người nhận (toUserId) hoặc vai trò (toRoleName)' });
    }

    const type = ['Report', 'Task', 'Coordination', 'System', 'Alert', 'Maintenance'].includes(notificationType)
      ? notificationType
      : 'Report';
    const msg = message && typeof message === 'string' ? message.trim().slice(0, 1000) : null;
    const titleVal = title.trim().slice(0, 200);
    const withAttachment = attachmentFormat === 'pdf' || attachmentFormat === 'excel';

    // Lấy thông tin người gửi (FullName, RoleName)
    let senderName = 'Hệ thống';
    let senderRole = '';
    try {
      const senderRow = await pool
        .request()
        .input('SenderId', senderId)
        .query(`
          SELECT u.FullName, u.Username, r.RoleName
          FROM Users u
          LEFT JOIN Roles r ON u.RoleId = r.RoleId
          WHERE u.UserId = @SenderId
        `);
      if (senderRow.recordset.length > 0) {
        const s = senderRow.recordset[0];
        senderName = s.FullName || s.Username || senderName;
        senderRole = s.RoleName || '';
      }
    } catch (_) {}

    const insertWithSender = `
      INSERT INTO Notifications (UserId, SenderId, Title, Message, NotificationType, IsRead, CreatedAt)
      OUTPUT INSERTED.NotificationId
      VALUES (@UserId, @SenderId, @Title, @Message, @NotificationType, 0, GETDATE())
    `;
    const insertWithoutSender = `
      INSERT INTO Notifications (UserId, Title, Message, NotificationType, IsRead, CreatedAt)
      OUTPUT INSERTED.NotificationId
      VALUES (@UserId, @Title, @Message, @NotificationType, 0, GETDATE())
    `;
    let useSenderColumn = true;
    let useAttachmentColumn = true;
    const createdAt = new Date();

    for (const uid of recipientUserIds) {
      if (uid === senderId) continue;

      let notificationId;
      try {
        const insertReq = pool.request();
        insertReq.input('UserId', uid);
        insertReq.input('Title', titleVal);
        insertReq.input('Message', msg);
        insertReq.input('NotificationType', type);
        if (useSenderColumn) insertReq.input('SenderId', senderId);

        const insertResult = await insertReq.query(
          useSenderColumn ? insertWithSender : insertWithoutSender
        );
        if (!insertResult.recordset || insertResult.recordset.length === 0) continue;
        notificationId = insertResult.recordset[0].NotificationId;
      } catch (insertErr) {
        const errMsg = (insertErr && insertErr.message) || '';
        if (useSenderColumn && (errMsg.includes('SenderId') || errMsg.includes('Invalid column'))) {
          useSenderColumn = false;
          const insertReq = pool.request();
          insertReq.input('UserId', uid);
          insertReq.input('Title', titleVal);
          insertReq.input('Message', msg);
          insertReq.input('NotificationType', type);
          const insertResult = await insertReq.query(insertWithoutSender);
          if (!insertResult.recordset || insertResult.recordset.length === 0) continue;
          notificationId = insertResult.recordset[0].NotificationId;
        } else {
          throw insertErr;
        }
      }

      if (withAttachment && notificationId) {
        let recipientName = '';
        let recipientRole = '';
        try {
          const recRow = await pool
            .request()
            .input('UserId', uid)
            .query(`
              SELECT u.FullName, u.Username, r.RoleName
              FROM Users u
              LEFT JOIN Roles r ON u.RoleId = r.RoleId
              WHERE u.UserId = @UserId
            `);
          if (recRow.recordset.length > 0) {
            const r = recRow.recordset[0];
            recipientName = r.FullName || r.Username || '';
            recipientRole = r.RoleName || '';
          }
        } catch (_) {}

        try {
          const reportDataStr = reportData != null && typeof reportData === 'string'
            ? reportData.trim().slice(0, 8000)
            : (typeof reportData === 'object' ? JSON.stringify(reportData).slice(0, 8000) : '');
          const opts = {
            notificationId,
            senderName,
            senderRole,
            recipientName,
            recipientRole,
            title: titleVal,
            message: msg || '',
            reportData: reportDataStr,
            createdAt,
          };
          const filePath =
            attachmentFormat === 'excel'
              ? await generateReportExcel(opts)
              : await generateReportPdf(opts);
          const fileName = path.basename(filePath);
          const mimeType = attachmentFormat === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf';

          if (useAttachmentColumn) {
            try {
              await pool
                .request()
                .input('NotificationId', notificationId)
                .input('AttachmentPath', filePath)
                .input('AttachmentFileName', fileName)
                .input('AttachmentMimeType', mimeType)
                .query(`
                  UPDATE Notifications
                  SET AttachmentPath = @AttachmentPath, AttachmentFileName = @AttachmentFileName, AttachmentMimeType = @AttachmentMimeType
                  WHERE NotificationId = @NotificationId
                `);
            } catch (updateErr) {
              if ((updateErr.message || '').includes('AttachmentPath') || (updateErr.message || '').includes('Invalid column')) {
                useAttachmentColumn = false;
                console.warn('Notifications: Cột đính kèm (AttachmentPath/FileName/MimeType) chưa có. Chạy migration docs/database/migrations/002-add-notifications-attachment.sql để người nhận thấy file đính kèm.');
              } else throw updateErr;
            }
          }
        } catch (attachErr) {
          console.error('Error generating attachment for notification', notificationId, attachErr);
        }
      }
    }

    res.status(201).json({
      message: 'Đã gửi thông báo',
      recipientCount: recipientUserIds.filter((id) => id !== senderId).length,
    });
  } catch (err) {
    console.error('Error POST /notifications:', err);
    res.status(500).json({ message: 'Lỗi khi gửi thông báo' });
  }
});

/**
 * GET /api/v1/notifications/sent
 * Danh sách thư đã gửi (SenderId = user đăng nhập), có thông tin người nhận và đính kèm.
 */
router.get('/sent', async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;
    const pool = await getPool();
    const offset = (Math.max(1, parseInt(page)) - 1) * Math.min(50, parseInt(limit) || 20);
    const limitVal = Math.min(50, parseInt(limit) || 20);

    let result;
    let countResult;
    try {
      const request = pool.request();
      request.input('SenderId', senderId);
      request.input('Offset', offset);
      request.input('Limit', limitVal);
      result = await request.query(`
        SELECT
          n.NotificationId,
          n.UserId AS RecipientUserId,
          n.Title,
          n.Message,
          n.NotificationType,
          n.IsRead,
          n.CreatedAt,
          n.SenderId,
          n.AttachmentPath,
          n.AttachmentFileName,
          n.AttachmentMimeType,
          rec.FullName AS RecipientFullName,
          rec.Username AS RecipientUsername,
          r.RoleName AS RecipientRole
        FROM Notifications n
        INNER JOIN Users rec ON n.UserId = rec.UserId
        LEFT JOIN Roles r ON rec.RoleId = r.RoleId
        WHERE n.SenderId = @SenderId
        ORDER BY n.CreatedAt DESC
        OFFSET @Offset ROWS
        FETCH NEXT @Limit ROWS ONLY
      `);
      const countReq = pool.request();
      countReq.input('SenderId', senderId);
      countResult = await countReq.query(`
        SELECT COUNT(*) AS Total FROM Notifications n WHERE n.SenderId = @SenderId
      `);
    } catch (queryErr) {
      const msg = (queryErr && queryErr.message) || '';
      if (/SenderId|AttachmentPath|AttachmentFileName|Invalid column|Invalid object name/i.test(msg)) {
        return res.json({ items: [], total: 0, page: 1, limit: limitVal });
      }
      throw queryErr;
    }

    res.json({
      items: result.recordset || [],
      total: (countResult && countResult.recordset && countResult.recordset[0]) ? countResult.recordset[0].Total : 0,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
  } catch (err) {
    console.error('Error GET /notifications/sent:', err);
    if (!res.headersSent) {
      res.status(200).json({ items: [], total: 0, page: 1, limit: parseInt(req.query.limit) || 20 });
    }
  }
});

/**
 * GET /api/v1/notifications/recipients
 * Danh sách user có thể nhận thông báo (để chọn khi gửi), nhóm theo role.
 */
router.get('/recipients', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('ExcludeUserId', req.user.userId)
      .query(`
        SELECT u.UserId, u.Username, u.FullName, r.RoleName
        FROM Users u
        INNER JOIN Roles r ON u.RoleId = r.RoleId
        WHERE u.IsActive = 1 AND u.UserId <> @ExcludeUserId
        ORDER BY r.RoleId, u.Username
      `);
    res.json({ recipients: result.recordset });
  } catch (err) {
    console.error('Error GET /notifications/recipients:', err);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách người nhận' });
  }
});

/**
 * GET /api/v1/notifications/:id/attachment
 * Xem/tải file đính kèm (chỉ người nhận). Trả về file với Content-Disposition: inline để xem trên trình duyệt.
 * Nếu bảng chưa có cột đính kèm hoặc file không tồn tại → 404. Lỗi kết nối DB → 503 (để client retry).
 */
router.get('/:id/attachment', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: 'ID không hợp lệ' });
  }
  const send404 = (msg = 'Không tìm thấy thông báo hoặc file đính kèm') => {
    if (!res.headersSent) res.status(404).json({ message: msg });
  };
  const send503 = () => {
    if (!res.headersSent) res.status(503).json({ message: 'Tạm thời không tải được file. Vui lòng thử lại.' });
  };
  const runQuery = async (pool) =>
    pool
      .request()
      .input('NotificationId', id)
      .input('UserId', req.user?.userId)
      .query(`
        SELECT AttachmentPath, AttachmentFileName, AttachmentMimeType
        FROM Notifications
        WHERE NotificationId = @NotificationId AND (UserId = @UserId OR SenderId = @UserId)
      `);
  try {
    let pool;
    try {
      pool = await getPool();
    } catch (poolErr) {
      const msg = String(poolErr?.message || '');
      if (/ECONNREFUSED|ETIMEDOUT|ConnectionError|Failed to connect/i.test(msg)) {
        await new Promise((r) => setTimeout(r, 400));
        pool = await getPool();
      } else {
        throw poolErr;
      }
    }
    let row;
    try {
      row = await runQuery(pool);
    } catch (e) {
      const em = String((e && e.message) || '');
      if (/ECONNREFUSED|ETIMEDOUT|ConnectionError|Failed to connect/i.test(em)) {
        await new Promise((r) => setTimeout(r, 400));
        try {
          row = await runQuery(pool);
        } catch (retryErr) {
          console.error('Error GET /notifications/:id/attachment (after retry):', retryErr);
          return send503();
        }
      } else if (/SenderId|AttachmentPath|Invalid column|invalid column name|Invalid object name/i.test(em)) {
        try {
          row = await pool
            .request()
            .input('NotificationId', id)
            .input('UserId', req.user?.userId)
            .query(`
              SELECT 1 AS HasRow FROM Notifications
              WHERE NotificationId = @NotificationId AND UserId = @UserId
            `);
          if (row && row.recordset && row.recordset.length > 0) {
            return send404('Chưa hỗ trợ file đính kèm. Chạy migration 002-add-notifications-attachment.sql.');
          }
        } catch (_) {}
        return send404();
      } else {
        throw e;
      }
    }
    if (!row || !row.recordset || row.recordset.length === 0) {
      return send404();
    }
    const { AttachmentPath, AttachmentFileName, AttachmentMimeType } = row.recordset[0];
    if (!AttachmentPath || !fs.existsSync(AttachmentPath)) {
      return send404('File đính kèm không tồn tại');
    }
    const mime = AttachmentMimeType || 'application/octet-stream';
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `inline; filename="${AttachmentFileName || 'attachment'}"`);
    fs.createReadStream(AttachmentPath).pipe(res);
  } catch (err) {
    console.error('Error GET /notifications/:id/attachment:', err);
    const isDb = /ECONNREFUSED|ETIMEDOUT|ConnectionError|Failed to connect|Invalid object name/i.test(String(err?.message || ''));
    if (isDb && !res.headersSent) {
      return send503();
    }
    if (!res.headersSent) send404('Không tải được file');
  }
});

/**
 * DELETE /api/v1/notifications/:id
 * Xóa một thông báo: thư đến (UserId = me) hoặc thư đã gửi (SenderId = me, xóa bản ghi gửi tới một người nhận).
 */
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }
    const userId = req.user?.userId;
    if (userId == null) {
      return res.status(401).json({ message: 'Chưa đăng nhập' });
    }
    const pool = await getPool();
    const result = await pool
      .request()
      .input('NotificationId', id)
      .input('UserId', userId)
      .query(`
        DELETE FROM Notifications
        WHERE NotificationId = @NotificationId AND (UserId = @UserId OR SenderId = @UserId)
      `);
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo hoặc không có quyền xóa' });
    }
    res.json({ message: 'Đã xóa thông báo' });
  } catch (err) {
    console.error('Error DELETE /notifications/:id:', err);
    res.status(500).json({ message: 'Lỗi khi xóa thông báo' });
  }
});

/**
 * PATCH /api/v1/notifications/:id/read
 * Đánh dấu đã đọc.
 */
router.patch('/:id/read', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }
    const pool = await getPool();
    const result = await pool
      .request()
      .input('NotificationId', id)
      .input('UserId', req.user.userId)
      .query(`
        UPDATE Notifications
        SET IsRead = 1, ReadAt = GETDATE()
        WHERE NotificationId = @NotificationId AND UserId = @UserId
      `);
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo' });
    }
    res.json({ message: 'Đã đánh dấu đã đọc' });
  } catch (err) {
    console.error('Error PATCH /notifications/:id/read:', err);
    res.status(500).json({ message: 'Lỗi cập nhật' });
  }
});

export default router;
