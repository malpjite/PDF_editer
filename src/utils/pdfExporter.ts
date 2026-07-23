import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { Annotation, WatermarkOptions, PageNumberOptions, PDFMetadata } from '../types/pdf';

// Convert hex color (#rrggbb) or rgba to pdf-lib rgb
const parseColor = (colorStr: string) => {
  if (colorStr.startsWith('#')) {
    const hex = colorStr.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    return rgb(isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b);
  }
  if (colorStr.startsWith('rgb')) {
    const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      return rgb(parseInt(match[1]) / 255, parseInt(match[2]) / 255, parseInt(match[3]) / 255);
    }
  }
  return rgb(0.38, 0.4, 0.95);
};

// Fetch and cache the embedded Unicode font (NotoSans) for Vietnamese support
let cachedFontBytes: ArrayBuffer | null = null;
async function getUnicodeFontBytes(): Promise<ArrayBuffer | null> {
  if (cachedFontBytes) return cachedFontBytes;
  try {
    const fontUrl = 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf';
    const resp = await fetch(fontUrl);
    if (!resp.ok) throw new Error(`Font fetch failed: ${resp.status}`);
    cachedFontBytes = await resp.arrayBuffer();
    return cachedFontBytes;
  } catch (err) {
    console.warn('Could not load NotoSans Unicode font, falling back to Helvetica:', err);
    return null;
  }
}

export async function exportModifiedPDF(
  originalPdfBytes: ArrayBuffer,
  pageOrder: number[],
  pageRotations: Record<number, number>,
  deletedPages: Set<number>,
  annotations: Record<number, Annotation[]>,
  watermark?: WatermarkOptions | null,
  pageNumbering?: PageNumberOptions | null,
  metadata?: PDFMetadata | null,
  viewerScale?: number
): Promise<Uint8Array> {
  const originalDoc = await PDFDocument.load(originalPdfBytes);
  const newDoc = await PDFDocument.create();

  // Register fontkit for custom font embedding
  newDoc.registerFontkit(fontkit);

  // Embed Metadata
  if (metadata) {
    if (metadata.title) newDoc.setTitle(metadata.title);
    if (metadata.author) newDoc.setAuthor(metadata.author);
    if (metadata.subject) newDoc.setSubject(metadata.subject);
    if (metadata.keywords) newDoc.setKeywords(metadata.keywords.split(',').map((k) => k.trim()));
    if (metadata.creator) newDoc.setCreator(metadata.creator);
  }

  // Attempt to load Unicode font for Vietnamese text support
  const unicodeFontBytes = await getUnicodeFontBytes();
  let unicodeFont: any = null;
  if (unicodeFontBytes) {
    try {
      unicodeFont = await newDoc.embedFont(unicodeFontBytes, { subset: true });
    } catch (e) {
      console.warn('Failed to embed Unicode font:', e);
    }
  }

  const standardFont = await newDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await newDoc.embedFont(StandardFonts.HelveticaBold);

  // Use Unicode font as primary, fallback to standard
  const textFont = unicodeFont || standardFont;
  const textBoldFont = unicodeFont || boldFont;

  // The viewer renders at a specific scale (default 1.1). Annotations are
  // placed in viewer-pixel coordinates. We need to convert them to PDF points.
  const vScale = viewerScale || 1.1;

  const activePageIndices = pageOrder.filter((idx) => !deletedPages.has(idx));
  const totalActivePages = activePageIndices.length;

  for (let i = 0; i < totalActivePages; i++) {
    const origIndex = activePageIndices[i];

    const [copiedPage] = await newDoc.copyPages(originalDoc, [origIndex]);
    const page = newDoc.addPage(copiedPage);

    const additionalRotation = pageRotations[origIndex] || 0;
    if (additionalRotation !== 0) {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + additionalRotation) % 360));
    }

    const { width: pageWidth, height: pageHeight } = page.getSize();
    const pageAnns = annotations[origIndex] || [];

    // Render annotations - convert viewer coordinates to PDF coordinates
    for (const ann of pageAnns) {
      // Convert viewer pixel coords -> PDF point coords
      const pdfX = ann.x / vScale;
      const pdfY = ann.y / vScale;
      const pdfW = ann.width / vScale;
      const pdfH = ann.height / vScale;

      if (ann.type === 'text') {
        const font = ann.bold ? textBoldFont : textFont;
        const color = parseColor(ann.color);
        const pdfFontSize = (ann.fontSize || 14) / vScale;

        if (ann.backgroundColor && ann.backgroundColor !== 'transparent') {
          page.drawRectangle({
            x: pdfX,
            y: pageHeight - pdfY - pdfH,
            width: pdfW,
            height: pdfH,
            color: parseColor(ann.backgroundColor),
          });
        }

        // Safely draw text - catch encoding errors for unsupported glyphs
        try {
          page.drawText(ann.content || '', {
            x: pdfX + 4,
            y: pageHeight - pdfY - pdfFontSize,
            size: pdfFontSize,
            font,
            color,
          });
        } catch (e) {
          // If Unicode font fails for some glyphs, try with standard font
          console.warn('Font encoding error, retrying with fallback:', e);
          try {
            page.drawText(ann.content || '', {
              x: pdfX + 4,
              y: pageHeight - pdfY - pdfFontSize,
              size: pdfFontSize,
              font: standardFont,
              color,
            });
          } catch (e2) {
            console.error('Cannot render text annotation:', ann.content, e2);
          }
        }
      } else if (ann.type === 'draw' || ann.type === 'highlight') {
        if (ann.points && ann.points.length > 1) {
          const color = parseColor(ann.color);
          const isHigh = ann.type === 'highlight' || Boolean(ann.isHighlight);
          const opacity = isHigh ? 0.4 : ann.opacity || 1.0;
          const thickness = (ann.strokeWidth || 3) / vScale;

          for (let p = 0; p < ann.points.length - 1; p++) {
            const p1 = ann.points[p];
            const p2 = ann.points[p + 1];

            page.drawLine({
              start: { x: p1.x / vScale, y: pageHeight - p1.y / vScale },
              end: { x: p2.x / vScale, y: pageHeight - p2.y / vScale },
              thickness,
              color,
              opacity,
            });
          }
        }
      } else if (ann.type === 'rectangle') {
        page.drawRectangle({
          x: pdfX,
          y: pageHeight - pdfY - pdfH,
          width: pdfW,
          height: pdfH,
          borderColor: parseColor(ann.strokeColor),
          borderWidth: ann.strokeWidth / vScale,
          color: ann.fillColor !== 'transparent' ? parseColor(ann.fillColor) : undefined,
          opacity: ann.opacity,
        });
      } else if (ann.type === 'whiteout') {
        page.drawRectangle({
          x: pdfX,
          y: pageHeight - pdfY - pdfH,
          width: pdfW,
          height: pdfH,
          color: rgb(1, 1, 1),
        });
      } else if (ann.type === 'circle') {
        const rx = pdfW / 2;
        const ry = pdfH / 2;
        const cx = pdfX + rx;
        const cy = pageHeight - pdfY - ry;

        page.drawEllipse({
          x: cx,
          y: cy,
          xScale: rx,
          yScale: ry,
          borderColor: parseColor(ann.strokeColor),
          borderWidth: ann.strokeWidth / vScale,
          color: ann.fillColor !== 'transparent' ? parseColor(ann.fillColor) : undefined,
          opacity: ann.opacity,
        });
      } else if (ann.type === 'image' || ann.type === 'signature') {
        if (ann.dataUrl) {
          try {
            let embeddedImg;
            if (ann.dataUrl.startsWith('data:image/png')) {
              embeddedImg = await newDoc.embedPng(ann.dataUrl);
            } else if (ann.dataUrl.startsWith('data:image/jpeg') || ann.dataUrl.startsWith('data:image/jpg')) {
              embeddedImg = await newDoc.embedJpg(ann.dataUrl);
            }

            if (embeddedImg) {
              page.drawImage(embeddedImg, {
                x: pdfX,
                y: pageHeight - pdfY - pdfH,
                width: pdfW,
                height: pdfH,
              });
            }
          } catch (e) {
            console.error('Failed to embed image annotation into PDF:', e);
          }
        }
      } else if (ann.type === 'stamp') {
        const stampColor = parseColor(ann.color);
        page.drawRectangle({
          x: pdfX,
          y: pageHeight - pdfY - pdfH,
          width: pdfW,
          height: pdfH,
          borderColor: stampColor,
          borderWidth: 3 / vScale,
          color: rgb(1, 1, 1),
        });

        try {
          page.drawText(ann.text || '', {
            x: pdfX + 10 / vScale,
            y: pageHeight - pdfY - 24 / vScale,
            size: 16 / vScale,
            font: textBoldFont,
            color: stampColor,
          });
        } catch (e) {
          page.drawText(ann.text || '', {
            x: pdfX + 10 / vScale,
            y: pageHeight - pdfY - 24 / vScale,
            size: 16 / vScale,
            font: boldFont,
            color: stampColor,
          });
        }
      }
    }

    // Render Watermark if present
    if (watermark && watermark.text) {
      const wmColor = parseColor(watermark.color);
      if (watermark.isTile) {
        for (let x = 50; x < pageWidth; x += 220) {
          for (let y = 50; y < pageHeight; y += 180) {
            try {
              page.drawText(watermark.text, {
                x,
                y,
                size: watermark.fontSize * 0.6,
                font: textBoldFont,
                color: wmColor,
                opacity: watermark.opacity,
                rotate: degrees(watermark.rotation),
              });
            } catch {
              page.drawText(watermark.text, {
                x,
                y,
                size: watermark.fontSize * 0.6,
                font: boldFont,
                color: wmColor,
                opacity: watermark.opacity,
                rotate: degrees(watermark.rotation),
              });
            }
          }
        }
      } else {
        try {
          page.drawText(watermark.text, {
            x: pageWidth / 4,
            y: pageHeight / 2,
            size: watermark.fontSize,
            font: textBoldFont,
            color: wmColor,
            opacity: watermark.opacity,
            rotate: degrees(watermark.rotation),
          });
        } catch {
          page.drawText(watermark.text, {
            x: pageWidth / 4,
            y: pageHeight / 2,
            size: watermark.fontSize,
            font: boldFont,
            color: wmColor,
            opacity: watermark.opacity,
            rotate: degrees(watermark.rotation),
          });
        }
      }
    }

    // Render Page Numbering if present
    if (pageNumbering) {
      const displayNum = i + (pageNumbering.startNumber || 1);
      let pageStr = `${displayNum}`;
      if (pageNumbering.format === 'Trang X / Y') pageStr = `Trang ${displayNum} / ${totalActivePages}`;
      else if (pageNumbering.format === 'Page X of Y') pageStr = `Page ${displayNum} of ${totalActivePages}`;
      else if (pageNumbering.format === 'Page X') pageStr = `Page ${displayNum}`;

      const numColor = parseColor(pageNumbering.color || '#000000');
      const fontSize = pageNumbering.fontSize || 12;

      let xPos = 20;
      let yPos = 20;

      if (pageNumbering.position.includes('center')) xPos = pageWidth / 2 - (pageStr.length * fontSize) / 4;
      else if (pageNumbering.position.includes('right')) xPos = pageWidth - 100;

      if (pageNumbering.position.includes('top')) yPos = pageHeight - 30;

      page.drawText(pageStr, {
        x: xPos,
        y: yPos,
        size: fontSize,
        font: standardFont,
        color: numColor,
      });
    }
  }

  return await newDoc.save();
}
