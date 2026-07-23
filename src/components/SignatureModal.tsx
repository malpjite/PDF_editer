import React, { useRef, useState } from 'react';
import { usePDF } from '../context/PDFContext';
import { X, Eraser, Check } from 'lucide-react';

export const SignatureModal: React.FC = () => {
  const { activeModal, setActiveModal, addAnnotation, currentPage, pageOrder } = usePDF();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [sigColor, setSigColor] = useState('#000000');
  const [hasDrawn, setHasDrawn] = useState(false);

  if (activeModal !== 'signature') return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasDrawn(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();

    ctx.strokeStyle = sigColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;
    const dataUrl = canvas.toDataURL('image/png');

    const originalPageIndex = pageOrder[currentPage - 1] ?? 0;
    addAnnotation(originalPageIndex, {
      id: 'sig_' + Date.now(),
      pageIndex: originalPageIndex,
      type: 'signature',
      x: 120,
      y: 120,
      width: 180,
      height: 90,
      dataUrl,
      aspectRatio: 2,
    });

    setActiveModal(null);
  };

  return (
    <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>✍️ Tạo Chữ Ký Điện Tử</h3>
          <button className="btn-icon" onClick={() => setActiveModal(null)}>
            <X size={18} />
          </button>
        </div>

        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Chọn màu mực:</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['#000000', '#1e40af', '#dc2626', '#166534'].map((c) => (
              <button
                key={c}
                onClick={() => setSigColor(c)}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: c,
                  border: sigColor === c ? '2px solid var(--accent-primary)' : 'none',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </div>

        <div
          style={{
            border: '2px dashed var(--border-color)',
            borderRadius: 'var(--radius-md)',
            background: '#ffffff',
            marginBottom: '16px',
            overflow: 'hidden',
          }}
        >
          <canvas
            ref={canvasRef}
            width={480}
            height={200}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            style={{ width: '100%', height: '200px', cursor: 'crosshair', display: 'block' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button className="btn btn-secondary" onClick={handleClear}>
            <Eraser size={16} />
            Xóa Làm Lai
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>
              Hủy
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={!hasDrawn}>
              <Check size={16} />
              Chèn Chữ Ký
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
