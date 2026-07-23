export type ToolType =
  | 'select'
  | 'text'
  | 'draw'
  | 'highlight'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'arrow'
  | 'whiteout'
  | 'signature'
  | 'stamp'
  | 'image'
  | 'eraser'
  | 'ocr';

export interface Point {
  x: number;
  y: number;
}

export interface BaseAnnotation {
  id: string;
  pageIndex: number; // 0-based original page index
  x: number;
  y: number;
  width: number;
  height: number;
  type: ToolType;
}

export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor?: string;
  bold?: boolean;
  italic?: boolean;
}

export interface DrawAnnotation extends BaseAnnotation {
  type: 'draw' | 'highlight';
  points: Point[];
  color: string;
  strokeWidth: number;
  opacity: number;
  isHighlight?: boolean;
}

export interface ShapeAnnotation extends BaseAnnotation {
  type: 'rectangle' | 'circle' | 'line' | 'arrow' | 'whiteout';
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number;
}

export interface ImageAnnotation extends BaseAnnotation {
  type: 'image' | 'signature';
  dataUrl: string;
  aspectRatio: number;
}

export interface StampAnnotation extends BaseAnnotation {
  type: 'stamp';
  text: string;
  subtext?: string;
  color: string;
  stampStyle: 'approved' | 'confidential' | 'draft' | 'rejected' | 'custom';
}

export type Annotation =
  | TextAnnotation
  | DrawAnnotation
  | ShapeAnnotation
  | ImageAnnotation
  | StampAnnotation;

export interface PageInfo {
  pageIndex: number;
  displayIndex: number;
  rotation: number;
  isDeleted: boolean;
  width: number;
  height: number;
}

export interface ToolOptions {
  color: string;
  fillColor: string;
  strokeWidth: number;
  fontSize: number;
  fontFamily: string;
  opacity: number;
}

export interface WatermarkOptions {
  text: string;
  fontSize: number;
  color: string;
  opacity: number;
  rotation: number;
  isTile: boolean;
  imageUrl?: string;
}

export interface PageNumberOptions {
  format: 'X' | 'Page X' | 'Page X of Y' | 'Trang X / Y';
  position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  fontSize: number;
  color: string;
  startNumber: number;
}

export type ModalType =
  | null
  | 'signature'
  | 'stamp'
  | 'split-merge'
  | 'security'
  | 'compress'
  | 'shortcuts'
  | 'ocr'
  | 'watermark'
  | 'page-number'
  | 'ai-assistant'
  | 'insert-page';
