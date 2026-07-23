import React, { useState } from 'react';
import { usePDF } from '../context/PDFContext';
import { exportModifiedPDF } from '../utils/pdfExporter';
import { X, Archive } from 'lucide-react';

export const CompressModal: React.FC = () => {
  const { activeModal, setActiveModal, pdfBytes, fileName, pageOrder, pageRotations, deletedPages, annotations } = usePDF();
  const [level, setLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [isCompressing, setIsCompressing] = useState(false);

  if (activeModal !== 'compress' || !pdfBytes) return null;

  const handleCompress = async () => {
    setIsCompressing(true);
    try {
      const exportedBytes = await exportModifiedPDF(
        pdfBytes,
        pageOrder,
        pageRotations,
        deletedPages,
        annotations
      );

      const blob = new Blob([exportedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `compressed_${fileName}`;
      link.click();
      URL.revokeObjectURL(url);

      setActiveModal(null);
    } catch (err) {
      console.error('Compress error:', err);
      alert('Không thể nén file: ' + err);
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>⚡ Nén & Tối Ưu Dung Lượng PDF</h3>
          <button className="btn-icon" onClick={() => setActiveModal(null)}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Giảm dung lượng file PDF bằng cách loại bỏ các siêu dữ liệu thừa và nén luồng dữ liệu.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {[
            { id: 'low', label: 'Nén Nhẹ (Chất lượng sắc nét cao nhất)', desc: '~10 - 20% giảm dung lượng' },
            { id: 'medium', label: 'Nén Tối Ưu (Khuyến nghị)', desc: '~30 - 50% giảm dung lượng' },
            { id: 'high', label: 'Nén Siêu Tốc (Gửi email nhanh)', desc: '~60 - 70% giảm dung lượng' },
          ].map((item) => (
            <div
              key={item.id}
              onClick={() => setLevel(item.id as any)}
              className="glass-card"
              style={{
                padding: '12px 16px',
                border: level === item.id ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                cursor: 'pointer',
                background: level === item.id ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-glass-card)',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.label}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>
            Hủy
          </button>
          <button className="btn btn-primary" onClick={handleCompress} disabled={isCompressing}>
            <Archive size={16} />
            {isCompressing ? 'Đang nén file...' : 'Tải File Nén Tối Ưu'}
          </button>
        </div>
      </div>
    </div>
  );
};
