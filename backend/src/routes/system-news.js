import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { getPool } from '../db/mssql.js';
import { authenticate } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '../../generated/system-news');
try {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
} catch (_) {}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safe = (file.originalname || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
}).array('attachments', 10);

/** Cho phép Operator và Admin tạo/sửa/xóa tin hệ thống */
const canManageSystemNews = (req) => {
  const role = req.user?.role;
  return role === 'Operator' || role === 'Admin';
};

/** Lấy danh sách attachments của tin (bảng có thể chưa tồn tại) */
async function getAttachmentsForNews(pool, systemNewsId) {
  try {
    const r = await pool
      .request()
      .input('SystemNewsId', systemNewsId)
      .query(`
        SELECT AttachmentId, FilePath, FileName, MimeType, SortOrder
        FROM SystemNewsAttachments
        WHERE SystemNewsId = @SystemNewsId
        ORDER BY SortOrder, AttachmentId
      `);
    return (r.recordset || []).map((row) => ({
      attachmentId: row.AttachmentId,
      fileName: row.FileName,
      mimeType: row.MimeType,
    }));
  } catch (err) {
    const msg = String(err?.message || '');
    if (/Invalid object name|SystemNewsAttachments/i.test(msg)) return [];
    throw err;
  }
}

/**
 * GET /api/v1/system-news
 * Danh sách tin hệ thống (mới nhất trước). Query: page, limit.
 * Mọi user đã đăng nhập đều xem được.
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const pool = await getPool();
    const countResult = await pool.request().query(`
      SELECT COUNT(*) AS total FROM SystemNews
    `);
    const total = countResult.recordset[0]?.total ?? 0;

    const listResult = await pool
      .request()
      .input('Offset', offset)
      .input('Limit', limit)
      .query(`
        SELECT
          sn.SystemNewsId,
          sn.Title,
          sn.Content,
          sn.AuthorId,
          sn.CreatedAt,
          sn.UpdatedAt,
          u.Username AS AuthorUsername,
          u.FullName AS AuthorFullName
        FROM SystemNews sn
        INNER JOIN Users u ON sn.AuthorId = u.UserId
        ORDER BY sn.CreatedAt DESC
        OFFSET @Offset ROWS
        FETCH NEXT @Limit ROWS ONLY
      `);

    const items = listResult.recordset.map((r) => ({
      systemNewsId: r.SystemNewsId,
      title: r.Title,
      content: r.Content,
      authorId: r.AuthorId,
      createdAt: r.CreatedAt,
      updatedAt: r.UpdatedAt,
      authorUsername: r.AuthorUsername,
      authorFullName: r.AuthorFullName,
    }));

    res.json({ items, total, page, limit });
  } catch (err) {
    console.error('GET /system-news error:', err);
    res.status(500).json({ message: 'Lỗi khi tải tin hệ thống' });
  }
});

/**
 * GET /api/v1/system-news/:id/attachments/:attachmentId
 * Tải file đính kèm của tin hệ thống. (Định nghĩa trước GET /:id để match đúng.)
 */
router.get('/:id/attachments/:attachmentId', authenticate, async (req, res) => {
  const newsId = parseInt(req.params.id, 10);
  const attachmentId = parseInt(req.params.attachmentId, 10);
  if (Number.isNaN(newsId) || Number.isNaN(attachmentId)) {
    return res.status(400).json({ message: 'Id không hợp lệ' });
  }
  try {
    const pool = await getPool();
    const row = await pool
      .request()
      .input('NewsId', newsId)
      .input('AttachmentId', attachmentId)
      .query(`
        SELECT FilePath, FileName, MimeType
        FROM SystemNewsAttachments
        WHERE SystemNewsId = @NewsId AND AttachmentId = @AttachmentId
      `);
    if (!row?.recordset?.length) {
      return res.status(404).json({ message: 'Không tìm thấy file đính kèm' });
    }
    const { FilePath, FileName, MimeType } = row.recordset[0];
    if (!FilePath || !fs.existsSync(FilePath)) {
      return res.status(404).json({ message: 'File không tồn tại' });
    }
    res.setHeader('Content-Type', MimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${FileName || 'attachment'}"`);
    fs.createReadStream(FilePath).pipe(res);
  } catch (err) {
    const msg = String(err?.message || '');
    if (/Invalid object name|SystemNewsAttachments/i.test(msg)) {
      return res.status(404).json({ message: 'Chưa hỗ trợ file đính kèm' });
    }
    console.error('GET /system-news/:id/attachments/:attachmentId error:', err);
    res.status(500).json({ message: 'Lỗi khi tải file' });
  }
});

/**
 * GET /api/v1/system-news/:id
 * Chi tiết một tin hệ thống: nội dung văn bản + danh sách file đính kèm.
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Id không hợp lệ' });
    }

    const pool = await getPool();
    const result = await pool
      .request()
      .input('Id', id)
      .query(`
        SELECT
          sn.SystemNewsId,
          sn.Title,
          sn.Content,
          sn.AuthorId,
          sn.CreatedAt,
          sn.UpdatedAt,
          u.Username AS AuthorUsername,
          u.FullName AS AuthorFullName
        FROM SystemNews sn
        INNER JOIN Users u ON sn.AuthorId = u.UserId
        WHERE sn.SystemNewsId = @Id
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ message: 'Không tìm thấy tin hệ thống' });
    }

    const r = result.recordset[0];
    const attachments = await getAttachmentsForNews(pool, id);
    res.json({
      systemNewsId: r.SystemNewsId,
      title: r.Title,
      content: r.Content,
      authorId: r.AuthorId,
      createdAt: r.CreatedAt,
      updatedAt: r.UpdatedAt,
      authorUsername: r.AuthorUsername,
      authorFullName: r.AuthorFullName,
      attachments,
    });
  } catch (err) {
    console.error('GET /system-news/:id error:', err);
    res.status(500).json({ message: 'Lỗi khi tải tin hệ thống' });
  }
});

/**
 * POST /api/v1/system-news
 * Tạo tin hệ thống mới. Multipart: title, content (văn bản), attachments (nhiều file).
 * Chỉ Operator và Admin.
 */
router.post('/', authenticate, (req, res, next) => {
  if (!canManageSystemNews(req)) {
    return res.status(403).json({ message: 'Chỉ Operator hoặc Admin mới được đăng tin hệ thống' });
  }
  upload(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File đính kèm không được quá 20MB' });
      }
      return res.status(400).json({ message: err?.message || 'Lỗi tải file' });
    }
    next();
  });
}, async (req, res) => {
  try {
    const title = (req.body && req.body.title) ? String(req.body.title).trim() : '';
    const content = req.body && req.body.content != null ? String(req.body.content) : '';
    if (!title) {
      return res.status(400).json({ message: 'Tiêu đề không được để trống' });
    }

    const pool = await getPool();
    const result = await pool
      .request()
      .input('Title', title)
      .input('Content', content)
      .input('AuthorId', req.user.userId)
      .query(`
        INSERT INTO SystemNews (Title, Content, AuthorId)
        OUTPUT INSERTED.SystemNewsId, INSERTED.Title, INSERTED.Content, INSERTED.AuthorId, INSERTED.CreatedAt, INSERTED.UpdatedAt
        VALUES (@Title, @Content, @AuthorId)
      `);

    const row = result.recordset[0];
    const systemNewsId = row.SystemNewsId;

    const files = req.files || [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      try {
        await pool
          .request()
          .input('SystemNewsId', systemNewsId)
          .input('FilePath', f.path)
          .input('FileName', f.originalname || path.basename(f.path))
          .input('MimeType', f.mimetype || null)
          .input('SortOrder', i)
          .query(`
            INSERT INTO SystemNewsAttachments (SystemNewsId, FilePath, FileName, MimeType, SortOrder)
            VALUES (@SystemNewsId, @FilePath, @FileName, @MimeType, @SortOrder)
          `);
      } catch (insErr) {
        if (/Invalid object name|SystemNewsAttachments/i.test(String(insErr?.message || ''))) {
          try { fs.unlinkSync(f.path); } catch (_) {}
          break;
        }
        try { fs.unlinkSync(f.path); } catch (_) {}
        throw insErr;
      }
    }

    const attachments = await getAttachmentsForNews(pool, systemNewsId);
    res.status(201).json({
      systemNewsId: row.SystemNewsId,
      title: row.Title,
      content: row.Content,
      authorId: row.AuthorId,
      createdAt: row.CreatedAt,
      updatedAt: row.UpdatedAt,
      attachments,
    });
  } catch (err) {
    console.error('POST /system-news error:', err);
    res.status(500).json({ message: 'Lỗi khi tạo tin hệ thống' });
  }
});

/**
 * PUT /api/v1/system-news/:id
 * Cập nhật tin hệ thống. Multipart: title?, content? (văn bản), attachments? (thêm file mới).
 * Chỉ Operator và Admin.
 */
router.put('/:id', authenticate, (req, res, next) => {
  if (!canManageSystemNews(req)) {
    return res.status(403).json({ message: 'Chỉ Operator hoặc Admin mới được chỉnh sửa tin hệ thống' });
  }
  upload(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File đính kèm không được quá 20MB' });
      }
      return res.status(400).json({ message: err?.message || 'Lỗi tải file' });
    }
    next();
  });
}, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Id không hợp lệ' });
    }

    const pool = await getPool();
    const existing = await pool.request().input('Id', id).query(`
      SELECT SystemNewsId FROM SystemNews WHERE SystemNewsId = @Id
    `);
    if (!existing.recordset.length) {
      return res.status(404).json({ message: 'Không tìm thấy tin hệ thống' });
    }

    const title = req.body && req.body.title != null ? String(req.body.title).trim() : undefined;
    const content = req.body && req.body.content != null ? String(req.body.content) : undefined;

    if (title !== undefined && !title) {
      return res.status(400).json({ message: 'Tiêu đề không được để trống' });
    }

    const updates = [];
    const request = pool.request();
    request.input('Id', id);
    if (title !== undefined) {
      updates.push('Title = @Title');
      request.input('Title', title);
    }
    if (content !== undefined) {
      updates.push('Content = @Content');
      request.input('Content', content);
    }
    if (updates.length > 0) {
      updates.push('UpdatedAt = GETDATE()');
      await request.query(`
        UPDATE SystemNews SET ${updates.join(', ')} WHERE SystemNewsId = @Id
      `);
    }

    const files = req.files || [];
    const maxOrder = await pool.request().input('SystemNewsId', id).query(`
      SELECT ISNULL(MAX(SortOrder), -1) AS MaxOrder FROM SystemNewsAttachments WHERE SystemNewsId = @SystemNewsId
    `).catch(() => ({ recordset: [{ MaxOrder: -1 }] }));
    let nextOrder = (maxOrder.recordset && maxOrder.recordset[0]?.MaxOrder != null) ? maxOrder.recordset[0].MaxOrder + 1 : 0;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      try {
        await pool
          .request()
          .input('SystemNewsId', id)
          .input('FilePath', f.path)
          .input('FileName', f.originalname || path.basename(f.path))
          .input('MimeType', f.mimetype || null)
          .input('SortOrder', nextOrder + i)
          .query(`
            INSERT INTO SystemNewsAttachments (SystemNewsId, FilePath, FileName, MimeType, SortOrder)
            VALUES (@SystemNewsId, @FilePath, @FileName, @MimeType, @SortOrder)
          `);
      } catch (insErr) {
        if (/Invalid object name|SystemNewsAttachments/i.test(String(insErr?.message || ''))) {
          try { fs.unlinkSync(f.path); } catch (_) {}
          break;
        }
        try { fs.unlinkSync(f.path); } catch (_) {}
      }
    }

    const r = await pool.request().input('Id', id).query(`
      SELECT SystemNewsId, Title, Content, AuthorId, CreatedAt, UpdatedAt
      FROM SystemNews WHERE SystemNewsId = @Id
    `);
    const row = r.recordset[0];
    const attachments = await getAttachmentsForNews(pool, id);
    res.json({
      systemNewsId: row.SystemNewsId,
      title: row.Title,
      content: row.Content,
      authorId: row.AuthorId,
      createdAt: row.CreatedAt,
      updatedAt: row.UpdatedAt,
      attachments,
    });
  } catch (err) {
    console.error('PUT /system-news/:id error:', err);
    res.status(500).json({ message: 'Lỗi khi cập nhật tin hệ thống' });
  }
});

/**
 * DELETE /api/v1/system-news/:id/attachments/:attachmentId
 * Xóa một file đính kèm (chỉ Operator/Admin).
 */
router.delete('/:id/attachments/:attachmentId', authenticate, async (req, res) => {
  if (!canManageSystemNews(req)) {
    return res.status(403).json({ message: 'Không có quyền xóa file đính kèm' });
  }
  const newsId = parseInt(req.params.id, 10);
  const attachmentId = parseInt(req.params.attachmentId, 10);
  if (Number.isNaN(newsId) || Number.isNaN(attachmentId)) {
    return res.status(400).json({ message: 'Id không hợp lệ' });
  }
  try {
    const pool = await getPool();
    const row = await pool
      .request()
      .input('NewsId', newsId)
      .input('AttachmentId', attachmentId)
      .query(`
        SELECT FilePath FROM SystemNewsAttachments
        WHERE SystemNewsId = @NewsId AND AttachmentId = @AttachmentId
      `);
    if (!row?.recordset?.length) {
      return res.status(404).json({ message: 'Không tìm thấy file đính kèm' });
    }
    const filePath = row.recordset[0].FilePath;
    await pool
      .request()
      .input('NewsId', newsId)
      .input('AttachmentId', attachmentId)
      .query(`
        DELETE FROM SystemNewsAttachments
        WHERE SystemNewsId = @NewsId AND AttachmentId = @AttachmentId
      `);
    try {
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (_) {}
    res.json({ message: 'Đã xóa file đính kèm' });
  } catch (err) {
    if (/Invalid object name|SystemNewsAttachments/i.test(String(err?.message || ''))) {
      return res.status(404).json({ message: 'Chưa hỗ trợ file đính kèm' });
    }
    console.error('DELETE attachment error:', err);
    res.status(500).json({ message: 'Lỗi khi xóa file' });
  }
});

/**
 * DELETE /api/v1/system-news/:id
 * Xóa tin hệ thống (và toàn bộ file đính kèm do CASCADE hoặc xóa thủ công).
 * Chỉ Operator và Admin.
 */
router.delete('/:id', authenticate, async (req, res) => {
  if (!canManageSystemNews(req)) {
    return res.status(403).json({ message: 'Chỉ Operator hoặc Admin mới được xóa tin hệ thống' });
  }

  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Id không hợp lệ' });
    }

    const pool = await getPool();
    try {
      const attRows = await pool.request().input('SystemNewsId', id).query(`
        SELECT FilePath FROM SystemNewsAttachments WHERE SystemNewsId = @SystemNewsId
      `);
      (attRows.recordset || []).forEach((r) => {
        try {
          if (r.FilePath && fs.existsSync(r.FilePath)) fs.unlinkSync(r.FilePath);
        } catch (_) {}
      });
    } catch (_) {}
    const result = await pool.request().input('Id', id).query(`
      DELETE FROM SystemNews WHERE SystemNewsId = @Id
    `);
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Không tìm thấy tin hệ thống' });
    }
    res.status(200).json({ message: 'Đã xóa tin hệ thống' });
  } catch (err) {
    console.error('DELETE /system-news/:id error:', err);
    res.status(500).json({ message: 'Lỗi khi xóa tin hệ thống' });
  }
});

export default router;
