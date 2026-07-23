import React, { useState } from 'react';
import { usePDF } from '../context/PDFContext';
import { LayoutGrid, X, Check, RefreshCw } from 'lucide-react';

export const NUpModal: React.FC = () => {
  const { applyNUpLayout, setActiveModal } = usePDF();
  const [pagesPerSheet, setPagesPerSheet] = useState<2 | 4>(2);
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    setLoading(true);
    await applyNUpLayout(pagesPerSheet);
    setLoading(false);
    setActiveModal(null);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animate-scale-up" style={{ maxWidth: '480px', width: '90%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'var(--gradient-primary)', padding: '8px', borderRadius: 'var(--radius-md)', color: '#fff' }}>
              <LayoutGrid size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Ghép Nhiều Trang Vào 1 Tờ (N-Up)</h3>
          </div>
          <button className="btn-icon" onClick={() => setActiveModal(null)}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.88rem', opacity: 0.8, marginBottom: '16px' }}>
          Tính năng độc đáo từ Stirling-PDF giúp ghép 2 hoặc 4 trang PDF thành 1 tờ A4 duy nhất để tiết kiệm giấy in ấn!
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <button
            className={`glass-card ${pagesPerSheet === 2 ? 'active' : ''}`}
            style={{
              padding: '16px',
              border: pagesPerSheet === 2 ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
              textAlign: 'center',
              cursor: 'pointer',
            }}
            onClick={() => setPagesPerSheet(2)}
          >
            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>2 Trang / Tờ (2-Up)</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Bố cục A4 Xoay Ngang (Landscape)</div>
          </button>

          <button
            className={`glass-card ${pagesPerSheet === 4 ? 'active' : ''}`}
            style={{
              padding: '16px',
              border: pagesPerSheet === 4 ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
              textAlign: 'center',
              cursor: 'pointer',
            }}
            onClick={() => setPagesPerSheet(4)}
          >
            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>4 Trang / Tờ (4-Up)</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Bố cục Dạng Lưới 2x2 (Portrait)</div>
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => setActiveModal(null)} disabled={loading}>
            Hủy
          </button>
          <button className="btn btn-primary" onClick={handleApply} disabled={loading}>
            {loading ? <RefreshCw className="spin" size={16} /> : <Check size={16} />}
            {loading ? 'Đang Xử Lý...' : 'Tạo Bố Cục N-Up'}
          </button>
        </div>
      </div>
    </div>
  );
};
