import React, { useEffect, useRef, useState } from 'react';
import { usePDF } from '../context/PDFContext';
import type { Annotation, Point } from '../types/pdf';
import { ChevronLeft, ChevronRight, Edit3, Trash2, Check } from 'lucide-react';

export const PDFCanvasViewer: React.FC = () => {
  const {
    pdfDocument,
    currentPage,
    setCurrentPage,
    scale,
    pageOrder,
    pageRotations,
    deletedPages,
    annotations,
    addAnnotation,
    removeAnnotation,
    updateAnnotation,
    activeTool,
    toolOptions,
    selectedAnnotationId,
    setSelectedAnnotationId,
    setActiveTool,
  } = usePDF();

  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number }>({
    width: 612,
    height: 792,
  });

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPoints, setDrawPoints] = useState<Point[]>([]);
  const [shapeStart, setShapeStart] = useState<Point | null>(null);
  const [currentShapeEnd, setCurrentShapeEnd] = useState<Point | null>(null);

  // Text inline editing state
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textInput, setTextInput] = useState<string>('');

  // Dragging annotations state
  const [dragInfo, setDragInfo] = useState<{
    id: string;
    startX: number;
    startY: number;
    initAnnX: number;
    initAnnY: number;
  } | null>(null);

  const activePages = pageOrder.filter((idx) => !deletedPages.has(idx));
  const origPageIndex = activePages[currentPage - 1] ?? 0;
  const rotation = pageRotations[origPageIndex] || 0;
  const currentAnns = annotations[origPageIndex] || [];

  // Render PDF Page onto base canvas with cancellation token
  useEffect(() => {
    let isCancelled = false;
    let renderTask: any = null;

    const renderPage = async () => {
      if (!pdfDocument || !pdfCanvasRef.current) return;
      try {
        const page = await pdfDocument.getPage(origPageIndex + 1);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale, rotation });
        const canvas = pdfCanvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        setPageDimensions({ width: viewport.width, height: viewport.height });

        if (overlayCanvasRef.current) {
          overlayCanvasRef.current.width = viewport.width;
          overlayCanvasRef.current.height = viewport.height;
        }

        renderTask = (page as any).render({ canvasContext: ctx, viewport, canvas });
        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('PDF Page render error:', err);
        }
      }
    };

    renderPage();
    return () => {
      isCancelled = true;
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch (e) {
          // ignore cancellation exception
        }
      }
    };
  }, [pdfDocument, origPageIndex, scale, rotation]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);

    // Clear active selection or editing mode when clicking canvas background
    if (editingTextId) setEditingTextId(null);
    if (selectedAnnotationId) setSelectedAnnotationId(null);

    if (activeTool === 'draw' || activeTool === 'highlight') {
      setIsDrawing(true);
      setDrawPoints([coords]);
    } else if (
      activeTool === 'rectangle' ||
      activeTool === 'circle' ||
      activeTool === 'line' ||
      activeTool === 'arrow' ||
      activeTool === 'whiteout'
    ) {
      setIsDrawing(true);
      setShapeStart(coords);
      setCurrentShapeEnd(coords);
    } else if (activeTool === 'text') {
      const textId = 'text_' + Date.now();
      const newText: Annotation = {
        id: textId,
        pageIndex: origPageIndex,
        type: 'text',
        x: coords.x,
        y: coords.y,
        width: 180,
        height: 36,
        content: 'Nhập chữ tại đây...',
        fontSize: toolOptions.fontSize,
        fontFamily: toolOptions.fontFamily,
        color: toolOptions.color,
      };
      addAnnotation(origPageIndex, newText);
      setSelectedAnnotationId(textId);
      setEditingTextId(textId);
      setTextInput('Nhập chữ tại đây...');
      setActiveTool('select');
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragInfo) {
      const dx = e.clientX - dragInfo.startX;
      const dy = e.clientY - dragInfo.startY;
      updateAnnotation(dragInfo.id, {
        x: Math.round(dragInfo.initAnnX + dx),
        y: Math.round(dragInfo.initAnnY + dy),
      });
      return;
    }

    if (!isDrawing) return;
    const coords = getCanvasCoords(e);

    if (activeTool === 'draw' || activeTool === 'highlight') {
      setDrawPoints((prev) => [...prev, coords]);
    } else if (
      activeTool === 'rectangle' ||
      activeTool === 'circle' ||
      activeTool === 'line' ||
      activeTool === 'arrow' ||
      activeTool === 'whiteout'
    ) {
      setCurrentShapeEnd(coords);
    }
  };

  const handleMouseUp = () => {
    if (dragInfo) {
      setDragInfo(null);
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);

    if ((activeTool === 'draw' || activeTool === 'highlight') && drawPoints.length > 1) {
      const isHigh = activeTool === 'highlight';
      const newDrawAnn: Annotation = {
        id: 'draw_' + Date.now(),
        pageIndex: origPageIndex,
        type: isHigh ? 'highlight' : 'draw',
        x: 0,
        y: 0,
        width: pageDimensions.width,
        height: pageDimensions.height,
        points: drawPoints,
        color: toolOptions.color,
        strokeWidth: isHigh ? 16 : toolOptions.strokeWidth,
        opacity: isHigh ? 0.35 : toolOptions.opacity,
        isHighlight: isHigh,
      };
      addAnnotation(origPageIndex, newDrawAnn);
      setDrawPoints([]);
    } else if (shapeStart && currentShapeEnd) {
      const x = Math.min(shapeStart.x, currentShapeEnd.x);
      const y = Math.min(shapeStart.y, currentShapeEnd.y);
      const width = Math.abs(currentShapeEnd.x - shapeStart.x);
      const height = Math.abs(currentShapeEnd.y - shapeStart.y);

      if (width > 5 && height > 5) {
        const newShapeAnn: Annotation = {
          id: 'shape_' + Date.now(),
          pageIndex: origPageIndex,
          type: activeTool as any,
          x,
          y,
          width,
          height,
          strokeColor: toolOptions.color,
          fillColor: activeTool === 'whiteout' ? '#ffffff' : toolOptions.fillColor,
          strokeWidth: toolOptions.strokeWidth,
          opacity: toolOptions.opacity,
        };
        addAnnotation(origPageIndex, newShapeAnn);
      }
      setShapeStart(null);
      setCurrentShapeEnd(null);
    }
  };

  const handleStartDrag = (e: React.MouseEvent, ann: Annotation) => {
    e.stopPropagation();
    if (editingTextId === ann.id) return; // Do not start drag while typing inside text input

    setSelectedAnnotationId(ann.id);
    if (activeTool === 'eraser') {
      removeAnnotation(ann.id);
      return;
    }
    setDragInfo({
      id: ann.id,
      startX: e.clientX,
      startY: e.clientY,
      initAnnX: ann.x,
      initAnnY: ann.y,
    });
  };

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (dragInfo) {
      const dx = e.clientX - dragInfo.startX;
      const dy = e.clientY - dragInfo.startY;
      updateAnnotation(dragInfo.id, {
        x: Math.round(dragInfo.initAnnX + dx),
        y: Math.round(dragInfo.initAnnY + dy),
      });
    }
  };

  const handleContainerMouseUp = () => {
    if (dragInfo) {
      setDragInfo(null);
    }
  };

  const handleSaveText = (id: string) => {
    updateAnnotation(id, { content: textInput });
    setEditingTextId(null);
  };

  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (drawPoints.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = toolOptions.color;
      ctx.lineWidth = activeTool === 'highlight' ? 16 : toolOptions.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = activeTool === 'highlight' ? 0.4 : toolOptions.opacity;

      ctx.moveTo(drawPoints[0].x, drawPoints[0].y);
      for (let i = 1; i < drawPoints.length; i++) {
        ctx.lineTo(drawPoints[i].x, drawPoints[i].y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }

    if (shapeStart && currentShapeEnd) {
      const x = Math.min(shapeStart.x, currentShapeEnd.x);
      const y = Math.min(shapeStart.y, currentShapeEnd.y);
      const w = Math.abs(currentShapeEnd.x - shapeStart.x);
      const h = Math.abs(currentShapeEnd.y - shapeStart.y);

      ctx.strokeStyle = toolOptions.color;
      ctx.lineWidth = toolOptions.strokeWidth;
      ctx.fillStyle = activeTool === 'whiteout' ? '#ffffff' : toolOptions.fillColor;

      if (activeTool === 'rectangle' || activeTool === 'whiteout') {
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
      } else if (activeTool === 'circle') {
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
  }, [drawPoints, shapeStart, currentShapeEnd, activeTool, toolOptions]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleContainerMouseMove}
      onMouseUp={handleContainerMouseUp}
      style={{
        flex: 1,
        height: '100%',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '30px',
        background: 'var(--bg-primary)',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'relative',
          boxShadow: 'var(--shadow-lg)',
          borderRadius: 'var(--radius-sm)',
          background: '#ffffff',
          overflow: 'hidden',
        }}
      >
        <canvas ref={pdfCanvasRef} style={{ display: 'block' }} />

        <canvas
          ref={overlayCanvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: activeTool === 'select' ? 'none' : 'auto',
            cursor:
              activeTool === 'draw' || activeTool === 'highlight'
                ? 'crosshair'
                : activeTool === 'text'
                ? 'text'
                : activeTool === 'select'
                ? 'default'
                : 'crosshair',
            zIndex: 10,
          }}
        />

        {currentAnns.map((ann) => {
          const isSelected = selectedAnnotationId === ann.id;

          if (ann.type === 'text') {
            const isEditing = editingTextId === ann.id;
            return (
              <div
                key={ann.id}
                onMouseDown={(e) => handleStartDrag(e, ann)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedAnnotationId(ann.id);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingTextId(ann.id);
                  setTextInput(ann.content);
                }}
                style={{
                  position: 'absolute',
                  left: ann.x,
                  top: ann.y,
                  color: ann.color,
                  fontSize: ann.fontSize + 'px',
                  fontFamily: ann.fontFamily,
                  fontWeight: ann.bold ? 'bold' : 'normal',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.85)',
                  border: isSelected ? '2px solid var(--accent-primary)' : '1px solid rgba(0,0,0,0.2)',
                  boxShadow: isSelected ? '0 0 10px rgba(99, 102, 241, 0.4)' : 'none',
                  cursor: isEditing ? 'text' : 'move',
                  zIndex: 30,
                  whiteSpace: 'pre-wrap',
                  userSelect: isEditing ? 'text' : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {isEditing ? (
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      value={textInput}
                      autoFocus
                      onChange={(e) => setTextInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveText(ann.id);
                        }
                      }}
                      style={{
                        background: '#0f172a',
                        color: '#ffffff',
                        border: '1px solid var(--accent-primary)',
                        fontSize: 'inherit',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        outline: 'none',
                        minWidth: '160px',
                      }}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveText(ann.id);
                      }}
                      style={{
                        background: '#10b981',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Lưu chữ"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <span>{ann.content}</span>
                )}

                {isSelected && !isEditing && (
                  <div style={{ display: 'flex', gap: '4px', marginLeft: '6px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTextId(ann.id);
                        setTextInput(ann.content);
                      }}
                      style={{
                        background: 'var(--accent-primary)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '3px',
                        padding: '3px 6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        fontSize: '0.75rem',
                      }}
                      title="Sửa chữ"
                    >
                      <Edit3 size={12} /> Sửa
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAnnotation(ann.id);
                      }}
                      style={{
                        background: 'var(--danger)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '3px',
                        padding: '3px 6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '0.75rem',
                      }}
                      title="Xóa"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            );
          }

          if (ann.type === 'rectangle' || ann.type === 'whiteout' || ann.type === 'circle') {
            return (
              <div
                key={ann.id}
                onMouseDown={(e) => handleStartDrag(e, ann)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedAnnotationId(ann.id);
                }}
                style={{
                  position: 'absolute',
                  left: ann.x,
                  top: ann.y,
                  width: ann.width,
                  height: ann.height,
                  border:
                    ann.type === 'whiteout'
                      ? 'none'
                      : `${ann.strokeWidth}px solid ${ann.strokeColor}`,
                  backgroundColor: ann.type === 'whiteout' ? '#ffffff' : ann.fillColor,
                  borderRadius: ann.type === 'circle' ? '50%' : '0',
                  outline: isSelected ? '2px dashed var(--accent-primary)' : 'none',
                  cursor: 'move',
                  zIndex: 20,
                }}
              >
                {isSelected && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAnnotation(ann.id);
                    }}
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '-10px',
                      background: 'var(--danger)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            );
          }

          if (ann.type === 'image' || ann.type === 'signature') {
            return (
              <div
                key={ann.id}
                onMouseDown={(e) => handleStartDrag(e, ann)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedAnnotationId(ann.id);
                }}
                style={{
                  position: 'absolute',
                  left: ann.x,
                  top: ann.y,
                  width: ann.width,
                  height: ann.height,
                  border: isSelected ? '2px dashed var(--accent-primary)' : 'none',
                  cursor: 'move',
                  zIndex: 25,
                }}
              >
                <img
                  src={ann.dataUrl}
                  alt="Annotation"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
                />
                {isSelected && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAnnotation(ann.id);
                    }}
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '-10px',
                      background: 'var(--danger)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            );
          }

          if (ann.type === 'stamp') {
            return (
              <div
                key={ann.id}
                onMouseDown={(e) => handleStartDrag(e, ann)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedAnnotationId(ann.id);
                }}
                style={{
                  position: 'absolute',
                  left: ann.x,
                  top: ann.y,
                  width: ann.width,
                  height: ann.height,
                  border: `3px double ${ann.color}`,
                  color: ann.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  letterSpacing: '1px',
                  transform: 'rotate(-8deg)',
                  background: 'rgba(255,255,255,0.95)',
                  boxShadow: 'var(--shadow-sm)',
                  borderRadius: '4px',
                  cursor: 'move',
                  zIndex: 25,
                  userSelect: 'none',
                }}
              >
                {ann.text}
                {isSelected && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAnnotation(ann.id);
                    }}
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '-10px',
                      background: 'var(--danger)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            );
          }

          return null;
        })}
      </div>

      <div
        className="glass-panel"
        style={{
          position: 'sticky',
          bottom: '20px',
          marginTop: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '6px 16px',
          borderRadius: 'var(--radius-full)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 80,
        }}
      >
        <button
          className="btn-icon"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          title="Trang trước"
        >
          <ChevronLeft size={18} />
        </button>

        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
          Trang {currentPage} / {activePages.length}
        </span>

        <button
          className="btn-icon"
          disabled={currentPage === activePages.length}
          onClick={() => setCurrentPage(Math.min(activePages.length, currentPage + 1))}
          title="Trang tiếp theo"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};
