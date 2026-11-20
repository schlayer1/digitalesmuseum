import React, { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  Check,
  Copy,
  Edit3,
  Eye,
  LogOut,
  MonitorPlay,
  Plus,
  QrCode,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  AnnotationItem,
  Exponat,
  formatTeacherName,
  KommentarStelle,
  MediaType,
  MuseumAusstellung,
  MuseumPhase,
  PortalUser,
  SaalStil,
} from '../../types/museum';
import {
  createMuseum,
  deleteExhibitAndFiles,
  deleteMuseumAndFiles,
  listMuseums,
  saveExhibit,
  setMuseumPhase,
  subscribeToExhibits,
  subscribeToMuseum,
  updateExhibitAnnotations,
  updateMuseumFuehrung,
  updateMuseumSettings,
  removeExhibitComment,
  removeExhibitFeedback,
} from '../../services/firebase';
import { buildMuseumR2Key, resolvePageImageUrl, uploadBlobToR2 } from '../../services/r2Storage';
import {
  alsJpeg,
  buildJoinLink,
  cleanFileTitle,
  KANTE_MAX,
  loadImageFromBlob,
  mehrzahl,
  randomId,
  SAELE,
  SEITEN_MAX,
} from '../../utils/museumHelpers';
import { openPdfFile, renderPdfPageJpeg } from '../../utils/pdfProcessor';
import { convertPptxToSlidesAndPdf } from '../../utils/pptxConverter';
import { createAudioThumbnail, createVideoThumbnail } from '../../utils/mediaThumbnail';
import { countAnnotations } from '../../utils/annotations';
import { ExhibitDetailModal } from '../museum/ExhibitDetailModal';
import { HbsBadge, HbsButton, HbsCard, HbsModal } from '../hbs/HbsKit';

interface TeacherDashboardProps {
  teacher: PortalUser;
  selectedCode: string;
  onSelectMuseum: (code: string) => void;
  onLaunchBeamer: (code: string) => void;
  onLaunchDemo: (beamer: boolean) => void;
  onLogout: () => void;
  onToast: (msg: string) => void;
}

interface BulkUploadRow {
  id: string;
  titel: string;
  von: string;
  mediaType: MediaType;
  seiten: { blob: Blob; url: string; w: number; h: number; quelle: string }[];
  mediaFile?: { blob: Blob; fileName: string; mimeType: string; kind: 'video' | 'audio' | 'pdf' | 'pptx' };
  status?: string;
  fehler?: boolean;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  teacher,
  selectedCode,
  onSelectMuseum,
  onLaunchBeamer,
  onLaunchDemo,
  onLogout,
  onToast,
}) => {
  const [museums, setMuseums] = useState<MuseumAusstellung[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [classFilter, setClassFilter] = useState('');

  // Create form
  const [newTitle, setNewTitle] = useState('');
  const [newKlasse, setNewKlasse] = useState('');
  const [newHinweis, setNewHinweis] = useState('');
  const [newSaal, setNewSaal] = useState<SaalStil>('klassisch');
  const [newKrit, setNewKrit] = useState(['Inhalt', 'Gestaltung', 'Verständlichkeit']);
  const [creating, setCreating] = useState(false);

  // Selected room live state
  const [activeMuseum, setActiveMuseum] = useState<MuseumAusstellung | null>(null);
  const [activeExhibits, setActiveExhibits] = useState<Exponat[]>([]);
  const [bulkQueue, setBulkQueue] = useState<BulkUploadRow[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [preparingCount, setPreparingCount] = useState(0);

  const [showQrModal, setShowQrModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editKlasse, setEditKlasse] = useState('');
  const [editHinweis, setEditHinweis] = useState('');
  const [editSaal, setEditSaal] = useState<SaalStil>('klassisch');
  const [editKrit, setEditKrit] = useState<string[]>(['', '', '']);

  const [detailExhibitId, setDetailExhibitId] = useState<string | null>(null);
  const [detailPage, setDetailPage] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [deleteTargetMuseum, setDeleteTargetMuseum] = useState<MuseumAusstellung | null>(null);
  const [deletingMuseum, setDeletingMuseum] = useState(false);

  const handleConfirmDeleteMuseum = async () => {
    if (!deleteTargetMuseum || deletingMuseum) return;
    const target = deleteTargetMuseum;
    setDeletingMuseum(true);
    try {
      const stats = await deleteMuseumAndFiles(target.code);
      setMuseums((prev) => prev.filter((item) => item.code !== target.code));
      setDeleteTargetMuseum(null);
      if (selectedCode === target.code) {
        onSelectMuseum('');
      }
      onToast(
        `Ausstellung „${target.titel}“ gelöscht (${mehrzahl(stats.deletedExhibits, 'Exponat', 'Exponate')} & ${mehrzahl(
          stats.deletedR2Files,
          'Cloudflare-Datei',
          'Cloudflare-Dateien'
        )} entfernt).`
      );
    } catch (err: any) {
      console.error('Fehler beim Löschen der Ausstellung:', err);
      onToast(err?.message || 'Ausstellung konnte nicht gelöscht werden.');
    } finally {
      setDeletingMuseum(false);
    }
  };

  const deleteConfirmModal = (
    <HbsModal
      isOpen={Boolean(deleteTargetMuseum)}
      onClose={() => {
        if (!deletingMuseum) setDeleteTargetMuseum(null);
      }}
      title="Ausstellung & Cloudflare-Dateien löschen"
      footer={
        <>
          <HbsButton
            variant="secondary"
            disabled={deletingMuseum}
            onClick={() => setDeleteTargetMuseum(null)}
          >
            Abbrechen
          </HbsButton>
          <HbsButton
            variant="danger"
            disabled={deletingMuseum}
            onClick={handleConfirmDeleteMuseum}
          >
            <Trash2 className="w-4 h-4" />
            {deletingMuseum ? 'Wird inkl. R2-Dateien gelöscht …' : 'Endgültig löschen'}
          </HbsButton>
        </>
      }
    >
      {deleteTargetMuseum && (
        <div className="space-y-3 text-sm text-hbs-slate">
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
            <p className="font-black text-base">
              {deleteTargetMuseum.titel}
              {deleteTargetMuseum.klasse ? ` (${deleteTargetMuseum.klasse})` : ''}
            </p>
            <p className="text-xs font-bold uppercase tracking-wider text-rose-700">
              Code: {deleteTargetMuseum.code} · Erstellt von {deleteTargetMuseum.authorName}
            </p>
          </div>
          <p>
            Möchtest du diese Ausstellung wirklich <b>unwiderruflich löschen</b>?
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-hbs-slate-muted">
            <li>Alle eingereichten Exponate, Kommentare, Fragen und Sterne-Rückmeldungen in Firestore werden entfernt.</li>
            <li>
              Sämtliche dazugehörigen Dateien in <b>Cloudflare R2</b> (Bilder, PDFs, umgewandelte PowerPoint-Folien, Audio- und Videodateien unter <code className="font-mono text-hbs-slate-dark">museum/{deleteTargetMuseum.code}/</code>) werden vollständig gelöscht.
            </li>
          </ul>
        </div>
      )}
    </HbsModal>
  );

  const refreshList = async () => {
    setLoadingList(true);
    try {
      const list = await listMuseums();
      setMuseums(list);
    } catch (err) {
      console.error(err);
      onToast('Ausstellungen konnten nicht geladen werden.');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (!selectedCode) refreshList();
  }, [selectedCode]);

  useEffect(() => {
    if (!selectedCode) {
      setActiveMuseum(null);
      setActiveExhibits([]);
      return;
    }
    const unsub1 = subscribeToMuseum(selectedCode, (m) => {
      setActiveMuseum(m);
    });
    const unsub2 = subscribeToExhibits(selectedCode, (list) => {
      setActiveExhibits(list);
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, [selectedCode]);

  const classes = useMemo(
    () => [...new Set(museums.map((m) => m.klasse).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'de', { numeric: true })),
    [museums]
  );

  const filteredMuseums = useMemo(() => {
    return museums
      .filter((m) => (!classFilter ? true : classFilter === '-' ? !m.klasse : m.klasse === classFilter))
      .sort((a, b) => (a.klasse || '\uffff').localeCompare(b.klasse || '\uffff', 'de', { numeric: true }) || b.createdAt - a.createdAt);
  }, [museums, classFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      onToast('Bitte gib einen Titel für die Ausstellung ein.');
      return;
    }
    setCreating(true);
    try {
      const created = await createMuseum({
        titel: newTitle,
        klasse: newKlasse,
        hinweis: newHinweis,
        saal: newSaal,
        kriterien: newKrit.map((k) => k.trim()).filter(Boolean),
        authorId: teacher.id,
        authorName: formatTeacherName(teacher),
      });
      setNewTitle('');
      setNewKlasse('');
      setNewHinweis('');
      onSelectMuseum(created.code);
      onToast(`Ausstellung ${created.code} angelegt!`);
    } catch (err: any) {
      console.error(err);
      onToast(err?.message || 'Ausstellung konnte nicht angelegt werden (Firestore-Regeln prüfen).');
    } finally {
      setCreating(false);
    }
  };

  const handleBulkFiles = async (files: File[]) => {
    setPreparingCount((c) => c + files.length);
    for (const f of files) {
      const lower = f.name.toLowerCase();
      const title = cleanFileTitle(f.name);
      try {
        if (f.type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(lower)) {
          const thumb = await createVideoThumbnail(f, title);
          setBulkQueue((prev) => [
            ...prev,
            {
              id: randomId(10),
              titel: title,
              von: '',
              mediaType: 'video',
              seiten: [{ ...thumb, url: URL.createObjectURL(thumb.blob), quelle: 'Video' }],
              mediaFile: { blob: f, fileName: f.name, mimeType: f.type || 'video/mp4', kind: 'video' },
            },
          ]);
        } else if (f.type.startsWith('audio/') || /\.(mp3|m4a|wav|ogg)$/i.test(lower)) {
          const thumb = await createAudioThumbnail(f.name, title);
          setBulkQueue((prev) => [
            ...prev,
            {
              id: randomId(10),
              titel: title,
              von: '',
              mediaType: 'audio',
              seiten: [{ ...thumb, url: URL.createObjectURL(thumb.blob), quelle: 'Audio' }],
              mediaFile: { blob: f, fileName: f.name, mimeType: f.type || 'audio/mpeg', kind: 'audio' },
            },
          ]);
        } else if (lower.endsWith('.pptx')) {
          const conv = await convertPptxToSlidesAndPdf(f);
          const pages = conv.slides.slice(0, SEITEN_MAX).map((s) => ({
            blob: s.blob,
            w: s.w,
            h: s.h,
            url: URL.createObjectURL(s.blob),
            quelle: `Folie ${s.pageNumber}`,
          }));
          setBulkQueue((prev) => [
            ...prev,
            {
              id: randomId(10),
              titel: title,
              von: '',
              mediaType: 'pptx',
              seiten: pages,
              mediaFile: {
                blob: conv.pdfBlob,
                fileName: f.name.replace(/\.pptx$/i, '.pdf'),
                mimeType: 'application/pdf',
                kind: 'pdf',
              },
            },
          ]);
        } else if (f.type === 'application/pdf' || lower.endsWith('.pdf')) {
          const doc = await openPdfFile(f);
          const count = Math.min(doc.numPages, SEITEN_MAX);
          const pages: BulkUploadRow['seiten'] = [];
          for (let i = 1; i <= count; i++) {
            const jpg = await renderPdfPageJpeg(doc, i, KANTE_MAX);
            pages.push({ ...jpg, url: URL.createObjectURL(jpg.blob), quelle: `Seite ${i}` });
          }
          doc.destroy();
          setBulkQueue((prev) => [
            ...prev,
            {
              id: randomId(10),
              titel: title,
              von: '',
              mediaType: 'pdf',
              seiten: pages,
              mediaFile: { blob: f, fileName: f.name, mimeType: 'application/pdf', kind: 'pdf' },
            },
          ]);
        } else if (f.type.startsWith('image/') || /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(lower)) {
          const img = await loadImageFromBlob(f);
          const jpg = await alsJpeg(img, img.naturalWidth, img.naturalHeight);
          setBulkQueue((prev) => [
            ...prev,
            {
              id: randomId(10),
              titel: title,
              von: '',
              mediaType: 'image',
              seiten: [{ ...jpg, url: URL.createObjectURL(jpg.blob), quelle: 'Bild' }],
            },
          ]);
        } else {
          onToast(`„${f.name}“ wird nicht unterstützt.`);
        }
      } catch (err) {
        console.warn('Fehler bei Datei:', f.name, err);
        onToast(`„${f.name}“ ließ sich nicht vorbereiten.`);
      } finally {
        setPreparingCount((c) => Math.max(0, c - 1));
      }
    }
  };

  const uploadBulkQueue = async () => {
    if (!activeMuseum || !bulkQueue.length) return;
    setBulkBusy(true);
    let okCount = 0;

    for (const row of bulkQueue) {
      try {
        const exhibitId = `ex_${randomId(14)}`;
        const pages = [];
        for (let i = 0; i < row.seiten.length; i++) {
          const s = row.seiten[i];
          const key = await uploadBlobToR2(
            s.blob,
            buildMuseumR2Key(activeMuseum.code, exhibitId, `seite_${i + 1}.jpg`),
            'image/jpeg'
          );
          pages.push({ r2Key: key, width: s.w, height: s.h, aspect: s.w / s.h || 0.75, sourceLabel: s.quelle });
        }

        let mediaAsset = null;
        if (row.mediaFile) {
          const key = await uploadBlobToR2(
            row.mediaFile.blob,
            buildMuseumR2Key(activeMuseum.code, exhibitId, row.mediaFile.fileName),
            row.mediaFile.mimeType
          );
          mediaAsset = {
            r2Key: key,
            mimeType: row.mediaFile.mimeType,
            fileName: row.mediaFile.fileName,
            fileSize: row.mediaFile.blob.size,
            kind: row.mediaFile.kind,
          };
        }

        const now = Date.now();
        const ex: Exponat = {
          id: exhibitId,
          museumCode: activeMuseum.code,
          deviceId: `teacher_${teacher.id}_${randomId(6)}`,
          name: (row.von.trim() || formatTeacherName(teacher) || 'Lehrkraft').slice(0, 20),
          titel: (row.titel.trim() || 'Ohne Titel').slice(0, 80),
          text: '',
          mediaType: row.mediaType,
          seiten: pages.length,
          pages,
          mediaAsset,
          v: 1,
          createdAt: now,
          updatedAt: now,
          likesCount: 0,
          likedBy: [],
          anm: {},
          kommentare: [],
          rueck: [],
        };

        await saveExhibit(activeMuseum.code, ex);
        row.seiten.forEach((s) => URL.revokeObjectURL(s.url));
        okCount++;
        setBulkQueue((prev) => prev.filter((item) => item.id !== row.id));
      } catch (err: any) {
        console.error('Sammelupload Fehler:', err);
        setBulkQueue((prev) =>
          prev.map((item) => (item.id === row.id ? { ...item, fehler: true, status: err?.message || 'Fehler' } : item))
        );
      }
    }

    setBulkBusy(false);
    if (okCount > 0) onToast(`${mehrzahl(okCount, 'Exponat hängt', 'Exponate hängen')} im Museum.`);
  };

  if (selectedCode && activeMuseum) {
    const joinUrl = buildJoinLink(activeMuseum.code);
    const detailExhibit = detailExhibitId ? activeExhibits.find((e) => e.id === detailExhibitId) || null : null;

    return (
      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-5">
        <HbsCard className="bg-gradient-to-br from-hbs-blue to-hbs-blue-dark text-white border-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-hbs-blue-light">
                Ausstellung · Heimbürgeschule Kahla
              </span>
              {activeMuseum.klasse && (
                <span className="px-2.5 py-0.5 rounded-full bg-white text-hbs-blue-dark text-xs font-extrabold">
                  {activeMuseum.klasse}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onSelectMuseum('')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white/90 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" /> Alle Ausstellungen
            </button>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black">{activeMuseum.titel}</h2>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <span className="text-2xl sm:text-3xl font-black tracking-[0.2em] bg-white/15 px-4 py-1.5 rounded-xl">
              {activeMuseum.code}
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(joinUrl);
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 2000);
              }}
              className="h-11 px-4 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-bold inline-flex items-center gap-1.5"
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              Link kopieren
            </button>
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="h-11 px-4 rounded-xl bg-white text-hbs-blue-dark hover:bg-hbs-blue-light text-sm font-bold inline-flex items-center gap-1.5"
            >
              <QrCode className="w-4 h-4" /> QR-Code zeigen
            </button>
            <button
              type="button"
              onClick={() => onLaunchBeamer(activeMuseum.code)}
              className="h-11 px-5 rounded-xl bg-hbs-amber hover:bg-hbs-amber-dark text-white text-sm font-extrabold inline-flex items-center gap-1.5 shadow"
            >
              <MonitorPlay className="w-4 h-4" /> Museum am Beamer
            </button>
            <button
              type="button"
              onClick={() => {
                setEditTitle(activeMuseum.titel);
                setEditKlasse(activeMuseum.klasse || '');
                setEditHinweis(activeMuseum.hinweis || '');
                setEditSaal(activeMuseum.saal);
                setEditKrit([
                  activeMuseum.kriterien?.[0] || '',
                  activeMuseum.kriterien?.[1] || '',
                  activeMuseum.kriterien?.[2] || '',
                ]);
                setShowEditModal(true);
              }}
              className="h-11 px-4 rounded-xl border border-white/50 text-white hover:bg-white/10 text-sm font-bold inline-flex items-center gap-1.5"
            >
              <Edit3 className="w-4 h-4" /> Bearbeiten
            </button>
            <button
              type="button"
              onClick={() => setDeleteTargetMuseum(activeMuseum)}
              className="h-11 px-4 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-sm font-bold inline-flex items-center gap-1.5 shadow-sm"
            >
              <Trash2 className="w-4 h-4" /> Ausstellung löschen
            </button>
          </div>
        </HbsCard>

        {activeMuseum.fuehrung?.an && (
          <HbsCard className="border-hbs-amber bg-hbs-amber-light flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-hbs-slate-dark">Geführter Rundgang läuft gerade</h3>
              <p className="text-sm text-hbs-slate">Die Geräte der Klasse folgen dem Beamer und können nicht frei umhergehen.</p>
            </div>
            <HbsButton
              variant="action"
              onClick={() => updateMuseumFuehrung(activeMuseum.code, { an: false, id: '', s: 0, t: Date.now() })}
            >
              Führung beenden
            </HbsButton>
          </HbsCard>
        )}

        {/* Ablauf & Schalter */}
        <HbsCard className="space-y-4">
          <h3 className="text-lg font-black text-hbs-slate-dark">Ablauf &amp; Freigaben</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(
              [
                ['aufbau', '1 · Aufbau', 'Schüler reichen Exponate ein'],
                ['rundgang', '2 · Rundgang', 'Alle sehen alles, liken & kommentieren'],
                ['zu', '3 · Geschlossen', 'Nur du siehst die Ausstellung'],
              ] as [MuseumPhase, string, string][]
            ).map(([p, label, sub]) => (
              <button
                key={p}
                type="button"
                onClick={() => setMuseumPhase(activeMuseum.code, p)}
                className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                  activeMuseum.phase === p
                    ? 'border-hbs-blue bg-hbs-blue-soft text-hbs-blue-dark'
                    : 'border-hbs-slate-border bg-white hover:border-hbs-blue/40'
                }`}
              >
                <b className="block text-sm font-black">{label}</b>
                <span className="text-xs text-hbs-slate-muted">{sub}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-5 pt-1">
            {(
              [
                ['einreichen', activeMuseum.einreichen, 'Einreichen erlaubt'],
                ['kommentare', activeMuseum.kommentare, 'Kommentare und Fragen erlaubt'],
                ['rueck', activeMuseum.rueck, 'Sterne-Rückmeldungen erlaubt'],
              ] as const
            ).map(([key, checked, text]) => (
              <label key={key} className="inline-flex items-center gap-2 text-sm font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => updateMuseumSettings(activeMuseum.code, { [key]: e.target.checked })}
                  className="w-4 h-4 accent-hbs-blue"
                />
                {text}
              </label>
            ))}
          </div>
        </HbsCard>

        {/* Selbst aufhängen (Lehrkraft Drag & Drop) */}
        <HbsCard className="space-y-4">
          <div>
            <h3 className="text-lg font-black text-hbs-slate-dark">Selbst aufhängen (Drag &amp; Drop)</h3>
            <p className="text-sm text-hbs-slate-muted">
              Ziehe Bilder, PDFs, PowerPoint (.pptx), Videos oder Audio-Dateien hierher, die dir Schüler abgegeben haben.
            </p>
          </div>

          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleBulkFiles([...e.dataTransfer.files]);
            }}
            className="border-2 border-dashed border-hbs-blue/40 hover:border-hbs-blue rounded-2xl p-6 text-center bg-hbs-blue-soft/30 cursor-pointer flex flex-col items-center gap-2"
          >
            <Upload className="w-7 h-7 text-hbs-blue" />
            <b className="text-sm text-hbs-slate-dark">Dateien hierher ziehen oder auswählen</b>
            <span className="text-xs text-hbs-slate-muted">Bilder, PDFs, PPTX (wird zu PDF), MP4/MOV, MP3/M4A</span>
            <input
              type="file"
              multiple
              accept="image/*,application/pdf,.pdf,.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation,video/*,audio/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleBulkFiles([...e.target.files]);
                e.target.value = '';
              }}
            />
          </label>

          {preparingCount > 0 && (
            <p className="text-xs font-bold text-hbs-blue">Dateien werden vorbereitet ({preparingCount}) …</p>
          )}

          {bulkQueue.length > 0 && (
            <div className="space-y-2.5">
              {bulkQueue.map((row, i) => (
                <div
                  key={row.id}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border ${
                    row.fehler ? 'border-rose-400 bg-rose-50' : 'border-hbs-slate-border bg-hbs-bg'
                  }`}
                >
                  <img
                    src={row.seiten[0]?.url}
                    alt=""
                    className="w-16 h-12 object-contain bg-white rounded-lg border border-hbs-slate-border shrink-0"
                  />
                  <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      maxLength={80}
                      disabled={bulkBusy}
                      value={row.titel}
                      onChange={(e) =>
                        setBulkQueue((prev) => prev.map((it) => (it.id === row.id ? { ...it, titel: e.target.value } : it)))
                      }
                      placeholder="Titel des Exponats"
                      className="h-9 px-2.5 rounded-lg border border-hbs-slate-border bg-white text-sm font-semibold"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={20}
                        disabled={bulkBusy}
                        value={row.von}
                        onChange={(e) =>
                          setBulkQueue((prev) => prev.map((it) => (it.id === row.id ? { ...it, von: e.target.value } : it)))
                        }
                        placeholder="von (Name/Kürzel)"
                        className="flex-1 h-9 px-2.5 rounded-lg border border-hbs-slate-border bg-white text-sm"
                      />
                      <span className="text-xs text-hbs-slate-muted whitespace-nowrap">
                        {mehrzahl(row.seiten.length, 'Seite', 'Seiten')}
                      </span>
                    </div>
                  </div>
                  {!bulkBusy && (
                    <div className="flex items-center gap-1">
                      {i > 0 && bulkQueue[i - 1].seiten.length + row.seiten.length <= SEITEN_MAX && (
                        <button
                          type="button"
                          title="Mit Exponat darüber zusammenlegen"
                          onClick={() => {
                            setBulkQueue((prev) => {
                              const copy = [...prev];
                              copy[i - 1] = {
                                ...copy[i - 1],
                                seiten: [...copy[i - 1].seiten, ...row.seiten],
                              };
                              copy.splice(i, 1);
                              return copy;
                            });
                          }}
                          className="w-9 h-9 rounded-lg border border-hbs-slate-border bg-white text-sm font-bold"
                        >
                          ⤒
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          row.seiten.forEach((s) => URL.revokeObjectURL(s.url));
                          setBulkQueue((prev) => prev.filter((it) => it.id !== row.id));
                        }}
                        className="w-9 h-9 rounded-lg border border-rose-200 bg-white text-rose-600 text-sm font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <HbsButton variant="action" disabled={bulkBusy} onClick={uploadBulkQueue}>
                {bulkBusy ? 'Wird in Cloudflare R2 gespeichert …' : `${mehrzahl(bulkQueue.length, 'Exponat', 'Exponate')} aufhängen`}
              </HbsButton>
            </div>
          )}
        </HbsCard>

        {/* Liste der Exponate */}
        <HbsCard className="space-y-4">
          <h3 className="text-lg font-black text-hbs-slate-dark">
            {activeExhibits.length ? mehrzahl(activeExhibits.length, 'Exponat im Museum', 'Exponate im Museum') : 'Noch keine Exponate'}
          </h3>
          {activeExhibits.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {activeExhibits.map((ex) => (
                <div key={ex.id} className="rounded-xl border border-hbs-slate-border bg-hbs-bg overflow-hidden flex flex-col">
                  <img
                    src={resolvePageImageUrl(ex.pages[0])}
                    alt={ex.titel}
                    onClick={() => {
                      setDetailPage(0);
                      setDetailExhibitId(ex.id);
                    }}
                    className="w-full aspect-[4/3] object-contain bg-white cursor-zoom-in border-b border-hbs-slate-border"
                  />
                  <div className="p-3 flex-1 flex flex-col gap-1.5">
                    <b className="text-sm font-bold text-hbs-slate-dark truncate">{ex.titel}</b>
                    <span className="text-xs text-hbs-slate-muted">
                      von {ex.name} · {mehrzahl(ex.seiten, 'Seite', 'Seiten')}
                    </span>
                    <span className="text-xs font-semibold text-hbs-slate">
                      ♥ {ex.likesCount} · 💬 {ex.kommentare.length} · ★ {ex.rueck?.length || 0}
                      {countAnnotations(ex) ? ` · ✎ ${countAnnotations(ex)}` : ''}
                    </span>
                    <div className="flex gap-2 pt-2 mt-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setDetailPage(0);
                          setDetailExhibitId(ex.id);
                        }}
                        className="flex-1 h-9 rounded-lg border border-hbs-slate-border bg-white text-xs font-bold hover:bg-hbs-blue-soft"
                      >
                        <Eye className="w-3.5 h-3.5 inline mr-1" /> Ansehen
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm(`„${ex.titel}“ wirklich aus dem Museum und R2 löschen?`)) return;
                          await deleteExhibitAndFiles(activeMuseum.code, ex);
                          onToast('Exponat entfernt.');
                        }}
                        className="h-9 px-3 rounded-lg border border-rose-200 bg-white text-rose-600 text-xs font-bold hover:bg-rose-50"
                      >
                        Entfernen
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-hbs-slate-muted">
              Sobald Schüler über den QR-Code einreichen oder du oben Dateien hochlädst, erscheinen die Exponate hier live.
            </p>
          )}
        </HbsCard>

        <div className="flex flex-wrap justify-between gap-3">
          <HbsButton variant="secondary" onClick={() => onSelectMuseum('')}>
            ← Alle Ausstellungen
          </HbsButton>
          <HbsButton
            variant="danger"
            onClick={() => setDeleteTargetMuseum(activeMuseum)}
          >
            <Trash2 className="w-4 h-4" /> Ausstellung löschen
          </HbsButton>
        </div>

        {deleteConfirmModal}

        {/* QR Modal */}
        <HbsModal isOpen={showQrModal} onClose={() => setShowQrModal(false)} title={`Beitreten: ${activeMuseum.titel}`}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
            <div className="p-4 bg-white rounded-2xl border border-hbs-slate-border shadow-sm">
              <QRCodeSVG value={joinUrl} size={240} />
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <p className="text-sm text-hbs-slate-muted">QR-Code scannen oder Code eingeben:</p>
              <p className="text-4xl font-black tracking-[0.2em] text-hbs-blue-dark">{activeMuseum.code}</p>
              <p className="text-xs font-semibold text-hbs-slate break-all">{joinUrl}</p>
            </div>
          </div>
        </HbsModal>

        {/* Edit Exhibition Modal */}
        <HbsModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Ausstellung bearbeiten"
          footer={
            <>
              <HbsButton variant="secondary" onClick={() => setShowEditModal(false)}>
                Abbrechen
              </HbsButton>
              <HbsButton
                onClick={async () => {
                  if (!editTitle.trim()) return onToast('Titel darf nicht leer sein.');
                  await updateMuseumSettings(activeMuseum.code, {
                    titel: editTitle.trim(),
                    klasse: editKlasse.trim(),
                    hinweis: editHinweis.trim(),
                    saal: editSaal,
                    kriterien: editKrit.map((k) => k.trim()).filter(Boolean),
                  });
                  setShowEditModal(false);
                  onToast('Gespeichert.');
                }}
              >
                Speichern
              </HbsButton>
            </>
          }
        >
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-bold mb-1">Titel</label>
              <input
                type="text"
                maxLength={120}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-hbs-slate-border"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Klasse oder Kurs</label>
              <input
                type="text"
                maxLength={24}
                value={editKlasse}
                onChange={(e) => setEditKlasse(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-hbs-slate-border"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Hinweis / Auftrag im Eingang</label>
              <textarea
                rows={3}
                maxLength={500}
                value={editHinweis}
                onChange={(e) => setEditHinweis(e.target.value)}
                className="w-full p-3 rounded-xl border border-hbs-slate-border"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Saal-Stil</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(SAELE) as [SaalStil, (typeof SAELE)['klassisch']][]).map(([k, cfg]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setEditSaal(k)}
                    className={`p-2.5 rounded-xl border-2 text-xs font-bold ${
                      editSaal === k ? 'border-hbs-blue bg-hbs-blue-soft' : 'border-hbs-slate-border'
                    }`}
                  >
                    <span className="block h-5 rounded mb-1" style={{ background: cfg.farben[0] }} />
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Kriterien für Sterne-Rückmeldungen</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[0, 1, 2].map((i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={30}
                    value={editKrit[i] || ''}
                    onChange={(e) =>
                      setEditKrit((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
                    }
                    placeholder={['Inhalt', 'Gestaltung', 'Verständlichkeit'][i]}
                    className="h-10 px-2.5 rounded-xl border border-hbs-slate-border text-sm"
                  />
                ))}
              </div>
            </div>
          </div>
        </HbsModal>

        {detailExhibit && (
          <ExhibitDetailModal
            museum={activeMuseum}
            exhibit={detailExhibit}
            deviceId={`teacher_${teacher.id}`}
            isTeacherMode={true}
            pageIndex={detailPage}
            showHilfen={true}
            showStellen={true}
            onPageChange={setDetailPage}
            onToggleHilfen={() => {}}
            onToggleStellen={() => {}}
            onOpenZoom={() => {}}
            onLike={async () => {}}
            onAddComment={async (_id, _art, _t, _s: KommentarStelle | null) => {}}
            onDeleteComment={(exId, cid) => removeExhibitComment(activeMuseum.code, exId, cid)}
            onAnswerQuestion={async () => {}}
            onSaveFeedback={async () => {}}
            onDeleteFeedback={(exId, rid) => removeExhibitFeedback(activeMuseum.code, exId, rid)}
            onSaveAnnotations={(exId, anm: Record<string, AnnotationItem[]>) =>
              updateExhibitAnnotations(activeMuseum.code, exId, anm)
            }
            onDeleteExhibit={async (ex) => {
              await deleteExhibitAndFiles(activeMuseum.code, ex);
              setDetailExhibitId(null);
            }}
            onClose={() => setDetailExhibitId(null)}
            onToast={onToast}
          />
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">
      <HbsCard className="bg-gradient-to-br from-hbs-blue to-hbs-blue-dark text-white border-0 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <span className="text-xs font-extrabold uppercase tracking-wider text-hbs-blue-light">
            Lehrkraft-Bereich · Angemeldet als {formatTeacherName(teacher)}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black">Digitaler Museumsrundgang</h2>
          <p className="text-sm text-hbs-blue-light">
            Lege virtuelle Ausstellungen für deine Klassen an: Lernende laden Plakate, PDFs, PowerPoint-Präsentationen (.pptx), Audio oder Video hoch – danach geht die ganze Klasse gemeinsam durch den 3D-Saal.
          </p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="h-11 px-4 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-bold inline-flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" /> Abmelden
        </button>
      </HbsCard>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Neue Ausstellung */}
        <HbsCard className="lg:col-span-5 space-y-4">
          <h3 className="text-lg font-black text-hbs-slate-dark flex items-center gap-2">
            <Plus className="w-5 h-5 text-hbs-blue" /> Neue Ausstellung anlegen
          </h3>
          <form onSubmit={handleCreate} className="space-y-3.5">
            <div>
              <label className="block text-sm font-bold text-hbs-slate-dark mb-1">Titel der Ausstellung</label>
              <input
                type="text"
                maxLength={120}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="z. B. Wie klingt ein Jahrzehnt? – unsere Plakate"
                className="w-full h-11 px-3 rounded-xl border border-hbs-slate-border bg-white text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-hbs-slate-dark mb-1">Klasse oder Kurs</label>
              <input
                type="text"
                maxLength={24}
                value={newKlasse}
                onChange={(e) => setNewKlasse(e.target.value)}
                placeholder="z. B. 7c oder Q1 GK"
                className="w-full sm:w-48 h-11 px-3 rounded-xl border border-hbs-slate-border bg-white text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-hbs-slate-dark mb-1">Auftrag / Hinweis im Eingang</label>
              <textarea
                rows={3}
                maxLength={500}
                value={newHinweis}
                onChange={(e) => setNewHinweis(e.target.value)}
                placeholder="Auftrag für die Klasse, erscheint auf dem Banner im Eingang (optional)"
                className="w-full p-3 rounded-xl border border-hbs-slate-border bg-white text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-hbs-slate-dark mb-1.5">Saal-Stil</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(SAELE) as [SaalStil, (typeof SAELE)['klassisch']][]).map(([k, cfg]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setNewSaal(k)}
                    className={`p-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                      newSaal === k ? 'border-hbs-blue bg-hbs-blue-soft text-hbs-blue-dark' : 'border-hbs-slate-border bg-white'
                    }`}
                  >
                    <span className="block h-6 rounded-md mb-1.5" style={{ background: cfg.farben[0] }} />
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-hbs-slate-dark mb-1">Kriterien für Rückmeldungen (Sterne)</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[0, 1, 2].map((i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={30}
                    value={newKrit[i]}
                    onChange={(e) =>
                      setNewKrit((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
                    }
                    className="h-10 px-2.5 rounded-xl border border-hbs-slate-border text-sm bg-white"
                  />
                ))}
              </div>
            </div>

            <HbsButton type="submit" size="lg" variant="action" disabled={creating} className="w-full sm:w-auto">
              {creating ? 'Wird angelegt …' : 'Ausstellung anlegen'}
            </HbsButton>
          </form>
        </HbsCard>

        {/* Rechte Spalte: Probeausstellung + Bestehende Ausstellungen */}
        <div className="lg:col-span-7 space-y-5">
          <HbsCard className="space-y-3 bg-hbs-bg-paper">
            <h3 className="text-lg font-black text-hbs-slate-dark flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-hbs-amber" /> Probeausstellung (Live-Simulation)
            </h3>
            <p className="text-sm text-hbs-slate">
              Fertige Beispielausstellung mit 8 Musik-Plakaten, Markierungen und simulierten Besuchern – ideal zum Ausprobieren oder Zeigen im Kollegium.
            </p>
            <div className="flex flex-wrap gap-2">
              <HbsButton variant="primary" onClick={() => onLaunchDemo(false)}>
                Als Gerät ansehen
              </HbsButton>
              <HbsButton variant="secondary" onClick={() => onLaunchDemo(true)}>
                Am Beamer ansehen
              </HbsButton>
            </div>
          </HbsCard>

          <HbsCard className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-lg font-black text-hbs-slate-dark">Ausstellungen der Schule</h3>
              <HbsButton variant="ghost" onClick={refreshList} className="h-9 px-3 text-xs">
                Aktualisieren
              </HbsButton>
            </div>

            {classes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setClassFilter('')}
                  className={`h-8 px-3 rounded-full text-xs font-bold border ${
                    classFilter === '' ? 'bg-hbs-blue text-white border-hbs-blue' : 'bg-white border-hbs-slate-border'
                  }`}
                >
                  Alle
                </button>
                {classes.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setClassFilter(k)}
                    className={`h-8 px-3 rounded-full text-xs font-bold border ${
                      classFilter === k ? 'bg-hbs-blue text-white border-hbs-blue' : 'bg-white border-hbs-slate-border'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            )}

            {loadingList ? (
              <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />
            ) : filteredMuseums.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredMuseums.map((m) => (
                  <div
                    key={m.code}
                    className="group relative rounded-xl border border-hbs-slate-border hover:border-hbs-blue bg-hbs-bg p-4 flex items-start justify-between gap-2 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => onSelectMuseum(m.code)}
                      className="text-left flex-1 min-w-0 flex flex-col gap-1.5"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        {m.klasse && <HbsBadge label={m.klasse} variant="blue" />}
                        <HbsBadge
                          label={m.phase === 'aufbau' ? 'Aufbau' : m.phase === 'rundgang' ? 'Rundgang offen' : 'Geschlossen'}
                          variant={m.phase === 'rundgang' ? 'teal' : m.phase === 'aufbau' ? 'amber' : 'neutral'}
                        />
                      </div>
                      <b className="text-base font-bold text-hbs-slate-dark truncate w-full">{m.titel}</b>
                      <span className="text-xs text-hbs-slate-muted">
                        Code {m.code} · von {m.authorName} · {SAELE[m.saal]?.label || 'Klassisch'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTargetMuseum(m);
                      }}
                      aria-label={`Ausstellung ${m.titel} löschen`}
                      title="Ausstellung inkl. Cloudflare-Dateien löschen"
                      className="shrink-0 h-11 w-11 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 inline-flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-hbs-slate-muted">Noch keine Ausstellungen angelegt.</p>
            )}
          </HbsCard>
        </div>
      </div>

      {deleteConfirmModal}
    </div>
  );
};
