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
        pageNumbering
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
    <header className="glass-panel" style={{ height: 'var(--header-height)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', zIndex: 100 }}>
      {/* Brand & File Upload */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--accent-glow)',
            }}
          >
            <Sparkles size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>
              OmniPDF Studio
            </h1>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Ultra-Modern PDF Editor
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
          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
        >
          <Upload size={15} />
          {pdfBytes ? 'Đổi File' : 'Mở File PDF'}
        </button>

        {pdfBytes && (
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            📄 {fileName}
          </span>
        )}
      </div>

      {/* Middle Tools: Undo/Redo, Zoom Controls */}
      {pdfBytes && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-glass-card)', padding: '4px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <button
            className="btn-icon"
            onClick={undo}
            disabled={!canUndo}
            style={{ opacity: canUndo ? 1 : 0.4 }}
            title="Hoàn tác (Ctrl+Z)"
          >
            <RotateCcw size={16} />
          </button>
          <button
            className="btn-icon"
            onClick={redo}
            disabled={!canRedo}
            style={{ opacity: canRedo ? 1 : 0.4 }}
            title="Làm lại (Ctrl+Y)"
          >
            <RotateCw size={16} />
          </button>

          <div style={{ width: '1px', height: '18px', background: 'var(--border-color)', margin: '0 4px' }} />

          <button
            className="btn-icon"
            onClick={() => setScale((s) => Math.max(0.4, s - 0.15))}
            title="Thu nhỏ (-)"
          >
            <ZoomOut size={16} />
          </button>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, minWidth: '42px', textAlign: 'center' }}>
            {Math.round(scale * 100)}%
          </span>
          <button
            className="btn-icon"
            onClick={() => setScale((s) => Math.min(3.0, s + 0.15))}
            title="Phóng to (+)"
          >
            <ZoomIn size={16} />
          </button>
          <button
            className="btn-icon"
            onClick={() => setScale(1.1)}
            title="Khôi phục kích thước ban đầu"
          >
            <Maximize2 size={15} />
          </button>
        </div>
      )}

      {/* Right Tools */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {pdfBytes && (
          <>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              onClick={() => setActiveModal('split-merge')}
              title="Gộp hoặc Tách file PDF"
            >
              <Layers size={15} />
              Gộp / Tách
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              onClick={() => setActiveModal('compress')}
              title="Nén dung lượng file PDF"
            >
              <Archive size={15} />
              Nén
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              onClick={() => setActiveModal('security')}
              title="Khóa mật khẩu bảo mật PDF"
            >
              <Lock size={15} />
              Bảo mật
            </button>
            <button className="btn btn-primary" onClick={handleExport}>
              <Download size={16} />
              Xuất PDF
            </button>
          </>
        )}

        <button className="btn-icon" onClick={toggleTheme} title="Đổi giao diện Sáng / Tối">
          {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
        </button>
      </div>
    </header>
  );
};
