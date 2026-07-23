import React, { useRef } from 'react';
import { usePDF } from '../context/PDFContext';
import {
  MousePointer,
  Type,
  PenTool,
  Highlighter,
  Square,
  Circle as CircleIcon,
  ArrowUpRight,
  ShieldAlert,
  Signature,
  Stamp,
  Image as ImageIcon,
  Eraser,
  Sliders,
  Sparkles,
  Shield,
  Hash,
} from 'lucide-react';

export const Toolbar: React.FC = () => {
  const { activeTool, setActiveTool, toolOptions, setToolOptions, setActiveModal, addAnnotation, currentPage, pageOrder } = usePDF();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const colors = [
    '#6366f1', // Indigo
    '#ef4444', // Red
    '#10b981', // Green
    '#f59e0b', // Amber
    '#06b6d4', // Cyan
    '#ec4899', // Pink
    '#000000', // Black
    '#ffffff', // White
  ];

  const strokeWidths = [1, 3, 5, 8, 12];

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          const img = new Image();
          img.onload = () => {
            const originalPageIndex = pageOrder[currentPage - 1] ?? 0;
            const aspect = img.width / img.height;
            const annWidth = Math.min(200, img.width);
            const annHeight = annWidth / aspect;

            addAnnotation(originalPageIndex, {
              id: 'img_' + Date.now(),
              pageIndex: originalPageIndex,
              type: 'image',
              x: 100,
              y: 100,
              width: annWidth,
              height: annHeight,
              dataUrl: evt.target!.result as string,
              aspectRatio: aspect,
            });
            setActiveTool('select');
          };
          img.src = evt.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 90 }}>
      {/* Primary Floating Toolbar */}
      <div
        className="glass-panel"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: 'var(--radius-full)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Select Pointer */}
        <button
          className={`btn-icon ${activeTool === 'select' ? 'active' : ''}`}
          onClick={() => setActiveTool('select')}
          title="Con trỏ Chọn & Di chuyển (Select)"
        >
          <MousePointer size={18} />
        </button>

        <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 2px' }} />

        {/* OCR Quét chữ AI */}
        <button
          className="btn-icon"
          onClick={() => setActiveModal('ocr')}
          title="Quét OCR & Chỉnh Sửa Chữ Ảnh (Tesseract AI)"
          style={{ background: 'var(--gradient-primary)', color: '#fff', borderRadius: '50%' }}
        >
          <Sparkles size={18} />
        </button>

        <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 2px' }} />

        {/* Text */}
        <button
          className={`btn-icon ${activeTool === 'text' ? 'active' : ''}`}
          onClick={() => setActiveTool('text')}
          title="Thêm Văn Bản (Text)"
        >
          <Type size={18} />
        </button>

        {/* Draw Pen */}
        <button
          className={`btn-icon ${activeTool === 'draw' ? 'active' : ''}`}
          onClick={() => setActiveTool('draw')}
          title="Bút vẽ tự do (Pen)"
        >
          <PenTool size={18} />
        </button>

        {/* Highlight */}
        <button
          className={`btn-icon ${activeTool === 'highlight' ? 'active' : ''}`}
          onClick={() => setActiveTool('highlight')}
          title="Bút Dạ Quang Highlight"
        >
          <Highlighter size={18} color={toolOptions.color} />
        </button>

        <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 2px' }} />

        {/* Shapes */}
        <button
          className={`btn-icon ${activeTool === 'rectangle' ? 'active' : ''}`}
          onClick={() => setActiveTool('rectangle')}
          title="Vẽ Hình Chữ Nhật"
        >
          <Square size={18} />
        </button>

        <button
          className={`btn-icon ${activeTool === 'circle' ? 'active' : ''}`}
          onClick={() => setActiveTool('circle')}
          title="Vẽ Hình Tròn / Elip"
        >
          <CircleIcon size={18} />
        </button>

        <button
          className={`btn-icon ${activeTool === 'arrow' ? 'active' : ''}`}
          onClick={() => setActiveTool('arrow')}
          title="Vẽ Mũi Tên Chỉ Dẫn"
        >
          <ArrowUpRight size={18} />
        </button>

        <button
          className={`btn-icon ${activeTool === 'whiteout' ? 'active' : ''}`}
          onClick={() => setActiveTool('whiteout')}
          title="Xóa Che Phủ (Redaction / Whiteout)"
        >
          <ShieldAlert size={18} color="#ef4444" />
        </button>

        <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 2px' }} />

        {/* Digital Signature */}
        <button
          className="btn-icon"
          onClick={() => setActiveModal('signature')}
          title="Chèn Chữ Ký Tay (Digital Signature)"
        >
          <Signature size={18} color="#6366f1" />
        </button>

        {/* Stamp */}
        <button
          className="btn-icon"
          onClick={() => setActiveModal('stamp')}
          title="Đóng Tem Duyệt"
        >
          <Stamp size={18} color="#10b981" />
        </button>

        {/* Watermark */}
        <button
          className="btn-icon"
          onClick={() => setActiveModal('watermark')}
          title="Đóng Dấu Chống Sao Chép (Watermark)"
        >
          <Shield size={18} color="#f59e0b" />
        </button>

        {/* Page Numbers */}
        <button
          className="btn-icon"
          onClick={() => setActiveModal('page-number')}
          title="Đánh Số Trang Tự Động"
        >
          <Hash size={18} color="#06b6d4" />
        </button>

        {/* Insert Image */}
        <input
          type="file"
          ref={imageInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageSelect}
        />
        <button
          className="btn-icon"
          onClick={() => imageInputRef.current?.click()}
          title="Chèn Hình Ảnh (PNG/JPG)"
        >
          <ImageIcon size={18} />
        </button>

        {/* Eraser */}
        <button
          className={`btn-icon ${activeTool === 'eraser' ? 'active' : ''}`}
          onClick={() => setActiveTool('eraser')}
          title="Cục Tẩy Chú Thích"
        >
          <Eraser size={18} />
        </button>
      </div>

      {/* Secondary Tool Option Controls */}
      {activeTool !== 'select' && activeTool !== 'eraser' && (
        <div
          className="glass-panel"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '4px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8rem',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {/* Color palette */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setToolOptions((prev) => ({ ...prev, color: c }))}
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: c,
                  border: toolOptions.color === c ? '2px solid #fff' : '1px solid rgba(0,0,0,0.2)',
                  boxShadow: toolOptions.color === c ? '0 0 6px ' + c : 'none',
                  cursor: 'pointer',
                }}
              />
            ))}
            <input
              type="color"
              value={toolOptions.color}
              onChange={(e) => setToolOptions((prev) => ({ ...prev, color: e.target.value }))}
              style={{ width: '22px', height: '22px', border: 'none', background: 'none', cursor: 'pointer' }}
            />
          </div>

          <div style={{ width: '1px', height: '14px', background: 'var(--border-color)' }} />

          {/* Stroke Width / Font Size */}
          {activeTool === 'text' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Cỡ chữ:</span>
              <select
                value={toolOptions.fontSize}
                onChange={(e) => setToolOptions((prev) => ({ ...prev, fontSize: Number(e.target.value) }))}
                style={{
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '0.75rem',
                }}
              >
                {[12, 14, 16, 18, 20, 24, 28, 36, 48, 72].map((sz) => (
                  <option key={sz} value={sz}>
                    {sz}px
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sliders size={14} color="var(--text-secondary)" />
              <div style={{ display: 'flex', gap: '4px' }}>
                {strokeWidths.map((w) => (
                  <button
                    key={w}
                    onClick={() => setToolOptions((prev) => ({ ...prev, strokeWidth: w }))}
                    style={{
                      padding: '2px 6px',
                      fontSize: '0.7rem',
                      borderRadius: '4px',
                      background: toolOptions.strokeWidth === w ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                      color: toolOptions.strokeWidth === w ? '#fff' : 'var(--text-secondary)',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer',
                    }}
                  >
                    {w}px
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
