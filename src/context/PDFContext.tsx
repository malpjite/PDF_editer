import React, { createContext, useContext, useState } from 'react';
import type { Annotation, ToolType, ToolOptions, ModalType, WatermarkOptions, PageNumberOptions } from '../types/pdf';
import { pdfjs } from '../utils/pdfWorker';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';

interface HistoryState {
  annotations: Record<number, Annotation[]>;
  pageOrder: number[];
  pageRotations: Record<number, number>;
  deletedPages: number[];
}

interface PDFContextType {
  file: File | null;
  fileName: string;
  pdfBytes: ArrayBuffer | null;
  pdfDocument: PDFDocumentProxy | null;
  numPages: number;
  currentPage: number;
  scale: number;
  theme: 'dark' | 'light';
  activeTool: ToolType;
  toolOptions: ToolOptions;
  annotations: Record<number, Annotation[]>;
  selectedAnnotationId: string | null;
  pageOrder: number[];
  pageRotations: Record<number, number>;
  deletedPages: Set<number>;
  activeModal: ModalType;
  watermark: WatermarkOptions | null;
  pageNumbering: PageNumberOptions | null;

  // Actions
  loadFile: (file: File) => Promise<void>;
  loadBytes: (bytes: ArrayBuffer | Uint8Array, name?: string) => Promise<void>;
  setCurrentPage: (page: number) => void;
  setScale: React.Dispatch<React.SetStateAction<number>>;
  toggleTheme: () => void;
  setActiveTool: (tool: ToolType) => void;
  setToolOptions: React.Dispatch<React.SetStateAction<ToolOptions>>;
  setActiveModal: (modal: ModalType) => void;
  setSelectedAnnotationId: (id: string | null) => void;
  setWatermark: (watermark: WatermarkOptions | null) => void;
  setPageNumbering: (pageNumbering: PageNumberOptions | null) => void;

  // Annotation Manipulation
  addAnnotation: (pageIndex: number, annotation: Annotation) => void;
  updateAnnotation: (id: string, partial: Partial<Annotation>) => void;
  removeAnnotation: (id: string) => void;

  // Page Manipulation
  rotatePage: (pageIndex: number, delta: number) => void;
  reorderPage: (fromIndex: number, toIndex: number) => void;
  deletePage: (pageIndex: number) => void;
  insertBlankPage: (afterDisplayIndex: number) => Promise<void>;
  duplicatePage: (displayIndex: number) => Promise<void>;
  extractSelectedPages: (selectedDisplayIndices: number[]) => Promise<Uint8Array | null>;

  // History
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  resetAll: () => void;
}

const DEFAULT_TOOL_OPTIONS: ToolOptions = {
  color: '#6366f1',
  fillColor: 'rgba(99, 102, 241, 0.2)',
  strokeWidth: 3,
  fontSize: 18,
  fontFamily: 'Inter, sans-serif',
  opacity: 1,
};

const PDFContext = createContext<PDFContextType | null>(null);

export const PDFProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('Document.pdf');
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.1);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [toolOptions, setToolOptions] = useState<ToolOptions>(DEFAULT_TOOL_OPTIONS);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);

  const [watermark, setWatermark] = useState<WatermarkOptions | null>(null);
  const [pageNumbering, setPageNumbering] = useState<PageNumberOptions | null>(null);

  const [annotations, setAnnotations] = useState<Record<number, Annotation[]>>({});
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [pageRotations, setPageRotations] = useState<Record<number, number>>({});
  const [deletedPages, setDeletedPages] = useState<Set<number>>(new Set());

  // Undo / Redo history
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const saveHistorySnapshot = (
    newAnnotations: Record<number, Annotation[]>,
    newOrder: number[],
    newRotations: Record<number, number>,
    newDeleted: Set<number>
  ) => {
    const snapshot: HistoryState = {
      annotations: JSON.parse(JSON.stringify(newAnnotations)),
      pageOrder: [...newOrder],
      pageRotations: { ...newRotations },
      deletedPages: Array.from(newDeleted),
    };

    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, snapshot];
    });
    setHistoryIndex((prev) => prev + 1);
  };

  const loadBytes = async (inputData: ArrayBuffer | Uint8Array, name = 'Document.pdf') => {
    try {
      const uint8 = inputData instanceof Uint8Array ? inputData : new Uint8Array(inputData);
      const loadingTask = pdfjs.getDocument({ data: uint8 });
      const doc = await loadingTask.promise;
      setPdfDocument(doc);
      setPdfBytes(uint8.buffer as ArrayBuffer);
      setFileName(name);
      setNumPages(doc.numPages);
      setCurrentPage(1);

      const initialOrder = Array.from({ length: doc.numPages }, (_, i) => i);
      setPageOrder(initialOrder);
      setPageRotations({});
      setDeletedPages(new Set());
      setAnnotations({});
      setSelectedAnnotationId(null);

      setHistory([
        {
          annotations: {},
          pageOrder: initialOrder,
          pageRotations: {},
          deletedPages: [],
        },
      ]);
      setHistoryIndex(0);
    } catch (err) {
      console.error('Error loading PDF document:', err);
      alert('Không thể mở file PDF này. File có thể bị hỏng hoặc có mật khẩu bảo vệ.');
    }
  };

  const loadFile = async (selectedFile: File) => {
    setFile(selectedFile);
    const buffer = await selectedFile.arrayBuffer();
    await loadBytes(buffer, selectedFile.name);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const addAnnotation = (pageIndex: number, annotation: Annotation) => {
    const updated = {
      ...annotations,
      [pageIndex]: [...(annotations[pageIndex] || []), annotation],
    };
    setAnnotations(updated);
    saveHistorySnapshot(updated, pageOrder, pageRotations, deletedPages);
  };

  const updateAnnotation = (id: string, partial: Partial<Annotation>) => {
    const updated: Record<number, Annotation[]> = {};
    Object.keys(annotations).forEach((key) => {
      const pageIdx = Number(key);
      updated[pageIdx] = annotations[pageIdx].map((ann) =>
        ann.id === id ? ({ ...ann, ...partial } as Annotation) : ann
      );
    });
    setAnnotations(updated);
    saveHistorySnapshot(updated, pageOrder, pageRotations, deletedPages);
  };

  const removeAnnotation = (id: string) => {
    const updated: Record<number, Annotation[]> = {};
    Object.keys(annotations).forEach((key) => {
      const pageIdx = Number(key);
      updated[pageIdx] = annotations[pageIdx].filter((ann) => ann.id !== id);
    });
    setAnnotations(updated);
    if (selectedAnnotationId === id) setSelectedAnnotationId(null);
    saveHistorySnapshot(updated, pageOrder, pageRotations, deletedPages);
  };

  const rotatePage = (pageIndex: number, delta: number) => {
    const current = pageRotations[pageIndex] || 0;
    const nextRotation = (current + delta + 360) % 360;
    const updated = { ...pageRotations, [pageIndex]: nextRotation };
    setPageRotations(updated);
    saveHistorySnapshot(annotations, pageOrder, updated, deletedPages);
  };

  const reorderPage = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const newOrder = [...pageOrder];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
    setPageOrder(newOrder);
    saveHistorySnapshot(annotations, newOrder, pageRotations, deletedPages);
  };

  const deletePage = (pageIndex: number) => {
    const nextDeleted = new Set(deletedPages);
    nextDeleted.add(pageIndex);
    setDeletedPages(nextDeleted);
    saveHistorySnapshot(annotations, pageOrder, pageRotations, nextDeleted);
  };

  // Insert a new blank page into pdfBytes
  const insertBlankPage = async (afterDisplayIndex: number) => {
    if (!pdfBytes) return;
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const targetIndex = Math.min(Math.max(0, afterDisplayIndex), pdfDoc.getPageCount());
      pdfDoc.insertPage(targetIndex, [595.28, 841.89]); // A4 size
      const newBytes = await pdfDoc.save();
      await loadBytes(newBytes, fileName);
    } catch (err) {
      console.error('Error inserting blank page:', err);
    }
  };

  // Duplicate a page
  const duplicatePage = async (displayIndex: number) => {
    if (!pdfBytes) return;
    try {
      const originalPageIndex = pageOrder[displayIndex];
      if (originalPageIndex === undefined) return;
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const [copiedPage] = await pdfDoc.copyPages(pdfDoc, [originalPageIndex]);
      pdfDoc.insertPage(displayIndex + 1, copiedPage);
      const newBytes = await pdfDoc.save();
      await loadBytes(newBytes, fileName);
    } catch (err) {
      console.error('Error duplicating page:', err);
    }
  };

  // Extract selected pages as a new PDF Uint8Array
  const extractSelectedPages = async (selectedDisplayIndices: number[]): Promise<Uint8Array | null> => {
    if (!pdfBytes || selectedDisplayIndices.length === 0) return null;
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const newDoc = await PDFDocument.create();
      const originalIndices = selectedDisplayIndices
        .map((idx) => pageOrder[idx])
        .filter((idx): idx is number => idx !== undefined && !deletedPages.has(idx));

      const copiedPages = await newDoc.copyPages(pdfDoc, originalIndices);
      copiedPages.forEach((p) => newDoc.addPage(p));
      return await newDoc.save();
    } catch (err) {
      console.error('Error extracting pages:', err);
      return null;
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const state = history[prevIndex];
      setAnnotations(JSON.parse(JSON.stringify(state.annotations)));
      setPageOrder([...state.pageOrder]);
      setPageRotations({ ...state.pageRotations });
      setDeletedPages(new Set(state.deletedPages));
      setHistoryIndex(prevIndex);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const state = history[nextIndex];
      setAnnotations(JSON.parse(JSON.stringify(state.annotations)));
      setPageOrder([...state.pageOrder]);
      setPageRotations({ ...state.pageRotations });
      setDeletedPages(new Set(state.deletedPages));
      setHistoryIndex(nextIndex);
    }
  };

  const resetAll = () => {
    setFile(null);
    setPdfBytes(null);
    setPdfDocument(null);
    setNumPages(0);
    setCurrentPage(1);
    setAnnotations({});
    setPageOrder([]);
    setPageRotations({});
    setDeletedPages(new Set());
    setHistory([]);
    setHistoryIndex(-1);
    setWatermark(null);
    setPageNumbering(null);
  };

  return (
    <PDFContext.Provider
      value={{
        file,
        fileName,
        pdfBytes,
        pdfDocument,
        numPages,
        currentPage,
        scale,
        theme,
        activeTool,
        toolOptions,
        annotations,
        selectedAnnotationId,
        pageOrder,
        pageRotations,
        deletedPages,
        activeModal,
        watermark,
        pageNumbering,
        loadFile,
        loadBytes,
        setCurrentPage,
        setScale,
        toggleTheme,
        setActiveTool,
        setToolOptions,
        setActiveModal,
        setSelectedAnnotationId,
        setWatermark,
        setPageNumbering,
        addAnnotation,
        updateAnnotation,
        removeAnnotation,
        rotatePage,
        reorderPage,
        deletePage,
        insertBlankPage,
        duplicatePage,
        extractSelectedPages,
        undo,
        redo,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1,
        resetAll,
      }}
    >
      {children}
    </PDFContext.Provider>
  );
};

export const usePDF = () => {
  const context = useContext(PDFContext);
  if (!context) throw new Error('usePDF must be used within a PDFProvider');
  return context;
};
