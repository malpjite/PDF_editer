import React, { useState, useRef } from 'react';
import { usePDF } from '../context/PDFContext';
import { PDFDocument } from 'pdf-lib';
import { X, Layers, FilePlus, Download } from 'lucide-react';

export const SplitMergeModal: React.FC = () => {
  const { activeModal, setActiveModal, pdfBytes, fileName, loadBytes, pageOrder, deletedPages } = usePDF();
  const [activeTab, setActiveTab] = useState<'merge' | 'split'>('merge');
  const [splitRange, setSplitRange] = useState('1-3');
  const [isProcessing, setIsProcessing] = useState(false);
  const mergeFileInputRef = useRef<HTMLInputElement>(null);

  if (activeModal !== 'split-merge' || !pdfBytes) return null;

  const handleMergeFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsProcessing(true);

    try {
      const mergedPdf = await PDFDocument.load(pdfBytes);

      for (let i = 0; i < e.target.files.length; i++) {
        const extraFile = e.target.files[i];
        const extraBuffer = await extraFile.arrayBuffer();
        const extraPdf = await PDFDocument.load(extraBuffer);

        const copiedPages = await mergedPdf.copyPages(extraPdf, extraPdf.getPageIndices());
        copiedPages.forEach((p) => mergedPdf.addPage(p));
      }

      const mergedBytes = await mergedPdf.save();
      await loadBytes(mergedBytes, 'Merged_' + fileName);
      alert('Đã gộp file PDF mới thành công!');
      setActiveModal(null);
    } catch (err) {
      console.error('Merge error:', err);
      alert('Không thể gộp PDF: ' + err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSplitPdf = async () => {
    setIsProcessing(true);
    try {
      const doc = await PDFDocument.load(pdfBytes);
      const newDoc = await PDFDocument.create();

      const activePages = pageOrder.filter((idx) => !deletedPages.has(idx));
      const targetIndices: number[] = [];

      const parts = splitRange.split(',');
      parts.forEach((p) => {
        const trimmed = p.trim();
        if (trimmed.includes('-')) {
          const [start, end] = trimmed.split('-').map(Number);
          for (let i = start; i <= end; i++) {
            if (i >= 1 && i <= activePages.length) {
              targetIndices.push(activePages[i - 1]);
            }
          }
        } else {
          const idx = Number(trimmed);
          if (idx >= 1 && idx <= activePages.length) {
            targetIndices.push(activePages[idx - 1]);
          }
        }
      });

      if (targetIndices.length === 0) {
        alert('Phạm vi trang không hợp lệ. Vui lòng nhập dạng 1-3, 5.');
        setIsProcessing(false);
        return;
      }

      const copied = await newDoc.copyPages(doc, targetIndices);
      copied.forEach((p) => newDoc.addPage(p));

      const splitBytes = await newDoc.save();
      const blob = new Blob([splitBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `extracted_pages_${fileName}`;
      link.click();
      URL.revokeObjectURL(url);

      setActiveModal(null);
    } catch (err) {
      console.error('Split error:', err);
      alert('Không thể tách trang PDF: ' + err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>📚 Gộp & Tách File PDF</h3>
          <button className="btn-icon" onClick={() => setActiveModal(null)}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
          <button
            className={`btn ${activeTab === 'merge' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, fontSize: '0.85rem' }}
            onClick={() => setActiveTab('merge')}
          >
            <FilePlus size={16} />
            Gộp File PDF
          </button>
          <button
            className={`btn ${activeTab === 'split' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, fontSize: '0.85rem' }}
            onClick={() => setActiveTab('split')}
          >
            <Layers size={16} />
            Tách Trang PDF
          </button>
        </div>

        {activeTab === 'merge' ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Thêm một hoặc nhiều file PDF khác để gộp nối tiếp vào file hiện tại.
            </p>
            <input
              type="file"
              ref={mergeFileInputRef}
              accept="application/pdf"
              multiple
              style={{ display: 'none' }}
              onChange={handleMergeFiles}
            />
            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px' }}
              onClick={() => mergeFileInputRef.current?.click()}
              disabled={isProcessing}
            >
              <FilePlus size={18} />
              {isProcessing ? 'Đang xử lý gộp file...' : 'Chọn File PDF Để Gộp'}
            </button>
          </div>
        ) : (
          <div style={{ padding: '12px 0' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Nhập thứ tự các trang muốn trích xuất ra file PDF mới (ví dụ: 1-3, 5):
            </p>
            <input
              type="text"
              value={splitRange}
              onChange={(e) => setSplitRange(e.target.value)}
              placeholder="Ví dụ: 1-4 hoặc 1, 3, 5"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                outline: 'none',
                marginBottom: '16px',
              }}
            />
            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px' }}
              onClick={handleSplitPdf}
              disabled={isProcessing}
            >
              <Download size={18} />
              {isProcessing ? 'Đang tách file...' : 'Tải File PDF Sau Khi Tách'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
