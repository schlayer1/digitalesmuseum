import * as pdfjsLib from 'pdfjs-dist';
import { alsJpeg, begrenzt } from './museumHelpers';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export type PdfDocHandle = pdfjsLib.PDFDocumentProxy;

export async function openPdfFile(file: File | Blob): Promise<PdfDocHandle> {
  const data = new Uint8Array(await file.arrayBuffer());
  return pdfjsLib.getDocument({
    data,
    isEvalSupported: false,
    disableAutoFetch: true,
  }).promise;
}

export async function renderPdfPageCanvas(doc: PdfDocHandle, pageNum: number, maxEdge: number): Promise<HTMLCanvasElement> {
  const page = await doc.getPage(pageNum);
  const v1 = page.getViewport({ scale: 1 });
  const scale = begrenzt(maxEdge / Math.max(v1.width, v1.height), 0.1, 4);
  const vp = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(vp.width);
  canvas.height = Math.round(vp.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Kein Canvas-Kontext für PDF-Seite.');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport: vp }).promise;
  page.cleanup();
  return canvas;
}

export async function renderPdfPageJpeg(
  doc: PdfDocHandle,
  pageNum: number,
  maxEdge: number
): Promise<{ blob: Blob; w: number; h: number }> {
  const c = await renderPdfPageCanvas(doc, pageNum, maxEdge);
  return alsJpeg(c, c.width, c.height);
}
