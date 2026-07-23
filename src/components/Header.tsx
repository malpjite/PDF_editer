import React, { useRef } from 'react';
import { usePDF } from '../context/PDFContext';
import { exportModifiedPDF } from '../utils/pdfExporter';
import confetti from 'canvas-confetti';
import {
  Upload,
  Download,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Moon,
  Sun,
  Lock,
  Layers,
  Archive,
  Sparkles,
  FileText,
  LayoutGrid,
  ArrowDownUp,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    fileName,
    pdfBytes,
    pageOrder,
    pageRotations,
    deletedPages,
    annotations,
    watermark,
    pageNumbering,
    metadata,
    scale,
    setScale,
    theme,
    toggleTheme,
    undo,
    redo,
    canUndo,
    canRedo,
    loadFile,
    setActiveModal,
  } = usePDF();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      loadFile(e.target.files[0]);
    }
  };

  const handleExport = async () => {
    if (!pdfBytes) return;

    try {
      const exportedBytes = await exportModifiedPDF(
        pdfBytes,
        pageOrder,
        pageRotations,
        deletedPages,
        annotations,
        watermark,
        pageNumbering,
        metadata,
        scale
      );

      const blob = new Blob([exportedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `edited_${fileName}`;
      link.click();
      URL.revokeObjectURL(url);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error('Export error:', err);
      alert('Không thể xuất file PDF: ' + err);
    }
  };

  return (
    <header className="glass-panel" style={{ height: 'var(--header-height)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', zIndex: 100 }}>
      {/* Brand & File Upload */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--accent-glow)',
            }}
          >
            <Sparkles size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 800, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>
              OmniPDF Studio
            </h1>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Stirling-PDF Powered Suite
            </span>
          </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          accept="application/pdf"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <button
          className="btn btn-secondary"
          onClick={() => fileInputRef.current?.click()}
          style={{ padding: '5px 10px', fontSize: '0.78rem' }}
        >
          <Upload size={14} />
          {pdfBytes ? 'Đổi File' : 'Mở File PDF'}
        </button>

        {pdfBytes && (
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            📄 {fileName}
          </span>
        )}
      </div>

      {/* Middle Tools: Undo/Redo, Zoom Controls */}
      {pdfBytes && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-glass-card)', padding: '3px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <button
            className="btn-icon"
            onClick={undo}
            disabled={!canUndo}
            style={{ opacity: canUndo ? 1 : 0.4 }}
            title="Hoàn tác (Ctrl+Z)"
          >
            <RotateCcw size={15} />
          </button>
          <button
            className="btn-icon"
            onClick={redo}
            disabled={!canRedo}
            style={{ opacity: canRedo ? 1 : 0.4 }}
            title="Làm lại (Ctrl+Y)"
          >
            <RotateCw size={15} />
          </button>

          <div style={{ width: '1px', height: '16px', background: 'var(--border-color)', margin: '0 2px' }} />

          <button
            className="btn-icon"
            onClick={() => setScale((s) => Math.max(0.4, s - 0.15))}
            title="Thu nhỏ (-)"
          >
            <ZoomOut size={15} />
          </button>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, minWidth: '38px', textAlign: 'center' }}>
            {Math.round(scale * 100)}%
          </span>
          <button
            className="btn-icon"
            onClick={() => setScale((s) => Math.min(3.0, s + 0.15))}
            title="Phóng to (+)"
          >
            <ZoomIn size={15} />
          </button>
          <button
            className="btn-icon"
            onClick={() => setScale(1.1)}
            title="Khôi phục kích thước"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      )}

      {/* Right Tools - Stirling-PDF Features */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {pdfBytes && (
          <>
            <button
              className="btn btn-secondary"
              style={{ padding: '5px 10px', fontSize: '0.75rem' }}
              onClick={() => setActiveModal('metadata')}
              title="Chỉnh sửa Metadata PDF (Tiêu đề, Tác giả, Từ khóa)"
            >
              <FileText size={14} color="#6366f1" />
              Metadata
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '5px 10px', fontSize: '0.75rem' }}
              onClick={() => setActiveModal('nup')}
              title="Ghép 2-up hoặc 4-up trang vào 1 tờ"
            >
              <LayoutGrid size={14} color="#06b6d4" />
              Ghép N-Up
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '5px 10px', fontSize: '0.75rem' }}
              onClick={() => setActiveModal('page-matrix')}
              title="Lọc trang chẵn/lẻ & Đảo ngược thứ tự trang"
            >
              <ArrowDownUp size={14} color="#10b981" />
              Lọc Trang
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '5px 10px', fontSize: '0.75rem' }}
              onClick={() => setActiveModal('split-merge')}
              title="Gộp hoặc Tách file PDF"
            >
              <Layers size={14} />
              Gộp/Tách
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '5px 10px', fontSize: '0.75rem' }}
              onClick={() => setActiveModal('compress')}
              title="Nén dung lượng PDF"
            >
              <Archive size={14} />
              Nén
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '5px 10px', fontSize: '0.75rem' }}
              onClick={() => setActiveModal('security')}
              title="Khóa mật khẩu bảo mật PDF"
            >
              <Lock size={14} />
              Khóa
            </button>
            <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={handleExport}>
              <Download size={15} />
              Xuất PDF
            </button>
          </>
        )}

        <button className="btn-icon" onClick={toggleTheme} title="Đổi giao diện Sáng / Tối">
          {theme === 'dark' ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} color="#6366f1" />}
        </button>
      </div>
    </header>
  );
};
