import * as pdfjs from 'pdfjs-dist';

// Configure pdfjs worker to load from CDN fallback or local module
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version || '4.0.379'}/build/pdf.worker.min.mjs`;

export { pdfjs };
