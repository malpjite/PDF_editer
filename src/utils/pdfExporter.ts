import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
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

export async function exportModifiedPDF(
  originalPdfBytes: ArrayBuffer,
  pageOrder: number[],
  pageRotations: Record<number, number>,
  deletedPages: Set<number>,
  annotations: Record<number, Annotation[]>,
  watermark?: WatermarkOptions | null,
  pageNumbering?: PageNumberOptions | null,
  metadata?: PDFMetadata | null
): Promise<Uint8Array> {
  const originalDoc = await PDFDocument.load(originalPdfBytes);
  const newDoc = await PDFDocument.create();

  // Embed Metadata
  if (metadata) {
    if (metadata.title) newDoc.setTitle(metadata.title);
    if (metadata.author) newDoc.setAuthor(metadata.author);
    if (metadata.subject) newDoc.setSubject(metadata.subject);
    if (metadata.keywords) newDoc.setKeywords(metadata.keywords.split(',').map((k) => k.trim()));
    if (metadata.creator) newDoc.setCreator(metadata.creator);
  }

  const standardFont = await newDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await newDoc.embedFont(StandardFonts.HelveticaBold);

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

    // Render annotations
    for (const ann of pageAnns) {
      if (ann.type === 'text') {
        const font = ann.bold ? boldFont : standardFont;
        const color = parseColor(ann.color);

        if (ann.backgroundColor && ann.backgroundColor !== 'transparent') {
          page.drawRectangle({
            x: ann.x,
            y: pageHeight - ann.y - ann.height,
            width: ann.width,
            height: ann.height,
            color: parseColor(ann.backgroundColor),
          });
        }

        page.drawText(ann.content, {
          x: ann.x + 4,
          y: pageHeight - ann.y - ann.fontSize,
          size: ann.fontSize,
          font,
          color,
        });
      } else if (ann.type === 'draw' || ann.type === 'highlight') {
        if (ann.points && ann.points.length > 1) {
          const color = parseColor(ann.color);
          const isHigh = ann.type === 'highlight' || Boolean(ann.isHighlight);
          const opacity = isHigh ? 0.4 : ann.opacity || 1.0;
          const thickness = ann.strokeWidth || 3;

          for (let p = 0; p < ann.points.length - 1; p++) {
            const p1 = ann.points[p];
            const p2 = ann.points[p + 1];

            page.drawLine({
              start: { x: p1.x, y: pageHeight - p1.y },
              end: { x: p2.x, y: pageHeight - p2.y },
              thickness,
              color,
              opacity,
            });
          }
        }
      } else if (ann.type === 'rectangle') {
        page.drawRectangle({
          x: ann.x,
          y: pageHeight - ann.y - ann.height,
          width: ann.width,
          height: ann.height,
          borderColor: parseColor(ann.strokeColor),
          borderWidth: ann.strokeWidth,
          color: ann.fillColor !== 'transparent' ? parseColor(ann.fillColor) : undefined,
          opacity: ann.opacity,
        });
      } else if (ann.type === 'whiteout') {
        page.drawRectangle({
          x: ann.x,
          y: pageHeight - ann.y - ann.height,
          width: ann.width,
          height: ann.height,
          color: rgb(1, 1, 1),
        });
      } else if (ann.type === 'circle') {
        const rx = ann.width / 2;
        const ry = ann.height / 2;
        const cx = ann.x + rx;
        const cy = pageHeight - ann.y - ry;

        page.drawEllipse({
          x: cx,
          y: cy,
          xScale: rx,
          yScale: ry,
          borderColor: parseColor(ann.strokeColor),
          borderWidth: ann.strokeWidth,
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
                x: ann.x,
                y: pageHeight - ann.y - ann.height,
                width: ann.width,
                height: ann.height,
              });
            }
          } catch (e) {
            console.error('Failed to embed image annotation into PDF:', e);
          }
        }
      } else if (ann.type === 'stamp') {
        const stampColor = parseColor(ann.color);
        page.drawRectangle({
          x: ann.x,
          y: pageHeight - ann.y - ann.height,
          width: ann.width,
          height: ann.height,
          borderColor: stampColor,
          borderWidth: 3,
          color: rgb(1, 1, 1),
        });

        page.drawText(ann.text, {
          x: ann.x + 10,
          y: pageHeight - ann.y - 24,
          size: 16,
          font: boldFont,
          color: stampColor,
        });
      }
    }

    // Render Watermark if present
    if (watermark && watermark.text) {
      const wmColor = parseColor(watermark.color);
      if (watermark.isTile) {
        for (let x = 50; x < pageWidth; x += 220) {
          for (let y = 50; y < pageHeight; y += 180) {
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
      } else {
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
