import React, { useState } from 'react';
import { usePDF } from '../context/PDFContext';
import { createWorker } from 'tesseract.js';
import { Sparkles, X, Copy, Check, RefreshCw, Layers, Edit3 } from 'lucide-react';

export const OCRModal: React.FC = () => {
  const { pdfDocument, currentPage, pageOrder, addAnnotation, setActiveModal } = usePDF();
  const [lang, setLang] = useState<'vie' | 'eng' | 'vie+eng'>('vie+eng');
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [ocrLines, setOcrLines] = useState<any[]>([]);
  const [copied, setCopied] = useState<boolean>(false);

  const runOCR = async () => {
    if (!pdfDocument) return;
    setLoading(true);
    setProgress(0);
    setStatusText('Đang khởi tạo bộ nhận dạng Tesseract AI...');
    setExtractedText('');
    setOcrLines([]);

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

      setStatusText('Đang nạp dữ liệu nhận dạng ngôn ngữ...');
      const worker = await createWorker(lang as string, 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
            setStatusText(`Đang quét & nhận dạng chữ AI: ${Math.round(m.progress * 100)}%`);
          } else {
            setStatusText(m.status);
          }
        },
      });

      const ret = await worker.recognize(imageDataUrl);
      const data = ret.data as any;
      setExtractedText(data.text || '');
      setOcrLines(data.lines || []);
      await worker.terminate();

      setStatusText('Nhận dạng hoàn tất!');
    } catch (err) {
      console.error('OCR error:', err);
      alert('Đã xảy ra lỗi khi quét OCR. Vui lòng thử lại.');
      setStatusText('Thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyEditableText = () => {
    if (!extractedText.trim()) {
      alert('Không có nội dung chữ để chuyển đổi!');
      return;
    }

    const originalPageIndex = pageOrder[currentPage - 1] ?? (currentPage - 1);
    const editedLines = extractedText.split('\n').filter((l) => l.trim().length > 0);

    const scaleFactor = 0.5; // Scale down from 2.0 resolution render

    if (ocrLines.length > 0) {
      editedLines.forEach((lineText, idx) => {
        // Match line bounding box or calculate fallback position
        const lineObj = ocrLines[idx] || ocrLines[ocrLines.length - 1];
        const bbox = lineObj ? lineObj.bbox : { x0: 40, y0: 40 + idx * 30, x1: 500, y1: 65 + idx * 30 };

        const x = bbox.x0 * scaleFactor;
        const y = bbox.y0 * scaleFactor;
        const width = Math.max((bbox.x1 - bbox.x0) * scaleFactor, 100);
        const height = Math.max((bbox.y1 - bbox.y0) * scaleFactor, 18);

        // 1. Whiteout original scanned line on PDF page image
        addAnnotation(originalPageIndex, {
          id: `ocr_whiteout_${Date.now()}_${idx}`,
          pageIndex: originalPageIndex,
          type: 'whiteout',
          x: x - 2,
          y: y - 2,
          width: width + 6,
          height: height + 4,
          strokeColor: '#ffffff',
          fillColor: '#ffffff',
          strokeWidth: 0,
          opacity: 1,
        });

        // 2. Add editable text annotation with user's edited content
        addAnnotation(originalPageIndex, {
          id: `ocr_text_${Date.now()}_${idx}`,
          pageIndex: originalPageIndex,
          type: 'text',
          x,
          y,
          width,
          height,
          content: lineText,
          fontSize: Math.max(12, Math.round(height * 0.8)),
          fontFamily: 'Inter, sans-serif',
          color: '#000000',
        });
      });
    } else {
      // Fallback if no line boxes: add as editable text blocks
      editedLines.forEach((lineText, idx) => {
        addAnnotation(originalPageIndex, {
          id: `ocr_text_${Date.now()}_${idx}`,
          pageIndex: originalPageIndex,
          type: 'text',
          x: 50,
          y: 60 + idx * 28,
          width: 450,
          height: 24,
          content: lineText,
          fontSize: 14,
          fontFamily: 'Inter, sans-serif',
          color: '#000000',
        });
      });
    }

    alert(`Thành công! Đã chèn ${editedLines.length} dòng chữ có thể chỉnh sửa đè lên trang PDF scan.`);
    setActiveModal(null);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animate-scale-up" style={{ maxWidth: '680px', width: '92%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'var(--gradient-primary)', padding: '8px', borderRadius: 'var(--radius-md)', color: '#fff' }}>
              <Sparkles size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Quét OCR & Chỉnh Sửa Chữ PDF Scan</h3>
          </div>
          <button className="btn-icon" onClick={() => setActiveModal(null)}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.88rem', opacity: 0.85, marginBottom: '16px', lineHeight: 1.5 }}>
          Công cụ OCR AI giúp đọc chữ từ file PDF dạng ảnh/scan. Bạn có thể <b>chỉnh sửa chữ trực tiếp ở ô bên dưới</b> trước khi chèn đè lên PDF!
        </p>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.88rem', fontWeight: 600 }}>Ngôn ngữ quét:</label>
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

        {/* Editable OCR Result text area */}
        {extractedText !== '' && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)' }}>
                <Edit3 size={16} /> Bạn có thể chỉnh sửa lại văn bản tại đây trước khi áp dụng:
              </span>
              <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={handleCopyText}>
                {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                {copied ? 'Đã Sao Chép!' : 'Sao Chép Chữ'}
              </button>
            </div>

            <textarea
              className="input-field"
              rows={8}
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                padding: '12px',
                background: 'var(--bg-secondary)',
                borderColor: 'var(--accent-primary)',
              }}
              placeholder="Chỉnh sửa nội dung chữ ở đây..."
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>
                Hủy
              </button>
              <button className="btn btn-primary" onClick={handleApplyEditableText}>
                <Layers size={16} /> Chèn Chữ Đã Sửa Đè Lên Trang PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
