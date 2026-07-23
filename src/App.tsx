import React, { useRef } from 'react';
import { PDFProvider, usePDF } from './context/PDFContext';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { PageSidebar } from './components/PageSidebar';
import { PDFCanvasViewer } from './components/PDFCanvasViewer';
import { SignatureModal } from './components/SignatureModal';
import { StampModal } from './components/StampModal';
import { SplitMergeModal } from './components/SplitMergeModal';
import { SecurityModal } from './components/SecurityModal';
import { CompressModal } from './components/CompressModal';
import { OCRModal } from './components/OCRModal';
import { WatermarkModal } from './components/WatermarkModal';
import { PageNumberModal } from './components/PageNumberModal';
import { AIAssistantWidget } from './components/AIAssistantWidget';
import { MetadataModal } from './components/MetadataModal';
import { NUpModal } from './components/NUpModal';
import { PageMatrixModal } from './components/PageMatrixModal';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import {
  Upload,
  Sparkles,
  PenTool,
  Lock,
  Layers,
  Zap,
} from 'lucide-react';

const StudioContent: React.FC = () => {
  const { pdfBytes, loadFile, loadBytes, activeModal } = usePDF();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        loadFile(file);
      } else {
        alert('Vui lòng chọn file định dạng .PDF!');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      loadFile(e.target.files[0]);
    }
  };

  const handleLoadSamplePdf = async () => {
    try {
      const sampleDoc = await PDFDocument.create();
      const helveticaFont = await sampleDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await sampleDoc.embedFont(StandardFonts.HelveticaBold);

      const page1 = sampleDoc.addPage([595.28, 841.89]);
      page1.drawRectangle({
        x: 0,
        y: 0,
        width: 595.28,
        height: 841.89,
        color: rgb(0.97, 0.98, 1.0),
      });

      page1.drawText('HỢP ĐỒNG MẪU & TÀI LIỆU DEMO - STIRLING PDF SUITE', {
        x: 40,
        y: 780,
        size: 16,
        font: helveticaBold,
        color: rgb(0.2, 0.25, 0.7),
      });

      page1.drawLine({
        start: { x: 40, y: 765 },
        end: { x: 555, y: 765 },
        thickness: 2,
        color: rgb(0.38, 0.4, 0.95),
      });

      page1.drawText('Chào mừng bạn đến với Ứng Dụng Chỉnh Sửa PDF Stirling-PDF Powered!', {
        x: 40,
        y: 730,
        size: 13,
        font: helveticaBold,
        color: rgb(0.1, 0.1, 0.2),
      });

      const bodyLines = [
        'Tài liệu này được tạo tự động để bạn thử nghiệm ngay các tính năng chuyên nghiệp:',
        '1. Quét OCR AI: Nhận diện chữ Tiếng Việt + Tiếng Anh trên ảnh scan và sửa chữ đè trực tiếp.',
        '2. Chỉnh sửa Metadata PDF: Đổi Tiêu đề, Tác giả, Từ khóa ẩn bên trong file PDF.',
        '3. Bố Cục Ghép N-Up Trang: Ghép 2 trang hoặc 4 trang PDF lên 1 tờ A4 để in ấn.',
        '4. Lọc & Đảo Trang: Đảo ngược thứ tự trang hoặc lọc giữ lại trang chẵn / trang lẻ.',
        '5. Thêm Chữ Ký Điện Tử & Watermark: Đóng dấu mờ chống sao chép và chèn chữ ký tay.',
        '6. Trợ Lý AI PDF Copilot: Tóm tắt văn bản, dịch thuật và trả lời câu hỏi thông minh.',
        '',
        'Đơn vị yêu cầu: Công ty Công Nghệ Stirling-PDF Studio',
        'Ngày khởi tạo: 23/07/2026',
      ];

      let yPos = 690;
      bodyLines.forEach((line) => {
        page1.drawText(line, {
          x: 40,
          y: yPos,
          size: 11,
          font: line.startsWith('1.') || line.startsWith('Đơn vị') ? helveticaBold : helveticaFont,
          color: rgb(0.2, 0.2, 0.3),
        });
        yPos -= 24;
      });

      page1.drawRectangle({
        x: 40,
        y: 350,
        width: 250,
        height: 110,
        borderColor: rgb(0.38, 0.4, 0.95),
        borderWidth: 1,
        color: rgb(1, 1, 1),
      });
      page1.drawText('ĐẠI DIỆN BÊN A (KÝ TÊN TẠI ĐÂY)', {
        x: 50,
        y: 440,
        size: 10,
        font: helveticaBold,
        color: rgb(0.38, 0.4, 0.95),
      });

      const page2 = sampleDoc.addPage([595.28, 841.89]);
      page2.drawText('TRANG 2: BẢNG TỔNG HỢP DỰ ÁN', {
        x: 40,
        y: 780,
        size: 16,
        font: helveticaBold,
        color: rgb(0.2, 0.25, 0.7),
      });

      page2.drawText('Thử nghiệm chèn trang mới, nhân bản hoặc trích xuất trang này!', {
        x: 40,
        y: 740,
        size: 12,
        font: helveticaFont,
        color: rgb(0.4, 0.4, 0.5),
      });

      const bytes = await sampleDoc.save();
      await loadBytes(bytes, 'Demo_Document_StirlingPDF.pdf');
    } catch (e) {
      console.error('Failed to load sample PDF:', e);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Header />

      {!pdfBytes ? (
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: 'radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.15) 0%, transparent 60%)',
          }}
        >
          <div style={{ maxWidth: '660px', width: '100%', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '99px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', marginBottom: '20px' }}>
              <Zap size={16} color="#6366f1" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-primary)' }}>100% Client-Side Privacy • Stirling-PDF Powered</span>
            </div>

            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '12px', letterSpacing: '-1px' }}>
              Bộ Công Cụ PDF Đỉnh Cao Với <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>OmniPDF Studio</span>
            </h2>

            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: '1.6' }}>
              Quét OCR chữ ảnh scan, chỉnh sửa Metadata, ghép 2-up/4-up trang, đảo/lọc trang chẵn lẻ, đóng dấu watermark, đánh số trang và trợ lý AI tóm tắt tài liệu.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept="application/pdf"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />

            <div
              className="dropzone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Upload size={32} color="var(--accent-primary)" />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>Kéo & Thả File PDF Vào Đây</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>hoặc bấm để chọn file từ máy tính của bạn</p>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
              <button className="btn btn-primary" onClick={handleLoadSamplePdf} style={{ padding: '10px 24px', fontSize: '0.95rem' }}>
                <Sparkles size={18} />
                Mở Dùng Thử PDF Mẫu Ngay
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '40px' }}>
              <div className="glass-card" style={{ padding: '14px', textAlign: 'left' }}>
                <PenTool size={20} color="#6366f1" style={{ marginBottom: '8px' }} />
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '4px' }}>OCR AI & Sửa Chữ Scan</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Quét OCR Tesseract.js chữ scan và sửa chữ đè trực tiếp.</p>
              </div>

              <div className="glass-card" style={{ padding: '14px', textAlign: 'left' }}>
                <Layers size={20} color="#06b6d4" style={{ marginBottom: '8px' }} />
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '4px' }}>Metadata & Ghép N-Up</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Đổi tiêu đề, tác giả ẩn và ghép 2-up/4-up trang vào 1 tờ.</p>
              </div>

              <div className="glass-card" style={{ padding: '14px', textAlign: 'left' }}>
                <Lock size={20} color="#10b981" style={{ marginBottom: '8px' }} />
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '4px' }}>Lọc Trang & Trợ Lý AI</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Đảo thứ tự trang, lọc chẵn/lẻ và tóm tắt bằng AI.</p>
              </div>
            </div>
          </div>
        </main>
      ) : (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          <PageSidebar />

          <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 90 }}>
              <Toolbar />
            </div>

            <PDFCanvasViewer />
          </main>
        </div>
      )}

      {pdfBytes && <AIAssistantWidget />}

      <SignatureModal />
      <StampModal />
      <SplitMergeModal />
      <SecurityModal />
      <CompressModal />

      {activeModal === 'ocr' && <OCRModal />}
      {activeModal === 'watermark' && <WatermarkModal />}
      {activeModal === 'page-number' && <PageNumberModal />}
      {activeModal === 'metadata' && <MetadataModal />}
      {activeModal === 'nup' && <NUpModal />}
      {activeModal === 'page-matrix' && <PageMatrixModal />}
    </div>
  );
};

export default function App() {
  return (
    <PDFProvider>
      <StudioContent />
    </PDFProvider>
  );
}
