import * as pdfjs from 'pdfjs-dist';

// Configure PDF.js workerSrc with robust fallback for local dev, Vercel & production
if (typeof window !== 'undefined') {
  try {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } catch (e) {
    const version = pdfjs.version || '4.0.379';
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;
  }
}

export { pdfjs };
