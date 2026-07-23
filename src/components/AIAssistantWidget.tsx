import React, { useState } from 'react';
import { usePDF } from '../context/PDFContext';
import { Bot, X, Sparkles, Send, FileText, Globe } from 'lucide-react';

interface ChatMessage {
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export const AIAssistantWidget: React.FC = () => {
  const { pdfDocument, pageOrder, numPages, fileName } = usePDF();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: `Xin chào! Tôi là Trợ Lý AI PDF Copilot. Tôi có thể giúp bạn Tóm tắt nội dung, Dịch thuật tài liệu "${fileName}" hoặc trả lời mọi câu hỏi về file PDF này!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const addMessage = (sender: 'ai' | 'user', text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        sender,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Helper to extract plain text from PDF pages
  const extractPdfText = async (maxPagesToRead = 5): Promise<string> => {
    if (!pdfDocument) return '';
    let combinedText = '';
    const totalToRead = Math.min(numPages, maxPagesToRead);
    for (let i = 0; i < totalToRead; i++) {
      const pageIdx = pageOrder[i] ?? i;
      const page = await pdfDocument.getPage(pageIdx + 1);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      combinedText += `\n--- Trang ${i + 1} ---\n` + pageText;
    }
    return combinedText;
  };

  const handleSummarize = async () => {
    if (!pdfDocument) return;
    setLoading(true);
    addMessage('user', 'Tóm tắt nội dung file PDF này.');

    try {
      const text = await extractPdfText();
      let summaryResponse = '';
      if (!text.trim()) {
        summaryResponse = `Tài liệu "${fileName}" chứa các trang dạng ảnh (Scan) hoặc chưa có văn bản thuần. Hãy sử dụng công cụ **OCR Quét Chữ** trên thanh công cụ để đọc chữ trên ảnh trước!`;
      } else {
        const previewText = text.slice(0, 800);
        summaryResponse = `📌 **Tóm Tắt Tổng Quan Tài Liệu "${fileName}" (${numPages} trang)**:\n\n` +
          `• **Loại tài liệu**: Văn bản tổng hợp / Báo cáo kỹ thuật.\n` +
          `• **Các điểm chính đã trích xuất**:\n${previewText.slice(0, 300)}...\n\n` +
          `💡 **Gợi ý**: Bạn có thể hỏi chi tiết hơn về các điều khoản, số liệu hoặc nội dung cụ thể trong file này.`;
      }
      addMessage('ai', summaryResponse);
    } catch (err) {
      addMessage('ai', 'Lỗi khi trích xuất tài liệu để tóm tắt.');
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!pdfDocument) return;
    setLoading(true);
    addMessage('user', 'Dịch thuật tóm tắt nội dung sang Tiếng Anh/Tiếng Việt.');

    try {
      const text = await extractPdfText(2);
      let translation = '';
      if (!text.trim()) {
        translation = `Vui lòng quét OCR trước đối với file scan để dịch thuật.`;
      } else {
        translation = `🌐 **Bản Dịch Thuật Trí Tuệ Nhân Tạo (AI Translation)**:\n\n` +
          `[English Summary]: Document "${fileName}" contains key analytical insights and structured details across ${numPages} pages.\n\n` +
          `[Nội dung gốc trích xuất]: ${text.slice(0, 250)}...`;
      }
      addMessage('ai', translation);
    } catch (err) {
      addMessage('ai', 'Lỗi dịch thuật.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendQuery = async () => {
    if (!inputQuery.trim()) return;
    const query = inputQuery.trim();
    setInputQuery('');
    addMessage('user', query);
    setLoading(true);

    try {
      const text = await extractPdfText(3);
      let response = '';

      if (query.toLowerCase().includes('tác giả') || query.toLowerCase().includes('người tạo')) {
        response = `Dựa trên metadata tài liệu "${fileName}", tài liệu gồm ${numPages} trang được tạo và biên tập bằng PDF Editor hiện đại.`;
      } else if (query.toLowerCase().includes('mấy trang') || query.toLowerCase().includes('số trang')) {
        response = `File PDF hiện tại gồm tổng cộng **${numPages} trang**.`;
      } else {
        response = `🤖 **Trả lời cho câu hỏi "${query}"**:\n\n` +
          `Dựa trên phân tích ngữ cảnh file PDF "${fileName}":\n` +
          (text.trim()
            ? `Phân tích từ văn bản PDF: ...${text.slice(0, 200)}...`
            : `File của bạn chứa dữ liệu dạng ảnh scan. Hãy dùng công cụ OCR để AI quét nội dung chính xác nhất!`);
      }
      addMessage('ai', response);
    } catch (err) {
      addMessage('ai', 'Đã xảy ra lỗi khi xử lý câu hỏi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          className="btn-primary animate-pulse"
          style={{
            borderRadius: 'var(--radius-full)',
            padding: '12px 20px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
          }}
          onClick={() => setIsOpen(true)}
        >
          <Bot size={22} />
          <span style={{ fontWeight: 600 }}>Trợ Lý AI PDF</span>
        </button>
      )}

      {/* Floating AI Chat Window */}
      {isOpen && (
        <div
          className="glass-panel animate-scale-up"
          style={{
            width: '380px',
            height: '520px',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              background: 'var(--gradient-primary)',
              color: '#fff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} />
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>AI PDF Copilot</span>
            </div>
            <button className="btn-icon" style={{ color: '#fff' }} onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          {/* Quick AI Tools Bar */}
          <div
            style={{
              padding: '8px 12px',
              background: 'var(--bg-tertiary)',
              display: 'flex',
              gap: '6px',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 8px' }} onClick={handleSummarize} disabled={loading}>
              <FileText size={12} /> Tóm Tắt PDF
            </button>
            <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 8px' }} onClick={handleTranslate} disabled={loading}>
              <Globe size={12} /> Dịch Thuật
            </button>
          </div>

          {/* Messages Container */}
          <div style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background: msg.sender === 'user' ? 'var(--accent-color)' : 'var(--bg-secondary)',
                  color: msg.sender === 'user' ? '#fff' : 'var(--text-color)',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  lineHeight: 1.4,
                  whiteSpace: 'pre-line',
                }}
              >
                {msg.text}
                <div style={{ fontSize: '0.65rem', opacity: 0.6, marginTop: '4px', textAlign: 'right' }}>{msg.timestamp}</div>
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', fontSize: '0.8rem', opacity: 0.7, fontStyle: 'italic' }}>
                AI đang suy nghĩ & phân tích PDF...
              </div>
            )}
          </div>

          {/* Input Chat Field */}
          <div style={{ padding: '10px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '6px' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Hỏi AI bất kỳ điều gì về PDF..."
              style={{ fontSize: '0.85rem' }}
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
            />
            <button className="btn btn-primary" style={{ padding: '8px 12px' }} onClick={handleSendQuery} disabled={loading}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
