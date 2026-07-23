import React, { useState } from 'react';
import { usePDF } from '../context/PDFContext';
import { X, Check } from 'lucide-react';

export const StampModal: React.FC = () => {
  const { activeModal, setActiveModal, addAnnotation, currentPage, pageOrder } = usePDF();
  const [customText, setCustomText] = useState('ĐÃ KÝ DUYỆT');
  const [stampColor, setStampColor] = useState('#10b981');

  if (activeModal !== 'stamp') return null;

  const presetStamps = [
    { text: 'APPROVED', color: '#10b981' },
    { text: 'CONFIDENTIAL', color: '#ef4444' },
    { text: 'DRAFT', color: '#f59e0b' },
    { text: 'FINAL', color: '#3b82f6' },
    { text: 'REJECTED', color: '#dc2626' },
    { text: 'URGENT', color: '#ea580c' },
    { text: 'ĐÃ DUYỆT', color: '#10b981' },
    { text: 'BẢO MẬT', color: '#b91c1c' },
  ];

  const applyStamp = (text: string, color: string) => {
    const originalPageIndex = pageOrder[currentPage - 1] ?? 0;
    addAnnotation(originalPageIndex, {
      id: 'stamp_' + Date.now(),
      pageIndex: originalPageIndex,
      type: 'stamp',
      x: 140,
      y: 140,
      width: 160,
      height: 54,
      text,
      color,
      stampStyle: 'approved',
    });
    setActiveModal(null);
  };

  return (
    <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>💮 Chọn Tem Duyệt / Watermark</h3>
          <button className="btn-icon" onClick={() => setActiveModal(null)}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
          {presetStamps.map((st) => (
            <button
              key={st.text}
              onClick={() => applyStamp(st.text, st.color)}
              className="glass-card"
              style={{
                padding: '12px',
                border: `2px double ${st.color}`,
                color: st.color,
                fontWeight: 800,
                fontSize: '1rem',
                letterSpacing: '1px',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'center',
                transform: 'rotate(-4deg)',
              }}
            >
              {st.text}
            </button>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Tạo Tem Tùy Chỉnh:</span>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Nhập nội dung tem..."
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
            <input
              type="color"
              value={stampColor}
              onChange={(e) => setStampColor(e.target.value)}
              style={{ width: '38px', height: '38px', border: 'none', background: 'none', cursor: 'pointer' }}
            />
            <button className="btn btn-primary" onClick={() => applyStamp(customText, stampColor)}>
              <Check size={16} />
              Đóng Tem
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
