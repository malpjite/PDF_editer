import React, { useState } from 'react';
import { usePDF } from '../context/PDFContext';
import { FileText, X, Check } from 'lucide-react';

export const MetadataModal: React.FC = () => {
  const { metadata, setMetadata, setActiveModal } = usePDF();

  const [title, setTitle] = useState(metadata.title || '');
  const [author, setAuthor] = useState(metadata.author || '');
  const [subject, setSubject] = useState(metadata.subject || '');
  const [keywords, setKeywords] = useState(metadata.keywords || '');
  const [creator, setCreator] = useState(metadata.creator || 'OmniPDF Studio');

  const handleSave = () => {
    setMetadata({
      title,
      author,
      subject,
      keywords,
      creator,
    });
    alert('Đã cập nhật thông tin Metadata PDF!');
    setActiveModal(null);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animate-scale-up" style={{ maxWidth: '500px', width: '90%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'var(--gradient-primary)', padding: '8px', borderRadius: 'var(--radius-md)', color: '#fff' }}>
              <FileText size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Chỉnh Sửa Metadata PDF</h3>
          </div>
          <button className="btn-icon" onClick={() => setActiveModal(null)}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Tiêu đề PDF (Title):</label>
            <input type="text" className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Tác giả (Author):</label>
            <input type="text" className="input-field" value={author} onChange={(e) => setAuthor(e.target.value)} />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Chủ đề (Subject):</label>
            <input type="text" className="input-field" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Từ khóa (Keywords):</label>
            <input type="text" className="input-field" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Phân cách bằng dấu phẩy..." />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Ứng dụng tạo (Creator):</label>
            <input type="text" className="input-field" value={creator} onChange={(e) => setCreator(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>
            Hủy
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            <Check size={16} /> Lưu Metadata
          </button>
        </div>
      </div>
    </div>
  );
};
