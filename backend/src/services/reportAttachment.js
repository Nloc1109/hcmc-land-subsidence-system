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

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Tạo file PDF báo cáo: thông tin người gửi, người nhận, tiêu đề, nội dung.
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

  ensureDir(GENERATED_DIR);
  const fileName = `report-${notificationId}.pdf`;
  const filePath = path.join(GENERATED_DIR, fileName);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 60, size: 'A4' });
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

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    doc.fontSize(24).font(useViet ? fontBold : 'Helvetica-Bold').text('BÁO CÁO', { align: 'center' });
    doc.moveDown(0.6);
    doc.fontSize(12).font(useViet ? fontName : 'Helvetica').text(createdAt.toLocaleString('vi-VN'), { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(14).font(useViet ? fontBold : 'Helvetica-Bold').text('Thông tin người gửi');
    doc.moveDown(0.5);
    doc.font(useViet ? fontName : 'Helvetica').fontSize(13);
    doc.text(`Họ tên: ${senderName}`, { lineGap: 6 });
    doc.text(`Vai trò: ${senderRole || '—'}`, { lineGap: 6 });
    doc.moveDown(1.2);

    doc.font(useViet ? fontBold : 'Helvetica-Bold').fontSize(14).text('Thông tin người nhận');
    doc.moveDown(0.5);
    doc.font(useViet ? fontName : 'Helvetica').fontSize(13);
    doc.text(`Họ tên: ${recipientName || '—'}`, { lineGap: 6 });
    doc.text(`Vai trò: ${recipientRole || '—'}`, { lineGap: 6 });
    doc.moveDown(1.2);

    doc.font(useViet ? fontBold : 'Helvetica-Bold').fontSize(14).text('Tiêu đề');
    doc.moveDown(0.5);
    doc.font(useViet ? fontName : 'Helvetica').fontSize(13).text(title || '—', { width: pageWidth, lineGap: 6 });
    doc.moveDown(1.2);

    if (reportData && String(reportData).trim()) {
      doc.font(useViet ? fontBold : 'Helvetica-Bold').fontSize(14).text('Số liệu / Thông tin cần báo cáo');
      doc.moveDown(0.5);
      doc.font(useViet ? fontName : 'Helvetica').fontSize(13);
      doc.text(String(reportData).replace(/\n/g, '\n'), { width: pageWidth, lineGap: 6 });
      doc.moveDown(1.2);
    }

    doc.font(useViet ? fontBold : 'Helvetica-Bold').fontSize(14).text('Nội dung chi tiết');
    doc.moveDown(0.5);
    doc.font(useViet ? fontName : 'Helvetica').fontSize(13);
    doc.text((message || '—').replace(/\n/g, '\n'), { width: pageWidth, lineGap: 8 });

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
