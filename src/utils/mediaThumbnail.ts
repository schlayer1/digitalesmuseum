import { alsJpeg } from './museumHelpers';

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (!line || ctx.measureText(test).width <= maxW) line = test;
    else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

/**
 * Erzeugt aus einer Videodatei ein Poster-Vorschaubild (mit echtem Video-Frame + Play-Badge)
 * für den 3D-Bilderrahmen.
 */
export async function createVideoThumbnail(
  file: File,
  title: string
): Promise<{ blob: Blob; w: number; h: number }> {
  const W = 1280;
  const H = 720;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#091D2E';
  ctx.fillRect(0, 0, W, H);

  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.src = url;

    await new Promise<void>((resolve) => {
      const done = () => resolve();
      video.addEventListener('seeked', done, { once: true });
      video.addEventListener('error', done, { once: true });
      video.addEventListener(
        'loadeddata',
        () => {
          try {
            video.currentTime = Math.min(1, (video.duration || 2) * 0.2);
          } catch {
            resolve();
          }
        },
        { once: true }
      );
      setTimeout(resolve, 2500);
    });

    if (video.videoWidth > 0 && video.videoHeight > 0) {
      const scale = Math.max(W / video.videoWidth, H / video.videoHeight);
      const dw = video.videoWidth * scale;
      const dh = video.videoHeight * scale;
      ctx.drawImage(video, (W - dw) / 2, (H - dh) / 2, dw, dh);
      ctx.fillStyle = 'rgba(9, 29, 46, 0.36)';
      ctx.fillRect(0, 0, W, H);
    }
  } catch {
    // Fallback gradient background if codec cannot be decoded in headless/browser
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#091D2E');
    grad.addColorStop(1, '#0B7BA7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  } finally {
    URL.revokeObjectURL(url);
  }

  // Play circle
  ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
  ctx.beginPath();
  ctx.arc(W / 2, H / 2 - 20, 74, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0B7BA7';
  ctx.beginPath();
  ctx.moveTo(W / 2 - 22, H / 2 - 52);
  ctx.lineTo(W / 2 + 38, H / 2 - 20);
  ctx.lineTo(W / 2 - 22, H / 2 + 12);
  ctx.closePath();
  ctx.fill();

  // Bottom bar with label
  ctx.fillStyle = 'rgba(9, 29, 46, 0.85)';
  ctx.fillRect(0, H - 150, W, 150);
  ctx.fillStyle = '#F39200';
  ctx.font = '800 26px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VIDEO-PRÄSENTATION · ANTIPPEN ZUM ABSPIELEN', W / 2, H - 102);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 40px "Plus Jakarta Sans", system-ui, sans-serif';
  const lines = wrapLines(ctx, title || file.name, W - 120);
  ctx.fillText(lines[0] || 'Video-Exponat', W / 2, H - 46);

  return alsJpeg(canvas, W, H);
}

/**
 * Erzeugt ein gestaltetes Plakat-Cover für ein Audio-Exponat (Podcast, Hörspiel, Musikbeitrag)
 * für den 3D-Bilderrahmen.
 */
export async function createAudioThumbnail(
  fileName: string,
  title: string
): Promise<{ blob: Blob; w: number; h: number }> {
  const W = 1200;
  const H = 900;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#FFFBF5';
  ctx.fillRect(0, 0, W, H);

  // Header band in HBS Blue
  ctx.fillStyle = '#0B7BA7';
  ctx.fillRect(0, 0, W, 220);

  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.fillRect(0, 206, W, 14);

  ctx.fillStyle = '#E6F4F8';
  ctx.font = '800 26px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('AUDIO-BEITRAG · HBS MUSEUM', W / 2, 74);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 54px Georgia, serif';
  const lines = wrapLines(ctx, title || fileName, W - 120);
  lines.forEach((l, i) => ctx.fillText(l, W / 2, 140 + i * 62));

  // Decorative waveform bars
  const bars = 28;
  const barW = 20;
  const gap = 14;
  const startX = W / 2 - (bars * (barW + gap) - gap) / 2;
  for (let i = 0; i < bars; i++) {
    const h = 60 + Math.abs(Math.sin(i * 0.55) * Math.cos(i * 0.23)) * 240;
    ctx.fillStyle = i % 3 === 0 ? '#F39200' : i % 2 === 0 ? '#00A896' : '#0B7BA7';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') ctx.roundRect(startX + i * (barW + gap), 470 - h / 2, barW, h, 10);
    else ctx.rect(startX + i * (barW + gap), 470 - h / 2, barW, h);
    ctx.fill();
  }

  ctx.fillStyle = '#2C3E50';
  ctx.font = '700 32px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('🎧 In der Nahansicht anhören', W / 2, 740);
  ctx.fillStyle = '#4A5568';
  ctx.font = '500 24px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(fileName.slice(0, 56), W / 2, 792);

  return alsJpeg(canvas, W, H);
}
