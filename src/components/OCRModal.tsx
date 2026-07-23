import React, { useState } from 'react';
import { usePDF } from '../context/PDFContext';
import { createWorker } from 'tesseract.js';
import { Sparkles, X, Copy, Check, FileText, RefreshCw, Layers } from 'lucide-react';

export const OCRModal: React.FC = () => {
  const { pdfDocument, currentPage, pageOrder, addAnnotation, setActiveModal } = usePDF();
  const [lang, setLang] = useState<'vie' | 'eng' | 'vie+eng'>('vie+eng');
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [ocrBlocks, setOcrBlocks] = useState<any[]>([]);
  const [copied, setCopied] = useState<boolean>(false);

  const runOCR = async () => {
    if (!pdfDocument) return;
    setLoading(true);
    setProgress(0);
    setStatusText('Đang khởi tạo bộ nhận dạng Tesseract AI...');
    setExtractedText('');
    setOcrBlocks([]);

    try {
      const originalPageIndex = pageOrder[currentPage - 1] ?? (currentPage - 1);
      const page = await pdfDocument.getPage(originalPageIndex + 1);
      const viewport = page.getViewport({ scale: 2.0 }); // High resolution for accurate OCR

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      await (page as any).render({ canvasContext: ctx, viewport, canvas }).promise;
      const imageDataUrl = canvas.toDataURL('image/png');

      setStatusText('Đang tải mô hình nhận dạng ngôn ngữ...');
      const worker = await createWorker(lang as string, 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
            setStatusText(`Đang quét & nhận dạng văn bản: ${Math.round(m.progress * 100)}%`);
          } else {
            setStatusText(m.status);
          }
        },
      });

      const ret = await worker.recognize(imageDataUrl);
      setExtractedText(ret.data.text);
      setOcrBlocks((ret.data as any).words || []);
      await worker.terminate();

      setStatusText('Nhận dạng thành công!');
    } catch (err) {
      console.error('OCR error:', err);
      alert('Đã xảy ra lỗi khi quét OCR. Vui lòng thử lại.');
      setStatusText('Thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyEditableText = () => {
    if (ocrBlocks.length === 0) return;
    const originalPageIndex = pageOrder[currentPage - 1] ?? (currentPage - 1);

    // Group words into lines/blocks or apply word by word (scaled back to 1.0 viewport)
    // Canvas was rendered at scale 2.0
    ocrBlocks.forEach((word, idx) => {
      if (!word.text || word.text.trim().length === 0) return;
      const bbox = word.bbox;
      const scaleFactor = 0.5; // Scale down from 2.0 render
      const x = bbox.x0 * scaleFactor;
      const y = bbox.y0 * scaleFactor;
      const width = (bbox.x1 - bbox.x0) * scaleFactor;
      const height = (bbox.y1 - bbox.y0) * scaleFactor;

      // 1. Add whiteout annotation to cover original scanned text
      addAnnotation(originalPageIndex, {
        id: `ocr_whiteout_${Date.now()}_${idx}`,
        pageIndex: originalPageIndex,
        type: 'whiteout',
        x: x - 1,
        y: y - 1,
        width: width + 2,
        height: height + 2,
        strokeColor: '#ffffff',
        fillColor: '#ffffff',
        strokeWidth: 0,
        opacity: 1,
      });

      // 2. Add editable text annotation over original position
      addAnnotation(originalPageIndex, {
        id: `ocr_text_${Date.now()}_${idx}`,
        pageIndex: originalPageIndex,
        type: 'text',
        x,
        y,
        width: Math.max(width, 40),
        height: Math.max(height, 20),
        content: word.text,
        fontSize: Math.max(12, Math.round(height * 0.75)),
        fontFamily: 'Inter, sans-serif',
        color: '#000000',
      });
    });

    alert(`Đã chuyển đổi ${ocrBlocks.length} từ scan thành khối chữ có thể sửa trực tiếp!`);
    setActiveModal(null);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animate-scale-up" style={{ maxWidth: '650px', width: '90%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'var(--gradient-primary)', padding: '8px', borderRadius: 'var(--radius-md)', color: '#fff' }}>
              <Sparkles size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Quét OCR & Chỉnh Sửa Chữ Ảnh</h3>
          </div>
          <button className="btn-icon" onClick={() => setActiveModal(null)}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '16px' }}>
          Nhận dạng quang học (OCR) giúp đọc chữ từ trang PDF scan/ảnh và cho phép thay thế trực tiếp chữ ảnh bằng chữ có thể chỉnh sửa!
        </p>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Ngôn ngữ quét:</label>
          <select
            className="input-field"
            style={{ width: 'auto', padding: '6px 12px' }}
            value={lang}
            onChange={(e) => setLang(e.target.value as any)}
            disabled={loading}
          >
            <option value="vie+eng">Tiếng Việt + Tiếng Anh</option>
            <option value="vie">Chỉ Tiếng Việt</option>
            <option value="eng">Chỉ Tiếng Anh (English)</option>
          </select>

          <button className="btn btn-primary" onClick={runOCR} disabled={loading}>
            {loading ? <RefreshCw className="spin" size={16} /> : <Sparkles size={16} />}
            {loading ? 'Đang Quét AI...' : 'Bắt Đầu Quét Trang ' + currentPage}
          </button>
        </div>

        {/* Progress bar */}
        {loading && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
              <span>{statusText}</span>
              <span>{progress}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'var(--gradient-primary)', transition: 'width 0.3s linear' }} />
            </div>
          </div>
        )}

        {/* OCR Result text area */}
        {extractedText && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={16} /> Nội dung văn bản trích xuất được ({ocrBlocks.length} từ):
              </span>
              <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={handleCopyText}>
                {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                {copied ? 'Đã Sao Chép!' : 'Sao Chép Chữ'}
              </button>
            </div>

            <textarea
              className="input-field"
              rows={7}
              readOnly
              value={extractedText}
              style={{ fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.5 }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button className="btn btn-primary" onClick={handleApplyEditableText}>
                <Layers size={16} /> Chuyển Thành Chữ Sửa Trực Tiếp Trên PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
