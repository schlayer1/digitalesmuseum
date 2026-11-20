import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import { alsJpeg } from './museumHelpers';

export interface ConvertedPptxSlide {
  pageNumber: number;
  blob: Blob;
  w: number;
  h: number;
  titleText: string;
}

export interface PptxConversionResult {
  slides: ConvertedPptxSlide[];
  pdfBlob: Blob;
  totalSlides: number;
}

function parseXml(xmlStr: string): Document {
  return new DOMParser().parseFromString(xmlStr, 'application/xml');
}

function getElementsByLocalName(root: Document | Element, localName: string): Element[] {
  const out: Element[] = [];
  const all = root.getElementsByTagName('*');
  for (let i = 0; i < all.length; i++) {
    if (all[i].localName === localName) {
      out.push(all[i]);
    }
  }
  return out;
}

function resolveZipPath(baseDir: string, target: string): string {
  const cleanTarget = target.replace(/^\/+/, '');
  const parts = (baseDir ? baseDir.split('/') : []).concat(cleanTarget.split('/'));
  const stack: string[] = [];
  for (const p of parts) {
    if (!p || p === '.') continue;
    if (p === '..') stack.pop();
    else stack.push(p);
  }
  return stack.join('/');
}

function extractColorHex(node: Element | null | undefined): string | null {
  if (!node) return null;
  const srgb = getElementsByLocalName(node, 'srgbClr')[0];
  if (srgb) {
    const val = srgb.getAttribute('val');
    if (val && /^[0-9A-Fa-f]{6}$/.test(val)) return `#${val}`;
  }
  return null;
}

function isDarkHex(hex: string): boolean {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return false;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b < 135;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const candidate = line ? `${line} ${w}` : w;
    if (!line || ctx.measureText(candidate).width <= maxWidth) {
      line = candidate;
    } else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

interface ParsedShapeBox {
  x: number; // normalized 0..1
  y: number;
  w: number;
  h: number;
  fillHex: string | null;
  paragraphs: { text: string; fontSizePt: number; bold: boolean; colorHex: string | null; isBullet: boolean; align: 'left' | 'center' | 'right' }[];
}

interface ParsedPictureBox {
  x: number;
  y: number;
  w: number;
  h: number;
  mediaPath: string;
}

async function loadZipImage(zip: JSZip, mediaPath: string): Promise<HTMLImageElement | null> {
  const entry = zip.file(mediaPath);
  if (!entry) return null;
  const ext = mediaPath.split('.').pop()?.toLowerCase() || 'png';
  const mime =
    ext === 'jpg' || ext === 'jpeg'
      ? 'image/jpeg'
      : ext === 'webp'
        ? 'image/webp'
        : ext === 'gif'
          ? 'image/gif'
          : ext === 'svg'
            ? 'image/svg+xml'
            : 'image/png';
  const bytes = await entry.async('uint8array');
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: mime });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } catch {
    return null;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

/**
 * Konvertiert eine PowerPoint-Datei (.pptx) vollständig im Browser in hochauflösende 16:9-Folienbilder
 * sowie ein echtes mehrseitiges PDF-Dokument (via jszip + jspdf).
 */
export async function convertPptxToSlidesAndPdf(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<PptxConversionResult> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());

  // Determine slide dimensions from ppt/presentation.xml (in EMUs, default 16:9 12192000 x 6858000)
  let slideWidthEmu = 12192000;
  let slideHeightEmu = 6858000;
  const orderedSlidePaths: string[] = [];

  const presFile = zip.file('ppt/presentation.xml');
  const presRelsFile = zip.file('ppt/_rels/presentation.xml.rels');

  if (presFile) {
    const presDoc = parseXml(await presFile.async('string'));
    const sldSz = getElementsByLocalName(presDoc, 'sldSz')[0];
    if (sldSz) {
      const cx = Number(sldSz.getAttribute('cx'));
      const cy = Number(sldSz.getAttribute('cy'));
      if (cx > 0 && cy > 0) {
        slideWidthEmu = cx;
        slideHeightEmu = cy;
      }
    }

    if (presRelsFile) {
      const relDoc = parseXml(await presRelsFile.async('string'));
      const relMap = new Map<string, string>();
      for (const rel of getElementsByLocalName(relDoc, 'Relationship')) {
        const id = rel.getAttribute('Id') || '';
        const target = rel.getAttribute('Target') || '';
        if (id && target) relMap.set(id, resolveZipPath('ppt', target));
      }
      for (const sldId of getElementsByLocalName(presDoc, 'sldId')) {
        const rId = sldId.getAttribute('r:id') || sldId.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') || '';
        const resolved = relMap.get(rId);
        if (resolved && zip.file(resolved)) orderedSlidePaths.push(resolved);
      }
    }
  }

  if (orderedSlidePaths.length === 0) {
    const fallbackSlides = Object.keys(zip.files)
      .filter((k) => /^ppt\/slides\/slide\d+\.xml$/i.test(k))
      .sort((a, b) => {
        const na = parseInt(a.match(/\d+/)?.[0] || '0', 10);
        const nb = parseInt(b.match(/\d+/)?.[0] || '0', 10);
        return na - nb;
      });
    orderedSlidePaths.push(...fallbackSlides);
  }

  if (orderedSlidePaths.length === 0) {
    throw new Error('Keine Folien in der PPTX-Datei gefunden. Bitte als PDF exportieren.');
  }

  const W = 1920;
  const H = Math.max(720, Math.round((W * slideHeightEmu) / slideWidthEmu));
  const pdf = new jsPDF({
    orientation: W >= H ? 'landscape' : 'portrait',
    unit: 'px',
    format: [W, H],
    compress: true,
  });

  const slides: ConvertedPptxSlide[] = [];

  for (let idx = 0; idx < orderedSlidePaths.length; idx++) {
    onProgress?.(idx + 1, orderedSlidePaths.length);
    const slidePath = orderedSlidePaths[idx];
    const slideXmlStr = await zip.file(slidePath)!.async('string');
    const slideDoc = parseXml(slideXmlStr);

    // Load slide relationships for embedded images
    const slideFileName = slidePath.split('/').pop()!;
    const relsPath = `ppt/slides/_rels/${slideFileName}.rels`;
    const slideRels = new Map<string, string>();
    const relsEntry = zip.file(relsPath);
    if (relsEntry) {
      const relDoc = parseXml(await relsEntry.async('string'));
      for (const rel of getElementsByLocalName(relDoc, 'Relationship')) {
        const id = rel.getAttribute('Id') || '';
        const target = rel.getAttribute('Target') || '';
        if (id && target) {
          slideRels.set(id, resolveZipPath('ppt/slides', target));
        }
      }
    }

    // Background color
    let bgHex = '#ffffff';
    const bgNode = getElementsByLocalName(slideDoc, 'bg')[0];
    if (bgNode) {
      bgHex = extractColorHex(bgNode) || '#ffffff';
    }

    // Extract pictures & shapes
    const pictures: ParsedPictureBox[] = [];
    for (const pic of getElementsByLocalName(slideDoc, 'pic')) {
      const blip = getElementsByLocalName(pic, 'blip')[0];
      const rEmbed =
        blip?.getAttribute('r:embed') ||
        blip?.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'embed') ||
        '';
      const mediaPath = slideRels.get(rEmbed);
      const xfrm = getElementsByLocalName(pic, 'xfrm')[0];
      const off = xfrm ? getElementsByLocalName(xfrm, 'off')[0] : null;
      const ext = xfrm ? getElementsByLocalName(xfrm, 'ext')[0] : null;
      if (!mediaPath || !off || !ext) continue;
      const x = Number(off.getAttribute('x') || 0) / slideWidthEmu;
      const y = Number(off.getAttribute('y') || 0) / slideHeightEmu;
      const w = Number(ext.getAttribute('cx') || 0) / slideWidthEmu;
      const h = Number(ext.getAttribute('cy') || 0) / slideHeightEmu;
      if (w > 0 && h > 0) pictures.push({ x, y, w, h, mediaPath });
    }

    const shapes: ParsedShapeBox[] = [];
    let slideTitle = '';

    for (const sp of getElementsByLocalName(slideDoc, 'sp')) {
      const xfrm = getElementsByLocalName(sp, 'xfrm')[0];
      const off = xfrm ? getElementsByLocalName(xfrm, 'off')[0] : null;
      const ext = xfrm ? getElementsByLocalName(xfrm, 'ext')[0] : null;

      const x = off ? Number(off.getAttribute('x') || 0) / slideWidthEmu : 0.06;
      const y = off ? Number(off.getAttribute('y') || 0) / slideHeightEmu : 0.08;
      const w = ext ? Number(ext.getAttribute('cx') || 0) / slideWidthEmu : 0.88;
      const h = ext ? Number(ext.getAttribute('cy') || 0) / slideHeightEmu : 0.25;

      const spPr = getElementsByLocalName(sp, 'spPr')[0];
      const fillHex = spPr ? extractColorHex(getElementsByLocalName(spPr, 'solidFill')[0]) : null;

      const ph = getElementsByLocalName(sp, 'ph')[0];
      const phType = ph?.getAttribute('type') || '';
      const isTitlePlaceholder = phType === 'title' || phType === 'ctrTitle';

      const paragraphs: ParsedShapeBox['paragraphs'] = [];
      const txBody = getElementsByLocalName(sp, 'txBody')[0];
      if (txBody) {
        for (const p of getElementsByLocalName(txBody, 'p')) {
          const pPr = getElementsByLocalName(p, 'pPr')[0];
          const algn = pPr?.getAttribute('algn');
          const align: 'left' | 'center' | 'right' =
            algn === 'ctr' ? 'center' : algn === 'r' ? 'right' : isTitlePlaceholder ? 'center' : 'left';
          const buNone = pPr ? getElementsByLocalName(pPr, 'buNone').length > 0 : false;
          const buChar = pPr ? getElementsByLocalName(pPr, 'buChar').length > 0 || getElementsByLocalName(pPr, 'buAutoNum').length > 0 : false;

          const runs = getElementsByLocalName(p, 'r');
          let fullText = '';
          let fontSizePt = isTitlePlaceholder ? 38 : 22;
          let bold = isTitlePlaceholder;
          let colorHex: string | null = null;

          for (const r of runs) {
            const tNode = getElementsByLocalName(r, 't')[0];
            if (tNode?.textContent) fullText += tNode.textContent;
            const rPr = getElementsByLocalName(r, 'rPr')[0];
            if (rPr) {
              const sz = Number(rPr.getAttribute('sz') || 0);
              if (sz > 0) fontSizePt = sz / 100;
              if (rPr.getAttribute('b') === '1') bold = true;
              const c = extractColorHex(getElementsByLocalName(rPr, 'solidFill')[0]);
              if (c) colorHex = c;
            }
          }
          if (!fullText) {
            for (const tNode of getElementsByLocalName(p, 't')) {
              if (tNode.textContent) fullText += tNode.textContent;
            }
          }

          const clean = fullText.trim();
          if (!clean) continue;
          if (isTitlePlaceholder && !slideTitle) slideTitle = clean;

          paragraphs.push({
            text: clean,
            fontSizePt,
            bold,
            colorHex,
            isBullet: !isTitlePlaceholder && !buNone && (buChar || paragraphs.length > 0),
            align,
          });
        }
      }

      if (fillHex || paragraphs.length > 0) {
        shapes.push({ x, y, w, h, fillHex, paragraphs });
      }
    }

    // Also include table cells if any tables exist
    for (const tbl of getElementsByLocalName(slideDoc, 'tbl')) {
      const rows = getElementsByLocalName(tbl, 'tr');
      const tableLines: string[] = [];
      for (const row of rows) {
        const cells = getElementsByLocalName(row, 'tc').map((tc) =>
          getElementsByLocalName(tc, 't')
            .map((t) => t.textContent || '')
            .join(' ')
            .trim()
        );
        const line = cells.filter(Boolean).join('  |  ');
        if (line) tableLines.push(line);
      }
      if (tableLines.length) {
        shapes.push({
          x: 0.06,
          y: 0.25,
          w: 0.88,
          h: 0.65,
          fillHex: '#f8fafc',
          paragraphs: tableLines.map((t) => ({
            text: t,
            fontSizePt: 18,
            bold: false,
            colorHex: '#091D2E',
            isBullet: false,
            align: 'left',
          })),
        });
      }
    }

    // Draw slide onto high-res 1920x1080 Canvas
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = bgHex;
    ctx.fillRect(0, 0, W, H);

    // Subtle top accent bar matching HBS if plain white slide
    if (bgHex.toLowerCase() === '#ffffff') {
      ctx.fillStyle = '#0B7BA7';
      ctx.fillRect(0, 0, W, 14);
    }

    // Draw pictures first (or background-sized images)
    for (const pic of pictures) {
      const img = await loadZipImage(zip, pic.mediaPath);
      if (!img) continue;
      const dx = pic.x * W;
      const dy = pic.y * H;
      const dw = pic.w * W;
      const dh = pic.h * H;
      ctx.drawImage(img, dx, dy, dw, dh);
    }

    // Draw shapes and text
    for (const sh of shapes) {
      const sx = sh.x * W;
      const sy = sh.y * H;
      const sw = Math.max(120, sh.w * W);
      const shH = Math.max(40, sh.h * H);

      if (sh.fillHex) {
        ctx.fillStyle = sh.fillHex;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') ctx.roundRect(sx, sy, sw, shH, 16);
        else ctx.rect(sx, sy, sw, shH);
        ctx.fill();
      }

      const defaultDarkText = isDarkHex(sh.fillHex || bgHex) ? '#ffffff' : '#091D2E';
      let cursorY = sy + 18;
      const padX = 24;

      for (const p of sh.paragraphs) {
        const pxSize = Math.max(20, Math.min(76, Math.round(p.fontSizePt * (W / 960))));
        ctx.font = `${p.bold ? '700 ' : '400 '}${pxSize}px "Plus Jakarta Sans", Calibri, system-ui, sans-serif`;
        ctx.fillStyle = p.colorHex || defaultDarkText;
        ctx.textBaseline = 'top';
        ctx.textAlign = p.align;

        const prefix = p.isBullet ? '•  ' : '';
        const lines = wrapLines(ctx, prefix + p.text, Math.max(120, sw - padX * 2));
        for (const l of lines) {
          if (cursorY > sy + shH + 60) break;
          const drawX = p.align === 'center' ? sx + sw / 2 : p.align === 'right' ? sx + sw - padX : sx + padX;
          ctx.fillText(l, drawX, cursorY);
          cursorY += Math.round(pxSize * 1.28);
        }
        cursorY += Math.round(pxSize * 0.25);
      }
    }

    // Footer slide number badge
    ctx.fillStyle = isDarkHex(bgHex) ? 'rgba(255,255,255,0.55)' : 'rgba(9,29,46,0.45)';
    ctx.font = '600 22px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`Folie ${idx + 1} / ${orderedSlidePaths.length}`, W - 36, H - 24);

    const jpg = await alsJpeg(canvas, W, H);
    slides.push({
      pageNumber: idx + 1,
      blob: jpg.blob,
      w: jpg.w,
      h: jpg.h,
      titleText: slideTitle || `Folie ${idx + 1}`,
    });

    if (idx > 0) pdf.addPage([W, H], W >= H ? 'landscape' : 'portrait');
    const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
    pdf.addImage(dataUrl, 'JPEG', 0, 0, W, H);
  }

  const pdfBlob = pdf.output('blob');
  return { slides, pdfBlob, totalSlides: orderedSlidePaths.length };
}
