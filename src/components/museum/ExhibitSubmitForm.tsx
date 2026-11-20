import React, { useEffect, useState } from 'react';
import { Dices, FileText, Film, Headphones, Presentation, Upload } from 'lucide-react';
import { AnnotationItem, Exponat, MediaType, MuseumAusstellung } from '../../types/museum';
import {
  alsJpeg,
  getSavedNickname,
  loadImageFromBlob,
  mehrzahl,
  randomId,
  readStorage,
  removeStorage,
  SEITEN_MAX,
  setSavedNickname,
  spitzname,
  writeStorage,
  KANTE_MAX,
} from '../../utils/museumHelpers';
import { openPdfFile, PdfDocHandle, renderPdfPageCanvas, renderPdfPageJpeg } from '../../utils/pdfProcessor';
import { convertPptxToSlidesAndPdf } from '../../utils/pptxConverter';
import { createAudioThumbnail, createVideoThumbnail } from '../../utils/mediaThumbnail';
import { rotateAnnotations90 } from '../../utils/annotations';
import {
  buildMuseumR2Key,
  collectExhibitR2Keys,
  deleteKeysFromR2,
  resolvePageImageUrl,
  uploadBlobToR2,
} from '../../services/r2Storage';
import { AnnotatorModal } from './AnnotatorModal';
import { HbsBadge, HbsButton, HbsCard, HbsModal } from '../hbs/HbsKit';

interface DraftPage {
  blob: Blob;
  url: string;
  w: number;
  h: number;
  quelle: string;
  anm: AnnotationItem[];
  r2Key?: string;
}

interface ExhibitSubmitFormProps {
  museum: MuseumAusstellung;
  deviceId: string;
  existing: Exponat | null;
  isDemo: boolean;
  onSubmitted: (exhibit: Exponat) => void;
  onCancel: () => void;
  onToast: (msg: string) => void;
}

export const ExhibitSubmitForm: React.FC<ExhibitSubmitFormProps> = ({
  museum,
  deviceId,
  existing,
  isDemo,
  onSubmitted,
  onCancel,
  onToast,
}) => {
  const draftKey = `entwurf-${museum.code}`;
  const savedDraft = readStorage<{ titel?: string; text?: string }>(draftKey, {});

  const [nickname, setNickname] = useState(() => existing?.name || getSavedNickname() || '');
  const [titel, setTitel] = useState(() => existing?.titel || savedDraft.titel || '');
  const [text, setText] = useState(() => existing?.text || savedDraft.text || '');
  const [seiten, setSeiten] = useState<DraftPage[]>([]);
  const [mediaType, setMediaType] = useState<MediaType>(existing?.mediaType || 'image');
  const [mediaFile, setMediaFile] = useState<{ blob: Blob; fileName: string; mimeType: string; kind: 'video' | 'audio' | 'pdf' | 'pptx' } | null>(null);
  const [audioCompanionFile, setAudioCompanionFile] = useState<{ blob: Blob; fileName: string; mimeType: string } | null>(null);

  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(Boolean(existing));
  const [editHelpIdx, setEditHelpIdx] = useState<number | null>(null);

  // PDF/PPTX Page Picker Modal when >10 pages
  const [pdfPicker, setPdfPicker] = useState<{
    title: string;
    total: number;
    maxSelect: number;
    thumbs: string[];
    selected: Set<number>;
    resolve: (pages: number[] | null) => void;
  } | null>(null);

  useEffect(() => {
    if (!existing) {
      writeStorage(draftKey, { titel, text });
    }
  }, [titel, text, existing, draftKey]);

  useEffect(() => {
    if (!existing) return;
    let cancelled = false;
    (async () => {
      setStatus('Bisherige Seiten werden geladen …');
      const loaded: DraftPage[] = [];
      for (let i = 0; i < existing.pages.length; i++) {
        const p = existing.pages[i];
        const url = resolvePageImageUrl(p);
        try {
          const res = await fetch(url);
          const blob = await res.blob();
          if (cancelled) return;
          loaded.push({
            blob,
            url: URL.createObjectURL(blob),
            w: p.width,
            h: p.height,
            quelle: p.sourceLabel || 'bisher',
            anm: existing.anm?.[String(i)] || [],
            r2Key: p.r2Key,
          });
        } catch {
          // ignore single failed page
        }
      }
      if (!cancelled) {
        setSeiten(loaded);
        setLoadingExisting(false);
        setStatus('');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [existing]);

  const askPageSelection = (total: number, maxSelect: number, thumbs: string[], modalTitle: string): Promise<number[] | null> => {
    return new Promise((resolve) => {
      const initial = new Set<number>();
      for (let i = 1; i <= Math.min(total, maxSelect); i++) initial.add(i);
      setPdfPicker({
        title: modalTitle,
        total,
        maxSelect,
        thumbs,
        selected: initial,
        resolve,
      });
    });
  };

  const handleFiles = async (files: File[]) => {
    for (const f of files) {
      const frei = SEITEN_MAX - seiten.length;
      if (frei <= 0) {
        onToast(`Mehr als ${SEITEN_MAX} Seiten gehen nicht.`);
        break;
      }

      const lower = f.name.toLowerCase();
      const isPdf = f.type === 'application/pdf' || lower.endsWith('.pdf');
      const isPptx = lower.endsWith('.pptx');
      const isVideo = f.type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(lower);
      const isAudio = f.type.startsWith('audio/') || /\.(mp3|m4a|wav|ogg)$/i.test(lower);
      const isImage = f.type.startsWith('image/') || /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(lower);

      try {
        if (isVideo) {
          setStatus('Video-Vorschau wird erstellt …');
          const thumb = await createVideoThumbnail(f, titel || f.name);
          setSeiten([{ ...thumb, url: URL.createObjectURL(thumb.blob), quelle: 'Video', anm: [] }]);
          setMediaType('video');
          setMediaFile({ blob: f, fileName: f.name, mimeType: f.type || 'video/mp4', kind: 'video' });
        } else if (isAudio) {
          setStatus('Audio-Poster wird erstellt …');
          const thumb = await createAudioThumbnail(f.name, titel || f.name);
          setSeiten([{ ...thumb, url: URL.createObjectURL(thumb.blob), quelle: 'Audio', anm: [] }]);
          setMediaType('audio');
          setMediaFile({ blob: f, fileName: f.name, mimeType: f.type || 'audio/mpeg', kind: 'audio' });
        } else if (isPptx) {
          setStatus('PPTX-Präsentation wird in PDF & Folien konvertiert …');
          const converted = await convertPptxToSlidesAndPdf(f, (cur, tot) => {
            setStatus(`PPTX → PDF Konverter: Folie ${cur} von ${tot} …`);
          });
          setMediaType('pptx');
          setMediaFile({
            blob: converted.pdfBlob,
            fileName: f.name.replace(/\.pptx$/i, '.pdf'),
            mimeType: 'application/pdf',
            kind: 'pdf',
          });
          let chosen = converted.slides;
          if (converted.slides.length > frei) {
            const thumbs = converted.slides.slice(0, 40).map((s) => URL.createObjectURL(s.blob));
            const picked = await askPageSelection(
              converted.slides.length,
              frei,
              thumbs,
              'Welche PowerPoint-Folien sollen ins Museum?'
            );
            thumbs.forEach((u) => URL.revokeObjectURL(u));
            if (!picked) {
              setStatus('');
              continue;
            }
            chosen = picked.map((n) => converted.slides[n - 1]).filter(Boolean);
          }
          setSeiten((prev) => [
            ...prev,
            ...chosen.slice(0, frei).map((s) => ({
              blob: s.blob,
              w: s.w,
              h: s.h,
              url: URL.createObjectURL(s.blob),
              quelle: `PPTX Folie ${s.pageNumber}`,
              anm: [],
            })),
          ]);
          onToast(`PPTX erfolgreich in ${converted.totalSlides} Folien + PDF konvertiert!`);
        } else if (isPdf) {
          setStatus('PDF wird geöffnet …');
          const doc: PdfDocHandle = await openPdfFile(f);
          let nummern = Array.from({ length: Math.min(doc.numPages, frei) }, (_, i) => i + 1);
          if (doc.numPages > frei) {
            const thumbCount = Math.min(doc.numPages, 40);
            const thumbs: string[] = [];
            for (let i = 1; i <= thumbCount; i++) {
              const c = await renderPdfPageCanvas(doc, i, 220);
              thumbs.push(c.toDataURL('image/jpeg', 0.7));
            }
            const picked = await askPageSelection(doc.numPages, frei, thumbs, 'Welche PDF-Seiten sollen ins Museum?');
            if (!picked) {
              doc.destroy();
              setStatus('');
              continue;
            }
            nummern = picked;
          }
          for (let k = 0; k < nummern.length; k++) {
            const n = nummern[k];
            setStatus(`PDF-Seite ${n} wird gerendert (${k + 1} / ${nummern.length}) …`);
            const jpg = await renderPdfPageJpeg(doc, n, KANTE_MAX);
            setSeiten((prev) =>
              prev.length >= SEITEN_MAX
                ? prev
                : [...prev, { ...jpg, url: URL.createObjectURL(jpg.blob), quelle: `PDF Seite ${n}`, anm: [] }]
            );
          }
          doc.destroy();
          if (mediaType === 'image') setMediaType('pdf');
          if (!mediaFile) {
            setMediaFile({ blob: f, fileName: f.name, mimeType: 'application/pdf', kind: 'pdf' });
          }
        } else if (isImage) {
          setStatus('Bild wird vorbereitet …');
          const img = await loadImageFromBlob(f);
          const jpg = await alsJpeg(img, img.naturalWidth, img.naturalHeight);
          setSeiten((prev) =>
            prev.length >= SEITEN_MAX
              ? prev
              : [...prev, { ...jpg, url: URL.createObjectURL(jpg.blob), quelle: 'Bild / Plakat', anm: [] }]
          );
        } else {
          onToast(`„${f.name}“ wird nicht unterstützt (erlaubt: Bilder, PDF, PPTX, MP4/MOV, MP3/M4A/WAV).`);
        }
      } catch (err: any) {
        console.warn('Upload-Vorbereitung Fehler:', err);
        onToast(`„${f.name}“ ließ sich nicht verarbeiten (${err?.message || 'Fehler'}).`);
      }
    }
    setStatus('');
  };

  const rotatePage = async (idx: number) => {
    const target = seiten[idx];
    if (!target) return;
    const img = await loadImageFromBlob(target.blob);
    const rotated = await alsJpeg(img, img.naturalWidth, img.naturalHeight, 90);
    URL.revokeObjectURL(target.url);
    setSeiten((prev) =>
      prev.map((item, i) =>
        i === idx
          ? {
              ...item,
              blob: rotated.blob,
              w: rotated.w,
              h: rotated.h,
              url: URL.createObjectURL(rotated.blob),
              anm: rotateAnnotations90(item.anm),
              r2Key: undefined,
            }
          : item
      )
    );
  };

  const handleSubmit = async () => {
    const cleanName = nickname.trim();
    const cleanTitle = titel.trim();
    if (!cleanName) return onToast('Bitte einen Spitznamen wählen oder würfeln.');
    if (!cleanTitle) return onToast('Bitte einen Titel eingeben.');
    if (!seiten.length) return onToast('Bitte mindestens eine Seite / Datei hinzufügen.');

    setSavedNickname(cleanName);
    setSubmitting(true);
    setProgress(5);

    try {
      const exhibitId = existing?.id || `ex_${randomId(14)}`;
      const uploadedPages = [];

      for (let i = 0; i < seiten.length; i++) {
        const s = seiten[i];
        setStatus(`Seite ${i + 1} von ${seiten.length} wird in Cloudflare R2 gespeichert …`);
        setProgress(Math.round(((i + 0.5) / (seiten.length + 1)) * 100));

        if (isDemo) {
          uploadedPages.push({
            r2Key: '',
            demoUrl: URL.createObjectURL(s.blob),
            width: s.w,
            height: s.h,
            aspect: s.w / s.h || 0.75,
            sourceLabel: s.quelle,
          });
        } else if (s.r2Key) {
          uploadedPages.push({
            r2Key: s.r2Key,
            width: s.w,
            height: s.h,
            aspect: s.w / s.h || 0.75,
            sourceLabel: s.quelle,
          });
        } else {
          const key = await uploadBlobToR2(s.blob, buildMuseumR2Key(museum.code, exhibitId, `seite_${i + 1}.jpg`), 'image/jpeg');
          uploadedPages.push({
            r2Key: key,
            width: s.w,
            height: s.h,
            aspect: s.w / s.h || 0.75,
            sourceLabel: s.quelle,
          });
        }
      }

      let mediaAsset = existing?.mediaAsset || null;
      if (mediaFile) {
        setStatus(`Mediendatei (${mediaFile.fileName}) wird hochgeladen …`);
        if (isDemo) {
          mediaAsset = {
            r2Key: '',
            demoUrl: URL.createObjectURL(mediaFile.blob),
            mimeType: mediaFile.mimeType,
            fileName: mediaFile.fileName,
            fileSize: mediaFile.blob.size,
            kind: mediaFile.kind,
          };
        } else {
          const key = await uploadBlobToR2(
            mediaFile.blob,
            buildMuseumR2Key(museum.code, exhibitId, mediaFile.fileName),
            mediaFile.mimeType
          );
          mediaAsset = {
            r2Key: key,
            mimeType: mediaFile.mimeType,
            fileName: mediaFile.fileName,
            fileSize: mediaFile.blob.size,
            kind: mediaFile.kind,
          };
        }
      }

      let audioCompanion = existing?.audioCompanion || null;
      if (audioCompanionFile) {
        setStatus('Audio-Kommentar wird hochgeladen …');
        if (isDemo) {
          audioCompanion = {
            r2Key: '',
            demoUrl: URL.createObjectURL(audioCompanionFile.blob),
            mimeType: audioCompanionFile.mimeType,
            fileName: audioCompanionFile.fileName,
          };
        } else {
          const key = await uploadBlobToR2(
            audioCompanionFile.blob,
            buildMuseumR2Key(museum.code, exhibitId, audioCompanionFile.fileName),
            audioCompanionFile.mimeType
          );
          audioCompanion = {
            r2Key: key,
            mimeType: audioCompanionFile.mimeType,
            fileName: audioCompanionFile.fileName,
          };
        }
      }

      const anmMap: Record<string, AnnotationItem[]> = {};
      seiten.forEach((s, idx) => {
        if (s.anm.length) anmMap[String(idx)] = s.anm;
      });

      const now = Date.now();
      const result: Exponat = {
        id: exhibitId,
        museumCode: museum.code,
        deviceId,
        name: cleanName.slice(0, 20),
        titel: cleanTitle.slice(0, 80),
        text: text.trim().slice(0, 600),
        mediaType,
        seiten: uploadedPages.length,
        pages: uploadedPages,
        mediaAsset,
        audioCompanion,
        v: existing ? existing.v + 1 : 1,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
        likesCount: existing?.likesCount || 0,
        likedBy: existing?.likedBy || [],
        anm: anmMap,
        kommentare: existing?.kommentare || [],
        rueck: existing?.rueck || [],
      };

      if (!isDemo && existing) {
        const keptKeys = new Set(collectExhibitR2Keys(result));
        const obsoleteKeys = collectExhibitR2Keys(existing).filter((k) => !keptKeys.has(k));
        if (obsoleteKeys.length > 0) {
          await deleteKeysFromR2(obsoleteKeys);
        }
      }

      setProgress(100);
      removeStorage(draftKey);
      onSubmitted(result);
    } catch (err: any) {
      console.error('Einreichen fehlgeschlagen:', err);
      onToast(err?.message || 'Upload fehlgeschlagen.');
    } finally {
      setSubmitting(false);
      setStatus('');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-6 space-y-5">
      <HbsCard className="bg-gradient-to-br from-hbs-blue to-hbs-blue-dark text-white border-0">
        <span className="text-xs font-extrabold uppercase tracking-wider text-hbs-blue-light">
          Heimbürgeschule Kahla · Code {museum.code}
        </span>
        <h2 className="text-2xl font-black mt-1">{museum.titel}</h2>
        {museum.hinweis && <p className="text-sm text-hbs-blue-light mt-1">{museum.hinweis}</p>}
      </HbsCard>

      <HbsCard className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-lg font-black text-hbs-slate-dark">
            {existing ? 'Exponat bearbeiten' : 'Dein Exponat einreichen'}
          </h3>
          <HbsBadge label={`${seiten.length} / ${SEITEN_MAX} Seiten`} variant="blue" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-hbs-slate-dark mb-1">Spitzname (öffentlich am Schild)</label>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={20}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="z. B. Mutiger Luchs"
                className="flex-1 h-11 px-3 rounded-xl border border-hbs-slate-border bg-white text-sm"
              />
              <HbsButton
                variant="secondary"
                aria-label="Spitznamen würfeln"
                title="Spitznamen würfeln"
                onClick={() => setNickname(spitzname())}
              >
                <Dices className="w-4 h-4" />
              </HbsButton>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-hbs-slate-dark mb-1">Titel des Exponats</label>
            <input
              type="text"
              maxLength={80}
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
              placeholder="z. B. Unser Plakat zur Industrialisierung"
              className="w-full h-11 px-3 rounded-xl border border-hbs-slate-border bg-white text-sm"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-bold text-hbs-slate-dark">Text für das Museumsschild</label>
            <span className="text-xs text-hbs-slate-muted">{text.length} / 600</span>
          </div>
          <textarea
            rows={4}
            maxLength={600}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Kurze Erklärung für die Besucherinnen und Besucher …"
            className="w-full p-3 rounded-xl border border-hbs-slate-border bg-white text-sm"
          />
        </div>

        {/* Seitenliste */}
        {seiten.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {seiten.map((s, i) => (
              <div key={i} className="rounded-xl border border-hbs-slate-border bg-hbs-bg p-2 flex flex-col gap-2">
                <img src={s.url} alt={`Seite ${i + 1}`} className="w-full aspect-[4/3] object-contain bg-white rounded-lg" />
                <span className="text-xs font-semibold text-hbs-slate-muted truncate">
                  {i + 1}. {s.quelle}
                </span>
                <div className="flex items-center justify-between gap-1">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => {
                      setSeiten((prev) => {
                        const copy = [...prev];
                        [copy[i - 1], copy[i]] = [copy[i], copy[i - 1]];
                        return copy;
                      });
                    }}
                    className="w-8 h-8 rounded-lg border border-hbs-slate-border bg-white text-xs font-bold disabled:opacity-30"
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    disabled={i === seiten.length - 1}
                    onClick={() => {
                      setSeiten((prev) => {
                        const copy = [...prev];
                        [copy[i + 1], copy[i]] = [copy[i], copy[i + 1]];
                        return copy;
                      });
                    }}
                    className="w-8 h-8 rounded-lg border border-hbs-slate-border bg-white text-xs font-bold disabled:opacity-30"
                  >
                    ▶
                  </button>
                  <button
                    type="button"
                    onClick={() => rotatePage(i)}
                    className="w-8 h-8 rounded-lg border border-hbs-slate-border bg-white text-xs font-bold"
                    title="Um 90° drehen"
                  >
                    ⟳
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(s.url);
                      setSeiten((prev) => prev.filter((_, idx) => idx !== i));
                    }}
                    className="w-8 h-8 rounded-lg border border-rose-200 bg-white text-rose-600 text-xs font-bold"
                    title="Entfernen"
                  >
                    ✕
                  </button>
                </div>
                {mediaType !== 'video' && mediaType !== 'audio' && (
                  <button
                    type="button"
                    onClick={() => setEditHelpIdx(i)}
                    className="h-9 rounded-lg border border-hbs-blue/30 bg-hbs-blue-soft text-hbs-blue text-xs font-bold hover:bg-hbs-blue-light"
                  >
                    ✎ Hilfen {s.anm.length ? `(${s.anm.length})` : ''}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Dropzone für Plakate, PDF, PPTX, Audio, Video */}
        {seiten.length < SEITEN_MAX && (
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFiles([...e.dataTransfer.files]);
            }}
            className="border-2 border-dashed border-hbs-blue/40 hover:border-hbs-blue rounded-2xl p-6 text-center bg-hbs-blue-soft/40 cursor-pointer flex flex-col items-center gap-2 transition-colors"
          >
            <Upload className="w-8 h-8 text-hbs-blue" />
            <b className="text-sm sm:text-base text-hbs-slate-dark">
              Plakat-Fotos, PDF, PowerPoint (.pptx), Audio oder Video auswählen / hierher ziehen
            </b>
            <p className="text-xs text-hbs-slate-muted max-w-xl">
              Unterstützt bis zu {SEITEN_MAX} Seiten: Fotos (.jpg, .png), PDF-Dokumente, PowerPoint (.pptx → automatischer PDF-Konverter), Videos (.mp4/.mov) und Audio (.mp3/.m4a).
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              <HbsBadge label="Plakat-Foto" variant="blue" />
              <HbsBadge label="PDF" variant="teal" />
              <HbsBadge label="PPTX → PDF" variant="amber" />
              <HbsBadge label="Audio / Video" variant="neutral" />
            </div>
            <input
              type="file"
              multiple
              accept="image/*,application/pdf,.pdf,.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation,video/*,audio/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFiles([...e.target.files]);
                e.target.value = '';
              }}
            />
          </label>
        )}

        {/* Optionaler Audio-Kommentar zu einem Plakat / einer Präsentation */}
        {mediaType !== 'audio' && mediaType !== 'video' && (
          <div className="rounded-xl border border-hbs-slate-border bg-hbs-bg p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-sm">
              <Headphones className="w-5 h-5 text-hbs-teal shrink-0" />
              <div>
                <b className="text-hbs-slate-dark block text-xs sm:text-sm">Optional: Audio-Erklärung anhängen</b>
                <span className="text-xs text-hbs-slate-muted">
                  {audioCompanionFile
                    ? `Ausgewählt: ${audioCompanionFile.fileName}`
                    : 'Schüler können eine kurze Sprachaufnahme (MP3/M4A) zu ihrem Plakat hinzufügen.'}
                </span>
              </div>
            </div>
            <label className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-hbs-teal text-hbs-teal text-xs font-bold cursor-pointer hover:bg-hbs-teal-light">
              Audio wählen
              <input
                type="file"
                accept="audio/*,.mp3,.m4a,.wav"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setAudioCompanionFile({ blob: file, fileName: file.name, mimeType: file.type || 'audio/mpeg' });
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        )}

        {status && <p className="text-xs font-bold text-hbs-blue">{status}</p>}
        {submitting && (
          <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
            <div className="h-full bg-hbs-teal transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        )}

        <div className="rounded-xl border-l-4 border-hbs-amber bg-hbs-amber-light p-3 text-xs text-hbs-slate">
          {isDemo
            ? 'Probeausstellung: Dein Exponat bleibt nur lokal im Browser – nichts wird auf den Schulserver hochgeladen.'
            : 'Hinweis zum Datenschutz: Bitte lade keine privaten Fotos hoch, auf denen Mitschüler ohne Erlaubnis erkennbar sind.'}
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <HbsButton size="lg" variant="action" disabled={submitting || loadingExisting || !seiten.length} onClick={handleSubmit}>
            {existing ? 'Neue Fassung aufhängen' : 'Ins Museum hängen'}
          </HbsButton>
          <HbsButton size="lg" variant="secondary" disabled={submitting} onClick={onCancel}>
            Abbrechen
          </HbsButton>
        </div>
      </HbsCard>

      {editHelpIdx !== null && seiten[editHelpIdx] && (
        <AnnotatorModal
          imageUrl={seiten[editHelpIdx].url}
          title={`Hilfen auf Seite ${editHelpIdx + 1}`}
          mode="hilfen"
          initialAnnotations={seiten[editHelpIdx].anm}
          onCancel={() => setEditHelpIdx(null)}
          onConfirmHilfen={(items) => {
            setSeiten((prev) => prev.map((it, idx) => (idx === editHelpIdx ? { ...it, anm: items } : it)));
            setEditHelpIdx(null);
          }}
          onToast={onToast}
        />
      )}

      {pdfPicker && (
        <HbsModal
          isOpen={true}
          onClose={() => {
            pdfPicker.resolve(null);
            setPdfPicker(null);
          }}
          title={pdfPicker.title}
          footer={
            <>
              <HbsButton
                variant="secondary"
                onClick={() => {
                  pdfPicker.resolve(null);
                  setPdfPicker(null);
                }}
              >
                Abbrechen
              </HbsButton>
              <HbsButton
                disabled={pdfPicker.selected.size === 0}
                onClick={() => {
                  const arr = [...pdfPicker.selected].sort((a, b) => a - b);
                  pdfPicker.resolve(arr);
                  setPdfPicker(null);
                }}
              >
                {pdfPicker.selected.size} Seiten übernehmen
              </HbsButton>
            </>
          }
        >
          <p className="text-sm text-hbs-slate">
            Die Datei hat {pdfPicker.total} Seiten. Wähle bis zu {pdfPicker.maxSelect} Seiten aus:
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-[55vh] overflow-y-auto">
            {pdfPicker.thumbs.map((thumb, idx) => {
              const pageNo = idx + 1;
              const checked = pdfPicker.selected.has(pageNo);
              const disabled = !checked && pdfPicker.selected.size >= pdfPicker.maxSelect;
              return (
                <label
                  key={pageNo}
                  className={`border-2 rounded-xl p-1.5 flex flex-col items-center gap-1 cursor-pointer ${
                    checked ? 'border-hbs-blue bg-hbs-blue-soft' : 'border-hbs-slate-border'
                  } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <img src={thumb} alt={`Seite ${pageNo}`} className="w-full aspect-[4/3] object-contain bg-white rounded" />
                  <span className="text-xs font-bold flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => {
                        setPdfPicker((prev) => {
                          if (!prev) return null;
                          const next = new Set(prev.selected);
                          if (next.has(pageNo)) next.delete(pageNo);
                          else if (next.size < prev.maxSelect) next.add(pageNo);
                          return { ...prev, selected: next };
                        });
                      }}
                    />
                    Seite {pageNo}
                  </span>
                </label>
              );
            })}
          </div>
        </HbsModal>
      )}
    </div>
  );
};
