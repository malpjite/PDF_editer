import React from 'react';
import { usePDF } from '../context/PDFContext';
import { Layers, X, ArrowDownUp } from 'lucide-react';

export const PageMatrixModal: React.FC = () => {
  const { reversePageOrder, filterEvenOddPages, setActiveModal, pageOrder } = usePDF();

  const handleReverse = () => {
    reversePageOrder();
    alert('Đã đảo ngược thứ tự toàn bộ các trang PDF!');
    setActiveModal(null);
  };

  const handleFilterEven = () => {
    filterEvenOddPages('even');
    alert('Đã lọc giữ lại các trang Chẵn (2, 4, 6...)!');
    setActiveModal(null);
  };

  const handleFilterOdd = () => {
    filterEvenOddPages('odd');
    alert('Đã lọc giữ lại các trang Lẻ (1, 3, 5...)!');
    setActiveModal(null);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animate-scale-up" style={{ maxWidth: '480px', width: '90%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'var(--gradient-primary)', padding: '8px', borderRadius: 'var(--radius-md)', color: '#fff' }}>
              <ArrowDownUp size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Ma Trận Lọc & Đảo Trang PDF</h3>
          </div>
          <button className="btn-icon" onClick={() => setActiveModal(null)}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.88rem', opacity: 0.8, marginBottom: '16px' }}>
          Công cụ lọc và đảo thứ tự hàng loạt trang lấy cảm hứng từ Stirling-PDF cho {pageOrder.length} trang:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <button className="btn btn-secondary" style={{ padding: '12px', justifyContent: 'flex-start' }} onClick={handleReverse}>
            <ArrowDownUp size={18} color="var(--accent-primary)" />
            <span>Đảo Ngược Thứ Tự Trang (Trang Cuối ➔ Trang Đầu)</span>
          </button>

          <button className="btn btn-secondary" style={{ padding: '12px', justifyContent: 'flex-start' }} onClick={handleFilterOdd}>
            <Layers size={18} color="#10b981" />
            <span>Chỉ Giữ Lại Trang Lẻ (Trang 1, 3, 5, 7...)</span>
          </button>

          <button className="btn btn-secondary" style={{ padding: '12px', justifyContent: 'flex-start' }} onClick={handleFilterEven}>
            <Layers size={18} color="#06b6d4" />
            <span>Chỉ Giữ Lại Trang Chẵn (Trang 2, 4, 6, 8...)</span>
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
