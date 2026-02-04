import express from 'express';
import { getPool } from '../db/mssql.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Helper: map request row thành object an toàn
function mapRequestRow(row) {
  return {
    requestId: row.RequestId,
    requestCode: row.RequestCode,
    title: row.Title,
    description: row.Description,
    priority: row.Priority,
    status: row.Status,
    assignedTo: row.AssignedTo,
    assignedToName: row.AssignedToName,
    assignedToRole: row.AssignedToRole,
    createdBy: row.CreatedBy,
    createdByName: row.CreatedByName,
    dueDate: row.DueDate,
    negotiatedDueDate: row.NegotiatedDueDate,
    completedAt: row.CompletedAt,
    rejectedAt: row.RejectedAt,
    rejectionReason: row.RejectionReason,
    negotiationMessage: row.NegotiationMessage,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
  };
}

// GET /api/v1/requests - Lấy danh sách yêu cầu
// Admin: xem tất cả yêu cầu
// Các role khác: chỉ xem yêu cầu được giao cho mình
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, priority, assignedTo } = req.query;
    const pool = await getPool();
    const request = pool.request();
    
    const user = req.user;
    const isAdmin = user.role === 'Admin';
    
    let whereClause = '1=1';
    
    // Nếu không phải Admin, chỉ xem yêu cầu được giao cho mình
    if (!isAdmin) {
      request.input('AssignedTo', user.userId);
      whereClause += ' AND r.AssignedTo = @AssignedTo';
    }
    
    // Filter theo status
    if (status) {
      request.input('Status', status);
      whereClause += ' AND r.Status = @Status';
    }
    
    // Filter theo priority
    if (priority) {
      request.input('Priority', priority);
      whereClause += ' AND r.Priority = @Priority';
    }
    
    // Admin có thể filter theo assignedTo
    if (isAdmin && assignedTo) {
      request.input('AssignedToFilter', parseInt(assignedTo));
      whereClause += ' AND r.AssignedTo = @AssignedToFilter';
    }
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    request.input('Offset', offset);
    request.input('Limit', parseInt(limit));
    
    // Kiểm tra bảng Requests có tồn tại không
    try {
      await pool.request().query('SELECT TOP 1 * FROM Requests');
    } catch (tableError) {
      if (tableError.message.includes('Invalid object name') || tableError.message.includes('does not exist')) {
        return res.status(500).json({ 
          message: 'Bảng Requests chưa được tạo. Vui lòng chạy: npm run create:requests-table',
          error: process.env.NODE_ENV === 'development' ? tableError.message : undefined
        });
      }
      throw tableError;
    }
    
    const result = await request.query(`
      SELECT 
        r.RequestId,
        r.RequestCode,
        r.Title,
        r.Description,
        r.Priority,
        r.Status,
        r.AssignedTo,
        ua.FullName AS AssignedToName,
        ra.RoleName AS AssignedToRole,
        r.CreatedBy,
        uc.FullName AS CreatedByName,
        r.DueDate,
        r.NegotiatedDueDate,
        r.CompletedAt,
        r.RejectedAt,
        r.RejectionReason,
        r.NegotiationMessage,
        r.CreatedAt,
        r.UpdatedAt
      FROM Requests r
      INNER JOIN Users ua ON r.AssignedTo = ua.UserId
      INNER JOIN Roles ra ON ua.RoleId = ra.RoleId
      INNER JOIN Users uc ON r.CreatedBy = uc.UserId
      WHERE ${whereClause}
      ORDER BY 
        CASE r.Priority
          WHEN 'Red' THEN 1
          WHEN 'Yellow' THEN 2
          WHEN 'Green' THEN 3
        END,
        r.CreatedAt DESC
      OFFSET @Offset ROWS
      FETCH NEXT @Limit ROWS ONLY
    `);
    
    // Đếm tổng số
    const countRequest = pool.request();
    if (!isAdmin) {
      countRequest.input('AssignedTo', user.userId);
    }
    if (status) {
      countRequest.input('Status', status);
    }
    if (priority) {
      countRequest.input('Priority', priority);
    }
    if (isAdmin && assignedTo) {
      countRequest.input('AssignedToFilter', parseInt(assignedTo));
    }
    
    let countWhere = '1=1';
    if (!isAdmin) {
      countWhere += ' AND r.AssignedTo = @AssignedTo';
    }
    if (status) {
      countWhere += ' AND r.Status = @Status';
    }
    if (priority) {
      countWhere += ' AND r.Priority = @Priority';
    }
    if (isAdmin && assignedTo) {
      countWhere += ' AND r.AssignedTo = @AssignedToFilter';
    }
    
    const countResult = await countRequest.query(`
      SELECT COUNT(*) AS total
      FROM Requests r
      WHERE ${countWhere}
    `);
    
    const total = countResult.recordset[0].total;
    
    res.json({
      requests: result.recordset.map(mapRequestRow),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      number: error.number,
      lineNumber: error.lineNumber,
    });
    res.status(500).json({ 
      message: 'Lỗi khi lấy danh sách yêu cầu',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/v1/requests/assignable-users - Lấy danh sách users có thể giao yêu cầu (trừ Viewer và Admin)
// PHẢI ĐẶT TRƯỚC route /:id để tránh conflict
router.get('/assignable-users', authenticate, requireAdmin, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        u.UserId,
        u.Username,
        u.FullName,
        u.Email,
        r.RoleName,
        r.RoleId
      FROM Users u
      INNER JOIN Roles r ON u.RoleId = r.RoleId
      WHERE u.IsActive = 1 AND r.RoleName <> 'Viewer' AND r.RoleName <> 'Admin'
      ORDER BY r.RoleName, u.FullName
    `);
    
    res.json({
      users: result.recordset.map(row => ({
        userId: row.UserId,
        username: row.Username,
        fullName: row.FullName,
        email: row.Email,
        roleName: row.RoleName,
        roleId: row.RoleId,
      })),
    });
  } catch (error) {
    console.error('Error fetching assignable users:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách người dùng' });
  }
});

// GET /api/v1/requests/:id - Lấy chi tiết yêu cầu
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const request = pool.request();
    request.input('RequestId', parseInt(id));
    
    const user = req.user;
    const isAdmin = user.role === 'Admin';
    
    let whereClause = 'r.RequestId = @RequestId';
    if (!isAdmin) {
      request.input('AssignedTo', user.userId);
      whereClause += ' AND r.AssignedTo = @AssignedTo';
    }
    
    const result = await request.query(`
      SELECT 
        r.RequestId,
        r.RequestCode,
        r.Title,
        r.Description,
        r.Priority,
        r.Status,
        r.AssignedTo,
        ua.FullName AS AssignedToName,
        ra.RoleName AS AssignedToRole,
        r.CreatedBy,
        uc.FullName AS CreatedByName,
        r.DueDate,
        r.NegotiatedDueDate,
        r.CompletedAt,
        r.RejectedAt,
        r.RejectionReason,
        r.NegotiationMessage,
        r.CreatedAt,
        r.UpdatedAt
      FROM Requests r
      INNER JOIN Users ua ON r.AssignedTo = ua.UserId
      INNER JOIN Roles ra ON ua.RoleId = ra.RoleId
      INNER JOIN Users uc ON r.CreatedBy = uc.UserId
      WHERE ${whereClause}
    `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu' });
    }
    
    res.json(mapRequestRow(result.recordset[0]));
  } catch (error) {
    console.error('Error fetching request:', error);
    res.status(500).json({ message: 'Lỗi khi lấy chi tiết yêu cầu' });
  }
});

// POST /api/v1/requests - Admin tạo yêu cầu mới
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, description, priority, assignedTo, dueDate } = req.body;
    const pool = await getPool();
    
    // Kiểm tra bảng Requests có tồn tại không
    try {
      await pool.request().query('SELECT TOP 1 * FROM Requests');
    } catch (tableError) {
      if (tableError.message.includes('Invalid object name') || tableError.message.includes('does not exist')) {
        return res.status(500).json({ 
          message: 'Bảng Requests chưa được tạo. Vui lòng chạy: npm run create:requests-table',
          error: process.env.NODE_ENV === 'development' ? tableError.message : undefined
        });
      }
      throw tableError;
    }
    
    // Validation
    if (!title || !assignedTo || !priority) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc: title, assignedTo, priority' });
    }
    
    if (!['Green', 'Yellow', 'Red'].includes(priority)) {
      return res.status(400).json({ message: 'Priority phải là Green, Yellow hoặc Red' });
    }
    
    // Kiểm tra assignedTo có tồn tại và không phải Viewer hoặc Admin
    const userCheck = pool.request();
    userCheck.input('AssignedTo', parseInt(assignedTo));
    const userResult = await userCheck.query(`
      SELECT u.UserId, u.RoleId, r.RoleName
      FROM Users u
      INNER JOIN Roles r ON u.RoleId = r.RoleId
      WHERE u.UserId = @AssignedTo AND u.IsActive = 1
    `);
    
    if (userResult.recordset.length === 0) {
      return res.status(400).json({ message: 'Người được giao không tồn tại hoặc không hoạt động' });
    }
    
    const assignedRole = userResult.recordset[0].RoleName;
    if (assignedRole === 'Viewer') {
      return res.status(400).json({ message: 'Không thể giao yêu cầu cho Viewer' });
    }
    
    if (assignedRole === 'Admin') {
      return res.status(400).json({ message: 'Không thể giao yêu cầu cho Admin khác' });
    }
    
    // Tạo yêu cầu
    const insertRequest = pool.request();
    const createdBy = req.user?.userId || req.user?.UserId;
    
    if (!createdBy) {
      return res.status(401).json({ message: 'Không tìm thấy thông tin người dùng' });
    }
    
    insertRequest.input('Title', title);
    insertRequest.input('Description', description || null);
    insertRequest.input('Priority', priority);
    insertRequest.input('AssignedTo', parseInt(assignedTo));
    insertRequest.input('CreatedBy', parseInt(createdBy));
    
    // Xử lý DueDate
    let dueDateValue = null;
    if (dueDate) {
      try {
        dueDateValue = new Date(dueDate);
        if (isNaN(dueDateValue.getTime())) {
          dueDateValue = null;
        }
      } catch (e) {
        dueDateValue = null;
      }
    }
    insertRequest.input('DueDate', dueDateValue);
    
    console.log('Creating request with:', {
      title,
      priority,
      assignedTo: parseInt(assignedTo),
      createdBy: parseInt(createdBy),
      dueDate: dueDateValue,
      reqUser: req.user,
    });
    
    // SQL Server không cho phép OUTPUT INSERTED.* khi có trigger
    // Nên INSERT xong rồi SELECT lại
    let requestId;
    try {
      const insertResult = await insertRequest.query(`
        INSERT INTO Requests (Title, Description, Priority, AssignedTo, CreatedBy, DueDate, Status)
        VALUES (@Title, @Description, @Priority, @AssignedTo, @CreatedBy, @DueDate, 'Pending');
        SELECT SCOPE_IDENTITY() AS RequestId;
      `);
      
      requestId = insertResult.recordset[0].RequestId;
      console.log('Request created with ID:', requestId);
    } catch (insertError) {
      console.error('INSERT Error:', insertError);
      console.error('INSERT Error details:', {
        message: insertError.message,
        code: insertError.code,
        number: insertError.number,
        lineNumber: insertError.lineNumber,
        originalError: insertError.originalError,
      });
      throw insertError;
    }
    
    if (!requestId) {
      throw new Error('INSERT không trả về RequestId');
    }
    
    // Đợi một chút để trigger tạo RequestCode (nếu chưa có)
    // Trigger sẽ tự động tạo RequestCode sau INSERT
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Lấy thông tin request vừa tạo
    const getRequest = pool.request();
    getRequest.input('RequestId', requestId);
    const requestResult = await getRequest.query(`
      SELECT * FROM Requests WHERE RequestId = @RequestId
    `);
    
    if (!requestResult.recordset || requestResult.recordset.length === 0) {
      throw new Error('Không tìm thấy request vừa tạo');
    }
    
    const newRequest = requestResult.recordset[0];
    console.log('Request data:', newRequest);
    
    // Lấy thông tin đầy đủ
    try {
      const fullRequest = pool.request();
      fullRequest.input('RequestId', newRequest.RequestId);
      const fullResult = await fullRequest.query(`
        SELECT 
          r.RequestId,
          r.RequestCode,
          r.Title,
          r.Description,
          r.Priority,
          r.Status,
          r.AssignedTo,
          ua.FullName AS AssignedToName,
          ra.RoleName AS AssignedToRole,
          r.CreatedBy,
          uc.FullName AS CreatedByName,
          r.DueDate,
          r.NegotiatedDueDate,
          r.CompletedAt,
          r.RejectedAt,
          r.RejectionReason,
          r.NegotiationMessage,
          r.CreatedAt,
          r.UpdatedAt
        FROM Requests r
        INNER JOIN Users ua ON r.AssignedTo = ua.UserId
        INNER JOIN Roles ra ON ua.RoleId = ra.RoleId
        INNER JOIN Users uc ON r.CreatedBy = uc.UserId
        WHERE r.RequestId = @RequestId
      `);
      
      if (fullResult.recordset.length === 0) {
        // Nếu không lấy được thông tin đầy đủ, trả về thông tin từ INSERT
        return res.status(201).json({
          message: 'Tạo yêu cầu thành công',
          request: {
            requestId: newRequest.RequestId,
            requestCode: newRequest.RequestCode || `REQ-${String(newRequest.RequestId).padStart(6, '0')}`,
            title: newRequest.Title,
            description: newRequest.Description,
            priority: newRequest.Priority,
            status: newRequest.Status,
            assignedTo: newRequest.AssignedTo,
            createdBy: newRequest.CreatedBy,
            dueDate: newRequest.DueDate,
            createdAt: newRequest.CreatedAt,
            updatedAt: newRequest.UpdatedAt,
          },
        });
      }
      
      res.status(201).json({
        message: 'Tạo yêu cầu thành công',
        request: mapRequestRow(fullResult.recordset[0]),
      });
    } catch (queryError) {
      console.error('Error fetching full request info:', queryError);
      // Trả về thông tin từ SELECT trước đó nếu query lỗi
      res.status(201).json({
        message: 'Tạo yêu cầu thành công',
        request: {
          requestId: newRequest.RequestId,
          requestCode: newRequest.RequestCode || `REQ-${String(newRequest.RequestId).padStart(6, '0')}`,
          title: newRequest.Title,
          description: newRequest.Description,
          priority: newRequest.Priority,
          status: newRequest.Status,
          assignedTo: newRequest.AssignedTo,
          createdBy: newRequest.CreatedBy,
          dueDate: newRequest.DueDate,
          createdAt: newRequest.CreatedAt,
          updatedAt: newRequest.UpdatedAt,
        },
      });
    }
  } catch (error) {
    console.error('========== ERROR CREATING REQUEST ==========');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error number:', error.number);
    console.error('Error lineNumber:', error.lineNumber);
    console.error('Error originalError:', error.originalError);
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
    console.error('===========================================');
    
    // Trả về error message chi tiết (luôn hiển thị message trong development hoặc khi không có NODE_ENV)
    const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
    const errorMessage = isDev 
      ? `Lỗi khi tạo yêu cầu: ${error.message}` 
      : 'Lỗi khi tạo yêu cầu';
    
    res.status(500).json({ 
      message: errorMessage,
      error: isDev ? {
        message: error.message,
        code: error.code,
        number: error.number,
        details: error.originalError?.message || error.originalError,
      } : undefined
    });
  }
});

// PUT /api/v1/requests/:id/accept - Chấp nhận yêu cầu
router.put('/:id/accept', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const request = pool.request();
    request.input('RequestId', parseInt(id));
    request.input('UserId', req.user.userId);
    
    // Kiểm tra yêu cầu có tồn tại và được giao cho user này không
    const checkResult = await request.query(`
      SELECT RequestId, Status, Priority, AssignedTo
      FROM Requests
      WHERE RequestId = @RequestId AND AssignedTo = @UserId
    `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu hoặc bạn không có quyền' });
    }
    
    const reqData = checkResult.recordset[0];
    
    if (reqData.Status !== 'Pending' && reqData.Status !== 'Negotiating') {
      return res.status(400).json({ message: 'Yêu cầu không ở trạng thái có thể chấp nhận' });
    }
    
    // Cập nhật status
    const updateRequest = pool.request();
    updateRequest.input('RequestId', parseInt(id));
    const updateResult = await updateRequest.query(`
      UPDATE Requests
      SET Status = 'Accepted',
          UpdatedAt = GETDATE()
      WHERE RequestId = @RequestId
      OUTPUT INSERTED.*
    `);
    
    // Lấy thông tin đầy đủ
    const fullRequest = pool.request();
    fullRequest.input('RequestId', parseInt(id));
    const fullResult = await fullRequest.query(`
      SELECT 
        r.RequestId,
        r.RequestCode,
        r.Title,
        r.Description,
        r.Priority,
        r.Status,
        r.AssignedTo,
        ua.FullName AS AssignedToName,
        ra.RoleName AS AssignedToRole,
        r.CreatedBy,
        uc.FullName AS CreatedByName,
        r.DueDate,
        r.NegotiatedDueDate,
        r.CompletedAt,
        r.RejectedAt,
        r.RejectionReason,
        r.NegotiationMessage,
        r.CreatedAt,
        r.UpdatedAt
      FROM Requests r
      INNER JOIN Users ua ON r.AssignedTo = ua.UserId
      INNER JOIN Roles ra ON ua.RoleId = ra.RoleId
      INNER JOIN Users uc ON r.CreatedBy = uc.UserId
      WHERE r.RequestId = @RequestId
    `);
    
    res.json({
      message: 'Đã chấp nhận yêu cầu',
      request: mapRequestRow(fullResult.recordset[0]),
    });
  } catch (error) {
    console.error('Error accepting request:', error);
    res.status(500).json({ message: 'Lỗi khi chấp nhận yêu cầu' });
  }
});

// PUT /api/v1/requests/:id/reject - Từ chối yêu cầu (chỉ mức Green)
router.put('/:id/reject', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const pool = await getPool();
    const request = pool.request();
    request.input('RequestId', parseInt(id));
    request.input('UserId', req.user.userId);
    
    // Kiểm tra yêu cầu
    const checkResult = await request.query(`
      SELECT RequestId, Status, Priority, AssignedTo
      FROM Requests
      WHERE RequestId = @RequestId AND AssignedTo = @UserId
    `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu hoặc bạn không có quyền' });
    }
    
    const reqData = checkResult.recordset[0];
    
    // Chỉ mức Green mới có thể từ chối
    if (reqData.Priority !== 'Green') {
      return res.status(400).json({ message: 'Chỉ yêu cầu mức Green mới có thể từ chối' });
    }
    
    if (reqData.Status !== 'Pending') {
      return res.status(400).json({ message: 'Yêu cầu không ở trạng thái có thể từ chối' });
    }
    
    // Cập nhật status
    const updateRequest = pool.request();
    updateRequest.input('RequestId', parseInt(id));
    updateRequest.input('RejectionReason', rejectionReason || null);
    const updateResult = await updateRequest.query(`
      UPDATE Requests
      SET Status = 'Rejected',
          RejectedAt = GETDATE(),
          RejectionReason = @RejectionReason,
          UpdatedAt = GETDATE()
      WHERE RequestId = @RequestId
      OUTPUT INSERTED.*
    `);
    
    // Lấy thông tin đầy đủ
    const fullRequest = pool.request();
    fullRequest.input('RequestId', parseInt(id));
    const fullResult = await fullRequest.query(`
      SELECT 
        r.RequestId,
        r.RequestCode,
        r.Title,
        r.Description,
        r.Priority,
        r.Status,
        r.AssignedTo,
        ua.FullName AS AssignedToName,
        ra.RoleName AS AssignedToRole,
        r.CreatedBy,
        uc.FullName AS CreatedByName,
        r.DueDate,
        r.NegotiatedDueDate,
        r.CompletedAt,
        r.RejectedAt,
        r.RejectionReason,
        r.NegotiationMessage,
        r.CreatedAt,
        r.UpdatedAt
      FROM Requests r
      INNER JOIN Users ua ON r.AssignedTo = ua.UserId
      INNER JOIN Roles ra ON ua.RoleId = ra.RoleId
      INNER JOIN Users uc ON r.CreatedBy = uc.UserId
      WHERE r.RequestId = @RequestId
    `);
    
    res.json({
      message: 'Đã từ chối yêu cầu',
      request: mapRequestRow(fullResult.recordset[0]),
    });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ message: 'Lỗi khi từ chối yêu cầu' });
  }
});

// PUT /api/v1/requests/:id/negotiate - Thương lượng thời gian (chỉ mức Yellow)
router.put('/:id/negotiate', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { negotiatedDueDate, negotiationMessage } = req.body;
    const pool = await getPool();
    const request = pool.request();
    request.input('RequestId', parseInt(id));
    request.input('UserId', req.user.userId);
    
    if (!negotiatedDueDate) {
      return res.status(400).json({ message: 'Cần cung cấp thời hạn mới' });
    }
    
    // Kiểm tra yêu cầu
    const checkResult = await request.query(`
      SELECT RequestId, Status, Priority, AssignedTo
      FROM Requests
      WHERE RequestId = @RequestId AND AssignedTo = @UserId
    `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu hoặc bạn không có quyền' });
    }
    
    const reqData = checkResult.recordset[0];
    
    // Chỉ mức Yellow mới có thể thương lượng
    if (reqData.Priority !== 'Yellow') {
      return res.status(400).json({ message: 'Chỉ yêu cầu mức Yellow mới có thể thương lượng thời gian' });
    }
    
    if (reqData.Status !== 'Pending' && reqData.Status !== 'Negotiating') {
      return res.status(400).json({ message: 'Yêu cầu không ở trạng thái có thể thương lượng' });
    }
    
    // Cập nhật
    const updateRequest = pool.request();
    updateRequest.input('RequestId', parseInt(id));
    updateRequest.input('NegotiatedDueDate', new Date(negotiatedDueDate));
    updateRequest.input('NegotiationMessage', negotiationMessage || null);
    const updateResult = await updateRequest.query(`
      UPDATE Requests
      SET Status = 'Negotiating',
          NegotiatedDueDate = @NegotiatedDueDate,
          NegotiationMessage = @NegotiationMessage,
          UpdatedAt = GETDATE()
      WHERE RequestId = @RequestId
      OUTPUT INSERTED.*
    `);
    
    // Lấy thông tin đầy đủ
    const fullRequest = pool.request();
    fullRequest.input('RequestId', parseInt(id));
    const fullResult = await fullRequest.query(`
      SELECT 
        r.RequestId,
        r.RequestCode,
        r.Title,
        r.Description,
        r.Priority,
        r.Status,
        r.AssignedTo,
        ua.FullName AS AssignedToName,
        ra.RoleName AS AssignedToRole,
        r.CreatedBy,
        uc.FullName AS CreatedByName,
        r.DueDate,
        r.NegotiatedDueDate,
        r.CompletedAt,
        r.RejectedAt,
        r.RejectionReason,
        r.NegotiationMessage,
        r.CreatedAt,
        r.UpdatedAt
      FROM Requests r
      INNER JOIN Users ua ON r.AssignedTo = ua.UserId
      INNER JOIN Roles ra ON ua.RoleId = ra.RoleId
      INNER JOIN Users uc ON r.CreatedBy = uc.UserId
      WHERE r.RequestId = @RequestId
    `);
    
    res.json({
      message: 'Đã gửi yêu cầu thương lượng',
      request: mapRequestRow(fullResult.recordset[0]),
    });
  } catch (error) {
    console.error('Error negotiating request:', error);
    res.status(500).json({ message: 'Lỗi khi thương lượng yêu cầu' });
  }
});

// PUT /api/v1/requests/:id/complete - Hoàn thành yêu cầu
router.put('/:id/complete', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const request = pool.request();
    request.input('RequestId', parseInt(id));
    request.input('UserId', req.user.userId);
    
    // Kiểm tra yêu cầu
    const checkResult = await request.query(`
      SELECT RequestId, Status, AssignedTo
      FROM Requests
      WHERE RequestId = @RequestId AND AssignedTo = @UserId
    `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu hoặc bạn không có quyền' });
    }
    
    const reqData = checkResult.recordset[0];
    
    if (reqData.Status !== 'Accepted' && reqData.Status !== 'InProgress') {
      return res.status(400).json({ message: 'Yêu cầu chưa được chấp nhận' });
    }
    
    // Cập nhật status
    const updateRequest = pool.request();
    updateRequest.input('RequestId', parseInt(id));
    const updateResult = await updateRequest.query(`
      UPDATE Requests
      SET Status = 'Completed',
          CompletedAt = GETDATE(),
          UpdatedAt = GETDATE()
      WHERE RequestId = @RequestId
      OUTPUT INSERTED.*
    `);
    
    // Lấy thông tin đầy đủ
    const fullRequest = pool.request();
    fullRequest.input('RequestId', parseInt(id));
    const fullResult = await fullRequest.query(`
      SELECT 
        r.RequestId,
        r.RequestCode,
        r.Title,
        r.Description,
        r.Priority,
        r.Status,
        r.AssignedTo,
        ua.FullName AS AssignedToName,
        ra.RoleName AS AssignedToRole,
        r.CreatedBy,
        uc.FullName AS CreatedByName,
        r.DueDate,
        r.NegotiatedDueDate,
        r.CompletedAt,
        r.RejectedAt,
        r.RejectionReason,
        r.NegotiationMessage,
        r.CreatedAt,
        r.UpdatedAt
      FROM Requests r
      INNER JOIN Users ua ON r.AssignedTo = ua.UserId
      INNER JOIN Roles ra ON ua.RoleId = ra.RoleId
      INNER JOIN Users uc ON r.CreatedBy = uc.UserId
      WHERE r.RequestId = @RequestId
    `);
    
    res.json({
      message: 'Đã hoàn thành yêu cầu',
      request: mapRequestRow(fullResult.recordset[0]),
    });
  } catch (error) {
    console.error('Error completing request:', error);
    res.status(500).json({ message: 'Lỗi khi hoàn thành yêu cầu' });
  }
});

// PUT /api/v1/requests/:id/start - Bắt đầu làm việc (chuyển từ Accepted sang InProgress)
router.put('/:id/start', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const request = pool.request();
    request.input('RequestId', parseInt(id));
    request.input('UserId', req.user.userId);
    
    // Kiểm tra yêu cầu
    const checkResult = await request.query(`
      SELECT RequestId, Status, AssignedTo
      FROM Requests
      WHERE RequestId = @RequestId AND AssignedTo = @UserId
    `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu hoặc bạn không có quyền' });
    }
    
    const reqData = checkResult.recordset[0];
    
    if (reqData.Status !== 'Accepted') {
      return res.status(400).json({ message: 'Yêu cầu chưa được chấp nhận' });
    }
    
    // Cập nhật status
    const updateRequest = pool.request();
    updateRequest.input('RequestId', parseInt(id));
    const updateResult = await updateRequest.query(`
      UPDATE Requests
      SET Status = 'InProgress',
          UpdatedAt = GETDATE()
      WHERE RequestId = @RequestId
      OUTPUT INSERTED.*
    `);
    
    // Lấy thông tin đầy đủ
    const fullRequest = pool.request();
    fullRequest.input('RequestId', parseInt(id));
    const fullResult = await fullRequest.query(`
      SELECT 
        r.RequestId,
        r.RequestCode,
        r.Title,
        r.Description,
        r.Priority,
        r.Status,
        r.AssignedTo,
        ua.FullName AS AssignedToName,
        ra.RoleName AS AssignedToRole,
        r.CreatedBy,
        uc.FullName AS CreatedByName,
        r.DueDate,
        r.NegotiatedDueDate,
        r.CompletedAt,
        r.RejectedAt,
        r.RejectionReason,
        r.NegotiationMessage,
        r.CreatedAt,
        r.UpdatedAt
      FROM Requests r
      INNER JOIN Users ua ON r.AssignedTo = ua.UserId
      INNER JOIN Roles ra ON ua.RoleId = ra.RoleId
      INNER JOIN Users uc ON r.CreatedBy = uc.UserId
      WHERE r.RequestId = @RequestId
    `);
    
    res.json({
      message: 'Đã bắt đầu làm việc',
      request: mapRequestRow(fullResult.recordset[0]),
    });
  } catch (error) {
    console.error('Error starting request:', error);
    res.status(500).json({ message: 'Lỗi khi bắt đầu làm việc' });
  }
});

export default router;

