import React, { useState } from 'react';
import { usePDF } from '../context/PDFContext';
import { Hash, X, Check } from 'lucide-react';
import type { PageNumberOptions } from '../types/pdf';

export const PageNumberModal: React.FC = () => {
  const { pageNumbering, setPageNumbering, setActiveModal } = usePDF();

  const [format, setFormat] = useState<PageNumberOptions['format']>(pageNumbering?.format || 'Trang X / Y');
  const [position, setPosition] = useState<PageNumberOptions['position']>(pageNumbering?.position || 'bottom-center');
  const [fontSize, setFontSize] = useState<number>(pageNumbering?.fontSize || 12);
  const [color, setColor] = useState<string>(pageNumbering?.color || '#374151');
  const [startNumber, setStartNumber] = useState<number>(pageNumbering?.startNumber || 1);

  const handleApply = () => {
    setPageNumbering({
      format,
      position,
      fontSize,
      color,
      startNumber,
    });
    setActiveModal(null);
  };

  const handleRemove = () => {
    setPageNumbering(null);
    setActiveModal(null);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animate-scale-up" style={{ maxWidth: '480px', width: '90%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'var(--gradient-primary)', padding: '8px', borderRadius: 'var(--radius-md)', color: '#fff' }}>
              <Hash size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Đánh Số Trang Tự Động</h3>
          </div>
          <button className="btn-icon" onClick={() => setActiveModal(null)}>
            <X size={20} />
          </button>
        </div>

        {/* Format Select */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Định dạng số trang:</label>
          <select className="input-field" value={format} onChange={(e) => setFormat(e.target.value as any)}>
            <option value="Trang X / Y">Trang X / Y (Ví dụ: Trang 1 / 10)</option>
            <option value="Page X of Y">Page X of Y (Ví dụ: Page 1 of 10)</option>
            <option value="Page X">Page X (Ví dụ: Page 1)</option>
            <option value="X">X (Chỉ số: 1, 2, 3...)</option>
          </select>
        </div>

        {/* Position Select */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Vị trí hiển thị trên trang:</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[
              { id: 'top-left', label: 'Trên - Trái' },
              { id: 'top-center', label: 'Trên - Giữa' },
              { id: 'top-right', label: 'Trên - Phải' },
              { id: 'bottom-left', label: 'Dưới - Trái' },
              { id: 'bottom-center', label: 'Dưới - Giữa' },
              { id: 'bottom-right', label: 'Dưới - Phải' },
            ].map((pos) => (
              <button
                key={pos.id}
                className={`btn ${position === pos.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '8px 4px' }}
                onClick={() => setPosition(pos.id as any)}
              >
                {pos.label}
              </button>
            ))}
          </div>
        </div>

        {/* Style Options */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Cỡ chữ:</label>
            <input
              type="number"
              className="input-field"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Bắt đầu từ số:</label>
            <input
              type="number"
              className="input-field"
              value={startNumber}
              onChange={(e) => setStartNumber(Number(e.target.value))}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Màu chữ:</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{ width: '100%', height: '36px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
          {pageNumbering ? (
            <button className="btn btn-secondary" style={{ color: '#ef4444' }} onClick={handleRemove}>
              Xóa Số Trang
            </button>
          ) : <div />}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>
              Hủy
            </button>
            <button className="btn btn-primary" onClick={handleApply}>
              <Check size={16} /> Áp Dụng Đánh Số Trang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
