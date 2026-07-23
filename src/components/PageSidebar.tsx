import React, { useEffect, useRef, useState } from 'react';
import { usePDF } from '../context/PDFContext';
import {
  RotateCcw,
  RotateCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoveUp,
  MoveDown,
  Layers,
  Plus,
  Copy,
  Download,
} from 'lucide-react';

interface ThumbnailProps {
  origIndex: number;
  displayIndex: number;
  isSelected: boolean;
  onSelect: () => void;
}

const ThumbnailCard: React.FC<ThumbnailProps> = ({ origIndex, displayIndex, isSelected, onSelect }) => {
  const { pdfDocument, pageRotations, rotatePage, deletePage, reorderPage, pageOrder, duplicatePage } = usePDF();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const rotation = pageRotations[origIndex] || 0;

  useEffect(() => {
    let isCancelled = false;

    const renderThumbnail = async () => {
      if (!pdfDocument || !canvasRef.current) return;
      try {
        const page = await pdfDocument.getPage(origIndex + 1);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale: 0.25, rotation });
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await (page as any).render({ canvasContext: ctx, viewport, canvas }).promise;
      } catch (e) {
        console.error('Thumbnail render error:', e);
      }
    };

    renderThumbnail();
    return () => {
      isCancelled = true;
    };
  }, [pdfDocument, origIndex, rotation]);

  return (
    <div
      onClick={onSelect}
      className={`glass-card ${isSelected ? 'active' : ''}`}
      style={{
        padding: '8px',
        position: 'relative',
        cursor: 'pointer',
        border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
        boxShadow: isSelected ? 'var(--accent-glow)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-glass-card)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
          Trang {displayIndex + 1}
        </span>
        <div style={{ display: 'flex', gap: '2px' }}>
          <button
            className="btn-icon"
            style={{ padding: '2px' }}
            onClick={(e) => {
              e.stopPropagation();
              rotatePage(origIndex, -90);
            }}
            title="Xoay trái 90°"
          >
            <RotateCcw size={12} />
          </button>
          <button
            className="btn-icon"
            style={{ padding: '2px' }}
            onClick={(e) => {
              e.stopPropagation();
              rotatePage(origIndex, 90);
            }}
            title="Xoay phải 90°"
          >
            <RotateCw size={12} />
          </button>
          <button
            className="btn-icon"
            style={{ padding: '2px', color: 'var(--accent-primary)' }}
            onClick={(e) => {
              e.stopPropagation();
              duplicatePage(displayIndex);
            }}
            title="Nhân bản trang này"
          >
            <Copy size={12} />
          </button>
          <button
            className="btn-icon"
            style={{ padding: '2px', color: 'var(--danger)' }}
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Bạn có chắc muốn xóa Trang ${displayIndex + 1}?`)) {
                deletePage(origIndex);
              }
            }}
            title="Xóa trang này"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div
        style={{
          width: '100%',
          height: '140px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1e293b',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
        }}
      >
        <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
      </div>

      <div style={{ display: 'flex', gap: '4px', width: '100%', justifyContent: 'center' }}>
        <button
          className="btn-icon"
          style={{ padding: '2px 6px', fontSize: '0.65rem' }}
          disabled={displayIndex === 0}
          onClick={(e) => {
            e.stopPropagation();
            reorderPage(displayIndex, displayIndex - 1);
          }}
          title="Chuyển lên trước"
        >
          <MoveUp size={12} />
        </button>
        <button
          className="btn-icon"
          style={{ padding: '2px 6px', fontSize: '0.65rem' }}
          disabled={displayIndex === pageOrder.length - 1}
          onClick={(e) => {
            e.stopPropagation();
            reorderPage(displayIndex, displayIndex + 1);
          }}
          title="Chuyển xuống sau"
        >
          <MoveDown size={12} />
        </button>
      </div>
    </div>
  );
};

export const PageSidebar: React.FC = () => {
  const { pageOrder, deletedPages, currentPage, setCurrentPage, insertBlankPage, extractSelectedPages, fileName } = usePDF();
  const [collapsed, setCollapsed] = useState(false);

  const activePages = pageOrder.filter((origIdx) => !deletedPages.has(origIdx));

  const handleExtractCurrent = async () => {
    const bytes = await extractSelectedPages([currentPage - 1]);
    if (bytes) {
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Trang_${currentPage}_${fileName}`;
      a.click();
    }
  };

  if (collapsed) {
    return (
      <div
        className="glass-panel"
        style={{
          width: '40px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '12px',
        }}
      >
        <button className="btn-icon" onClick={() => setCollapsed(false)} title="Mở danh sách trang">
          <ChevronRight size={18} />
        </button>
      </div>
    );
  }

  return (
    <aside
      className="glass-panel"
      style={{
        width: 'var(--sidebar-width)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 80,
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={16} color="var(--accent-primary)" />
          <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>Trang ({activePages.length})</span>
        </div>
        <button className="btn-icon" onClick={() => setCollapsed(true)} title="Thu gọn">
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* Quick Action Bar */}
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          gap: '6px',
          justifyContent: 'center',
        }}
      >
        <button
          className="btn btn-secondary"
          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
          onClick={() => insertBlankPage(currentPage)}
          title="Chèn trang trắng sau trang hiện tại"
        >
          <Plus size={12} /> Thêm Trang
        </button>

        <button
          className="btn btn-secondary"
          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
          onClick={handleExtractCurrent}
          title="Tách trang hiện tại thành PDF riêng"
        >
          <Download size={12} /> Tách Trang
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {activePages.map((origIdx, displayIdx) => (
          <ThumbnailCard
            key={origIdx + '_' + displayIdx}
            origIndex={origIdx}
            displayIndex={displayIdx}
            isSelected={currentPage === displayIdx + 1}
            onSelect={() => setCurrentPage(displayIdx + 1)}
          />
        ))}
      </div>
    </aside>
  );
};
