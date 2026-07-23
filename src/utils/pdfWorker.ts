import * as pdfjs from 'pdfjs-dist';

// Configure pdfjs worker to load from jsDelivr / cdnjs fallback for production Vercel deployment
if (typeof window !== 'undefined') {
  const version = pdfjs.version || '4.0.379';
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
}

export { pdfjs };
