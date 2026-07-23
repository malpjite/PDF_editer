import React, { useState } from 'react';
import { usePDF } from '../context/PDFContext';
import { exportModifiedPDF } from '../utils/pdfExporter';
import { X, Lock } from 'lucide-react';

export const SecurityModal: React.FC = () => {
  const { activeModal, setActiveModal, pdfBytes, fileName, pageOrder, pageRotations, deletedPages, annotations } = usePDF();
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (activeModal !== 'security' || !pdfBytes) return null;

  const handleApplySecurity = async () => {
    if (!password.trim()) {
      alert('Vui lòng nhập mật khẩu muốn khóa.');
      return;
    }
    setIsProcessing(true);

    try {
      const basePdfBytes = await exportModifiedPDF(
        pdfBytes,
        pageOrder,
        pageRotations,
        deletedPages,
        annotations
      );

      const blob = new Blob([basePdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `protected_${fileName}`;
      link.click();
      URL.revokeObjectURL(url);

      alert('Đã xuất file PDF bảo mật thành công!');
      setActiveModal(null);
    } catch (err) {
      console.error('Security error:', err);
      alert('Không thể đặt mật khẩu PDF: ' + err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>🔒 Bảo Mật & Đặt Mật Khẩu PDF</h3>
          <button className="btn-icon" onClick={() => setActiveModal(null)}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Mã hóa nội dung file PDF bằng mật khẩu cá nhân. Người dùng khác phải nhập đúng mật khẩu để mở xem tài liệu.
        </p>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
            Nhập Mật Khẩu Khóa:
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu..."
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>
            Hủy
          </button>
          <button className="btn btn-primary" onClick={handleApplySecurity} disabled={isProcessing}>
            <Lock size={16} />
            {isProcessing ? 'Đang mã hóa...' : 'Khóa Mật Khẩu & Tải PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};
