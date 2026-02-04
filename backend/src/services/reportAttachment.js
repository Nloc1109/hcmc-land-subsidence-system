import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// backend/src/services -> backend
const rootDir = path.join(__dirname, '..', '..');
const GENERATED_DIR = path.join(rootDir, 'generated', 'notifications');
const FONTS_DIR = path.join(rootDir, 'fonts');

/**
 * Tìm font TTF hỗ trợ tiếng Việt (Unicode) để PDF hiển thị đúng dấu.
 * Thử: PDF_FONT_PATH env → backend/fonts/ → Arial (Windows) → DejaVu (Linux).
 * @returns {{ normal: string, bold?: string } | null}
 */
function getVietnameseFontPaths() {
  const envFont = process.env.PDF_FONT_PATH;
  if (envFont && fs.existsSync(envFont)) {
    return { normal: envFont };
  }
  const arialNormal = path.join(FONTS_DIR, 'arial.ttf');
  const arialBold = path.join(FONTS_DIR, 'arialbd.ttf');
  if (fs.existsSync(arialNormal)) {
    return { normal: arialNormal, bold: fs.existsSync(arialBold) ? arialBold : arialNormal };
  }
  if (process.platform === 'win32') {
    const winRoot = process.env.SystemRoot || process.env.WINDIR || 'C:\\Windows';
    const an = path.join(winRoot, 'Fonts', 'arial.ttf');
    const ab = path.join(winRoot, 'Fonts', 'arialbd.ttf');
    if (fs.existsSync(an)) {
      return { normal: an, bold: fs.existsSync(ab) ? ab : an };
    }
  }
  const dejaVu = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
  const dejaVuBold = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
  if (fs.existsSync(dejaVu)) {
    return { normal: dejaVu, bold: fs.existsSync(dejaVuBold) ? dejaVuBold : dejaVu };
  }
  return null;
}

/** Vai trò → nhãn nguồn báo cáo (Operator, Admin, Analyst; Manager ẩn) */
const ROLE_SOURCE_LABELS = {
  Operator: 'Phòng vận hành',
  Admin: 'Quản trị',
  Analyst: 'Phân tích',
};
function getSourceLabelFromRole(senderRole) {
  if (!senderRole || typeof senderRole !== 'string') return '';
  const label = ROLE_SOURCE_LABELS[senderRole.trim()];
  return label || '';
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Layout PDF A4 (pt): margin 50, content width ~495
const PDF_MARGIN = 50;
const PDF_CONTENT_WIDTH = 495;
const SECTION_PAD = 10;
const BOX_RADIUS = 4;
/** Chiều cao cố định cho ô người gửi / người nhận (vẽ khung trước, chữ sau để không bị đè) */
const BOX_SENDER_RECIPIENT_HEIGHT = 36;

/**
 * Vẽ đường kẻ ngang và tăng doc.y
 */
function drawLine(doc, fromX, toX, y, color = '#e0e0e0') {
  doc.strokeColor(color).lineWidth(0.5).moveTo(fromX, y).lineTo(toX, y).stroke();
}

/**
 * Vẽ khung bo nội dung (nền xám nhạt, viền)
 */
function drawBox(doc, x, y, width, height, fill = '#f8f9fa', stroke = '#dee2e6') {
  doc.rect(x, y, width, height, BOX_RADIUS).fillAndStroke(fill, stroke);
}

/**
 * Tạo file PDF báo cáo: thiết kế chi tiết, trình bày chuyên nghiệp.
 * @returns {Promise<string>} Đường dẫn file đã lưu
 */
export async function generateReportPdf(options) {
  const {
    notificationId,
    senderName = 'Hệ thống',
    senderRole = '',
    recipientName = '',
    recipientRole = '',
    title = '',
    message = '',
    reportData = '',
    createdAt = new Date(),
  } = options;
  const sourceLabel = getSourceLabelFromRole(senderRole);
  const dateStr = createdAt instanceof Date ? createdAt.toLocaleString('vi-VN') : String(createdAt);

  ensureDir(GENERATED_DIR);
  const fileName = `report-${notificationId}.pdf`;
  const filePath = path.join(GENERATED_DIR, fileName);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: PDF_MARGIN, size: 'A4', bufferPages: true });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const fonts = getVietnameseFontPaths();
    const fontName = 'Viet';
    const fontBold = 'VietBold';
    let useViet = false;
    if (fonts) {
      try {
        doc.registerFont(fontName, fonts.normal);
        doc.registerFont(fontBold, fonts.bold || fonts.normal);
        useViet = true;
      } catch (e) {
        console.warn('PDF: Could not register Vietnamese font, tiếng Việt có thể hiển thị sai:', e.message);
      }
    }

    const left = PDF_MARGIN;
    const right = left + PDF_CONTENT_WIDTH;
    const pageMid = left + PDF_CONTENT_WIDTH / 2;

    // ----- HEADER -----
    doc.fontSize(11).font(useViet ? fontName : 'Helvetica').fillColor('#495057');
    doc.text('HỆ THỐNG GIÁM SÁT SỤT LÚN ĐẤT', left, doc.y, { width: PDF_CONTENT_WIDTH, align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor('#6c757d');
    doc.text('Thành phố Hồ Chí Minh • Báo cáo gửi Hộp thư', left, doc.y, { width: PDF_CONTENT_WIDTH, align: 'center' });
    doc.moveDown(1);
    drawLine(doc, left, right, doc.y);
    doc.moveDown(1.2);

    // ----- TIÊU ĐỀ BÁO CÁO (vẽ khung trước, chữ sau) -----
    const titleBlockY = doc.y;
    const titleBlockH = 44;
    drawBox(doc, left, titleBlockY - 4, PDF_CONTENT_WIDTH, titleBlockH);
    doc.fontSize(18).font(useViet ? fontBold : 'Helvetica-Bold').fillColor('#212529');
    doc.text('BÁO CÁO GỬI HỘP THƯ', left, titleBlockY + 6, { width: PDF_CONTENT_WIDTH, align: 'center' });
    doc.fontSize(10).font(useViet ? fontName : 'Helvetica').fillColor('#6c757d');
    doc.text(`Ngày tạo: ${dateStr}`, left, titleBlockY + 26, { width: PDF_CONTENT_WIDTH, align: 'center' });
    doc.y = titleBlockY + titleBlockH + 8;
    doc.moveDown(0.8);

    // ----- THÔNG TIN MÃ & NGUỒN -----
    doc.fontSize(9).font(useViet ? fontName : 'Helvetica').fillColor('#6c757d');
    doc.text(`Mã thông báo: #${notificationId}`, left, doc.y);
    doc.text(`Nguồn báo cáo: ${sourceLabel || '—'}`, pageMid, doc.y);
    doc.moveDown(1.2);

    // ----- 1. THÔNG TIN NGƯỜI GỬI (vẽ khung trước, chữ sau để nội dung hiển thị) -----
    doc.fontSize(12).font(useViet ? fontBold : 'Helvetica-Bold').fillColor('#212529');
    doc.text('1. Thông tin người gửi', left, doc.y);
    doc.moveDown(0.5);
    const box1Y = doc.y;
    drawBox(doc, left, box1Y - 4, PDF_CONTENT_WIDTH, BOX_SENDER_RECIPIENT_HEIGHT);
    doc.font(useViet ? fontName : 'Helvetica').fontSize(11).fillColor('#212529');
    doc.y = box1Y + 8;
    doc.text(`Họ và tên: ${senderName}`, left + SECTION_PAD, doc.y, { width: PDF_CONTENT_WIDTH - SECTION_PAD * 2, lineGap: 5 });
    doc.text(`Vai trò: ${senderRole || '—'}`, left + SECTION_PAD, doc.y, { width: PDF_CONTENT_WIDTH - SECTION_PAD * 2, lineGap: 5 });
    doc.y = box1Y + BOX_SENDER_RECIPIENT_HEIGHT + 8;
    doc.moveDown(1);

    // ----- 2. THÔNG TIN NGƯỜI NHẬN (vẽ khung trước, chữ sau) -----
    doc.font(useViet ? fontBold : 'Helvetica-Bold').fontSize(12).fillColor('#212529');
    doc.text('2. Thông tin người nhận', left, doc.y);
    doc.moveDown(0.5);
    const box2Y = doc.y;
    drawBox(doc, left, box2Y - 4, PDF_CONTENT_WIDTH, BOX_SENDER_RECIPIENT_HEIGHT);
    doc.font(useViet ? fontName : 'Helvetica').fontSize(11).fillColor('#212529');
    doc.y = box2Y + 8;
    doc.text(`Họ và tên: ${recipientName || '—'}`, left + SECTION_PAD, doc.y, { width: PDF_CONTENT_WIDTH - SECTION_PAD * 2, lineGap: 5 });
    doc.text(`Vai trò: ${recipientRole || '—'}`, left + SECTION_PAD, doc.y, { width: PDF_CONTENT_WIDTH - SECTION_PAD * 2, lineGap: 5 });
    doc.y = box2Y + BOX_SENDER_RECIPIENT_HEIGHT + 8;
    doc.moveDown(1);

    // ----- 3. THÔNG TIN BÁO CÁO (Tiêu đề) -----
    doc.font(useViet ? fontBold : 'Helvetica-Bold').fontSize(12).fillColor('#212529');
    doc.text('3. Thông tin báo cáo', left, doc.y);
    doc.moveDown(0.5);
    doc.font(useViet ? fontName : 'Helvetica').fontSize(11).fillColor('#212529');
    doc.text('Tiêu đề:', left, doc.y, { continued: true });
    doc.font(useViet ? fontBold : 'Helvetica-Bold');
    doc.text(` ${title || '—'}`, { width: PDF_CONTENT_WIDTH, lineGap: 6 });
    doc.font(useViet ? fontName : 'Helvetica');
    doc.moveDown(1);

    // ----- 4. DỮ LIỆU / TÓM TẮT (reportData) — vẽ khung trước, chữ sau -----
    if (reportData && String(reportData).trim()) {
      doc.font(useViet ? fontBold : 'Helvetica-Bold').fontSize(12).fillColor('#212529');
      doc.text('4. Dữ liệu và tóm tắt nội dung báo cáo', left, doc.y);
      doc.moveDown(0.5);
      const dataLines = String(reportData)
        .split(/\r?\n/)
        .map((line) => line.trimEnd())
        .filter((line, i, arr) => line.length > 0 || (i > 0 && i < arr.length - 1));
      const lineCount = Math.min(dataLines.length, 40);
      const boxDataY = doc.y;
      const boxDataH = Math.max(lineCount * 14 + SECTION_PAD * 2, 24);
      drawBox(doc, left, boxDataY - 4, PDF_CONTENT_WIDTH, boxDataH);
      doc.font(useViet ? fontName : 'Helvetica').fontSize(10).fillColor('#374151');
      doc.y = boxDataY + SECTION_PAD;
      dataLines.slice(0, 40).forEach((line) => {
        doc.text(line || ' ', left + SECTION_PAD, doc.y, { width: PDF_CONTENT_WIDTH - SECTION_PAD * 2, lineGap: 4 });
      });
      doc.y = boxDataY + boxDataH + 6;
      if (dataLines.length > 40) {
        doc.fontSize(9).fillColor('#6c757d');
        doc.text(`(Còn ${dataLines.length - 40} dòng — xem chi tiết trong Hộp thư)`, left, doc.y);
        doc.moveDown(0.5);
      }
      doc.moveDown(1);
    }

    // ----- 5. NỘI DUNG CHI TIẾT (message) -----
    const secNum = reportData && String(reportData).trim() ? '5' : '4';
    doc.font(useViet ? fontBold : 'Helvetica-Bold').fontSize(12).fillColor('#212529');
    doc.text(`${secNum}. Nội dung chi tiết`, left, doc.y);
    doc.moveDown(0.5);
    doc.font(useViet ? fontName : 'Helvetica').fontSize(11).fillColor('#212529');
    const messageText = (message || '—').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    doc.text(messageText, left, doc.y, { width: PDF_CONTENT_WIDTH, lineGap: 8, align: 'left' });
    doc.moveDown(1.5);

    // ----- FOOTER / GHI CHÚ -----
    drawLine(doc, left, right, doc.y);
    doc.moveDown(0.8);
    doc.fontSize(8).font(useViet ? fontName : 'Helvetica').fillColor('#adb5bd');
    doc.text(
      'Tài liệu này được tạo tự động từ Hệ thống giám sát sụt lún đất Thành phố Hồ Chí Minh. Chỉ mang tính chất tham khảo và lưu trữ.',
      left,
      doc.y,
      { width: PDF_CONTENT_WIDTH, align: 'center' }
    );
    doc.moveDown(0.5);
    doc.fontSize(8).fillColor('#ced4da');
    doc.text(`Mã thông báo #${notificationId} • ${dateStr}`, left, doc.y, { width: PDF_CONTENT_WIDTH, align: 'center' });

    doc.end();
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
    doc.on('error', reject);
  });
}

/**
 * Tạo file Excel báo cáo: thông tin hai bên và nội dung.
 * @returns {Promise<string>} Đường dẫn file đã lưu
 */
export async function generateReportExcel(options) {
  const {
    notificationId,
    senderName = 'Hệ thống',
    senderRole = '',
    recipientName = '',
    recipientRole = '',
    title = '',
    message = '',
    reportData = '',
    createdAt = new Date(),
  } = options;

  const sourceLabel = getSourceLabelFromRole(senderRole);
  ensureDir(GENERATED_DIR);
  const fileName = `report-${notificationId}.xlsx`;
  const filePath = path.join(GENERATED_DIR, fileName);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'HCMC Land Subsidence System';
  const sheet = workbook.addWorksheet('Báo cáo', { properties: { defaultColWidth: 40 } });

  const dateStr = createdAt instanceof Date ? createdAt.toLocaleString('vi-VN') : String(createdAt);
  sheet.addRow(['BÁO CÁO']);
  sheet.addRow(['Ngày tạo', dateStr]);
  sheet.addRow([]);
  sheet.addRow(['THÔNG TIN NGƯỜI GỬI']);
  sheet.addRow(['Họ tên', senderName]);
  sheet.addRow(['Vai trò', senderRole || '—']);
  sheet.addRow([]);
  sheet.addRow(['THÔNG TIN NGƯỜI NHẬN']);
  sheet.addRow(['Họ tên', recipientName || '—']);
  sheet.addRow(['Vai trò', recipientRole || '—']);
  sheet.addRow([]);
  sheet.addRow(['TIÊU ĐỀ', title || '—']);
  if (sourceLabel) {
    sheet.addRow(['NGUỒN BÁO CÁO', sourceLabel]);
  }
  sheet.addRow([]);
  if (reportData && String(reportData).trim()) {
    sheet.addRow(['SỐ LIỆU / THÔNG TIN CẦN BÁO CÁO']);
    String(reportData)
      .split('\n')
      .filter((line) => line.trim())
      .forEach((line) => sheet.addRow([line.trim().replace(/\t/g, '  ')]));
    sheet.addRow([]);
  }
  sheet.addRow(['NỘI DUNG CHI TIẾT']);
  sheet.addRow([(message || '—').replace(/\n/g, ' ')]);
  sheet.getColumn(1).width = 22;
  sheet.getColumn(2).width = 50;

  await workbook.xlsx.writeFile(filePath);
  return filePath;
}

/**
 * Trả về đường dẫn thư mục generated/notifications (để serve static hoặc resolve path).
 */
export function getGeneratedDir() {
  return GENERATED_DIR;
}
