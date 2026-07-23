import React, { useState } from 'react';
import { usePDF } from '../context/PDFContext';
import { ShieldAlert, X, Check } from 'lucide-react';
import type { WatermarkOptions } from '../types/pdf';

export const WatermarkModal: React.FC = () => {
  const { watermark, setWatermark, setActiveModal } = usePDF();

  const [text, setText] = useState<string>(watermark?.text || 'BẢO MẬT - CONFIDENTIAL');
  const [fontSize, setFontSize] = useState<number>(watermark?.fontSize || 42);
  const [color, setColor] = useState<string>(watermark?.color || '#ef4444');
  const [opacity, setOpacity] = useState<number>(watermark?.opacity || 0.25);
  const [rotation, setRotation] = useState<number>(watermark?.rotation || -45);
  const [isTile, setIsTile] = useState<boolean>(watermark?.isTile || false);

  const presets = ['BẢO MẬT', 'CONFIDENTIAL', 'BẢN NHÁP', 'INTERNAL ONLY', 'DRAFT', 'CÔNG TY ABC'];

  const handleApply = () => {
    const opts: WatermarkOptions = {
      text,
      fontSize,
      color,
      opacity,
      rotation,
      isTile,
    };
    setWatermark(opts);
    setActiveModal(null);
  };

  const handleRemove = () => {
    setWatermark(null);
    setActiveModal(null);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animate-scale-up" style={{ maxWidth: '520px', width: '90%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'var(--gradient-primary)', padding: '8px', borderRadius: 'var(--radius-md)', color: '#fff' }}>
              <ShieldAlert size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Đóng Dấu Chống Sao Chép (Watermark)</h3>
          </div>
          <button className="btn-icon" onClick={() => setActiveModal(null)}>
            <X size={20} />
          </button>
        </div>

        {/* Text Input & Presets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Nội dung dấu (Watermark Text):</label>
          <input
            type="text"
            className="input-field"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nhập chữ dấu..."
          />
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {presets.map((p) => (
              <button
                key={p}
                className="btn btn-secondary"
                style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                onClick={() => setText(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Customization Sliders */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Cỡ chữ: {fontSize}px</label>
            <input
              type="range"
              min={18}
              max={96}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Độ mờ (Opacity): {Math.round(opacity * 100)}%</label>
            <input
              type="range"
              min={0.05}
              max={0.9}
              step={0.05}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Góc xoay: {rotation}°</label>
            <input
              type="range"
              min={-90}
              max={90}
              step={15}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Màu sắc:</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{ width: '100%', height: '32px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Checkbox tile */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" checked={isTile} onChange={(e) => setIsTile(e.target.checked)} />
            Phủ lặp toàn bộ trang (Tile Grid Watermark)
          </label>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
          {watermark ? (
            <button className="btn btn-secondary" style={{ color: '#ef4444' }} onClick={handleRemove}>
              Xóa Watermark
            </button>
          ) : <div />}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>
              Hủy
            </button>
            <button className="btn btn-primary" onClick={handleApply}>
              <Check size={16} /> Áp Dấu Lên PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
