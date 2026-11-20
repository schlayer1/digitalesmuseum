import React, { useEffect, useRef, useState } from 'react';
import { Download, Film, Headphones, Maximize2, MessageSquare, Star, Trash2, Volume2 } from 'lucide-react';
import { AnnotationItem, Exponat, Kommentar, KommentarStelle, MuseumAusstellung, Rueckmeldung } from '../../types/museum';
import { countAnnotations, getCommentsWithSpot, getPageAnnotations, SpotOverlayItem } from '../../utils/annotations';
import { resolveMediaUrl, resolvePageImageUrl } from '../../services/r2Storage';
import { begrenzt, getSavedNickname, mehrzahl, setSavedNickname, spitzname } from '../../utils/museumHelpers';
import { AnnotationSvgOverlay } from './AnnotationSvgOverlay';
import { AnnotatorModal } from './AnnotatorModal';
import { HbsBadge, HbsButton } from '../hbs/HbsKit';

interface ExhibitDetailModalProps {
  museum: MuseumAusstellung;
  exhibit: Exponat;
  deviceId: string;
  isTeacherMode: boolean;
  pageIndex: number;
  showHilfen: boolean;
  showStellen: boolean;
  onPageChange: (page: number) => void;
  onToggleHilfen: () => void;
  onToggleStellen: () => void;
  onOpenZoom: () => void;
  onLike: (exhibitId: string) => Promise<void>;
  onAddComment: (exhibitId: string, art: 'kommentar' | 'frage', text: string, spot: KommentarStelle | null, nickname: string) => Promise<void>;
  onDeleteComment: (exhibitId: string, commentId: string) => Promise<void>;
  onAnswerQuestion: (exhibitId: string, commentId: string, text: string) => Promise<void>;
  onSaveFeedback: (exhibitId: string, stars: number[], gut: string, tipp: string, nickname: string) => Promise<void>;
  onDeleteFeedback: (exhibitId: string, feedbackId: string) => Promise<void>;
  onSaveAnnotations: (exhibitId: string, anm: Record<string, AnnotationItem[]>) => Promise<void>;
  onDeleteExhibit?: (exhibit: Exponat) => Promise<void>;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const ExhibitDetailModal: React.FC<ExhibitDetailModalProps> = ({
  museum,
  exhibit,
  deviceId,
  isTeacherMode,
  pageIndex,
  showHilfen,
  showStellen,
  onPageChange,
  onToggleHilfen,
  onToggleStellen,
  onOpenZoom,
  onLike,
  onAddComment,
  onDeleteComment,
  onAnswerQuestion,
  onSaveFeedback,
  onDeleteFeedback,
  onSaveAnnotations,
  onDeleteExhibit,
  onClose,
  onToast,
}) => {
  const safePage = begrenzt(pageIndex, 0, Math.max(0, exhibit.seiten - 1));
  const imgUrl = resolvePageImageUrl(exhibit.pages[safePage]);
  const mediaAssetUrl = resolveMediaUrl(exhibit.mediaAsset);
  const audioCompanionUrl = resolveMediaUrl(exhibit.audioCompanion);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const [selectedSpotId, setSelectedSpotId] = useState<string>('');
  const [commentArt, setCommentArt] = useState<'kommentar' | 'frage'>('kommentar');
  const [commentText, setCommentText] = useState('');
  const [pendingSpot, setPendingSpot] = useState<KommentarStelle | null>(null);
  const [nickname, setNickname] = useState(() => getSavedNickname() || '');
  const [answersDraft, setAnswersDraft] = useState<Record<string, string>>({});

  const isMine = exhibit.deviceId === deviceId;
  const canInteract = museum.phase === 'rundgang' && !isTeacherMode;
  const canEditHilfen = (isMine && !isTeacherMode && museum.phase !== 'zu') || isTeacherMode;
  const liked = (exhibit.likedBy || []).includes(deviceId);

  const kriterien = museum.kriterien?.length ? museum.kriterien : ['Inhalt', 'Gestaltung', 'Verständlichkeit'];
  const existingMyFeedback = (exhibit.rueck || []).find((r) => r.deviceId === deviceId);
  const [stars, setStars] = useState<number[]>(() => existingMyFeedback?.sterne || [0, 0, 0]);
  const [gutText, setGutText] = useState(() => existingMyFeedback?.gut || '');
  const [tippText, setTippText] = useState(() => existingMyFeedback?.tipp || '');

  const [annotatorMode, setAnnotatorMode] = useState<null | 'hilfen' | 'stelle'>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setStars(existingMyFeedback?.sterne || [0, 0, 0]);
    setGutText(existingMyFeedback?.gut || '');
    setTippText(existingMyFeedback?.tipp || '');
  }, [exhibit.id, existingMyFeedback?.id]);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (annotatorMode) return;
      if (ev.key === 'Escape') onClose();
      else if (ev.key === 'ArrowLeft') onPageChange(begrenzt(safePage - 1, 0, exhibit.seiten - 1));
      else if (ev.key === 'ArrowRight') onPageChange(begrenzt(safePage + 1, 0, exhibit.seiten - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [annotatorMode, safePage, exhibit.seiten, onClose, onPageChange]);

  const spotsAll = getCommentsWithSpot(exhibit);
  const pageSpots: SpotOverlayItem[] = showStellen
    ? spotsAll
        .map((c, idx) => ({ c, nr: idx + 1 }))
        .filter(({ c }) => c.stelle && c.stelle.s === safePage)
        .map(({ c, nr }) => ({
          st: c.stelle!,
          nr,
          id: c.id,
          frage: c.art === 'frage',
        }))
    : [];

  const pageHilfen = showHilfen ? getPageAnnotations(exhibit, safePage) : [];
  const totalHilfen = countAnnotations(exhibit);
  const currentPageHilfenCount = getPageAnnotations(exhibit, safePage).length;
  const currentPageSpotsCount = spotsAll.filter((c) => c.stelle?.s === safePage).length;

  const selectSpot = (commentId: string) => {
    const found = exhibit.kommentare.find((k) => k.id === commentId);
    if (!found?.stelle) return;
    const nextId = selectedSpotId === commentId ? '' : commentId;
    setSelectedSpotId(nextId);
    if (!showStellen) onToggleStellen();
    if (nextId && found.stelle.s !== safePage) onPageChange(found.stelle.s);
  };

  const handleSendComment = async () => {
    const t = commentText.trim();
    if (!t) return;
    let nick = nickname.trim();
    if (!nick) {
      nick = spitzname();
      setNickname(nick);
    }
    setSavedNickname(nick);
    setBusy(true);
    try {
      await onAddComment(exhibit.id, commentArt, t, pendingSpot, nick);
      setCommentText('');
      setPendingSpot(null);
      onToast(commentArt === 'frage' ? 'Deine Frage hängt am Exponat.' : 'Dein Kommentar hängt am Exponat.');
    } finally {
      setBusy(false);
    }
  };

  const handleSendFeedback = async () => {
    if (!gutText.trim() && !tippText.trim() && !stars.some((x) => x > 0)) {
      onToast('Vergib Sterne oder schreib, was gelungen ist oder was du rätst.');
      return;
    }
    let nick = nickname.trim();
    if (!nick) {
      nick = spitzname();
      setNickname(nick);
    }
    setSavedNickname(nick);
    setBusy(true);
    try {
      await onSaveFeedback(exhibit.id, kriterien.map((_, i) => stars[i] || 0), gutText.trim(), tippText.trim(), nick);
      onToast('Danke – deine Rückmeldung ist angekommen.');
    } finally {
      setBusy(false);
    }
  };

  const myReceivedFeedback = exhibit.rueck || [];
  const starAvg = kriterien
    .map((name, i) => {
      const vals = myReceivedFeedback.map((r) => r.sterne[i] || 0).filter((v) => v > 0);
      return { name, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0, count: vals.length };
    })
    .filter((x) => x.count > 0);

  return (
    <div
      className="fixed inset-0 z-[61] bg-[#0a0704]/92 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(330px,28rem)]"
      role="dialog"
      aria-modal="true"
      aria-label={exhibit.titel}
    >
      {/* Linke Seite: Exponat-Anzeige (Bild / Video / Audio / Seiten / Ebenen) */}
      <div className="relative flex flex-col items-center justify-center p-3 sm:p-5 min-h-0 max-h-[50dvh] lg:max-h-full">
        {/* Ebenen-Schalter oben links */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 z-10 max-w-[calc(100%-5rem)]">
          {totalHilfen > 0 && (
            <button
              type="button"
              onClick={onToggleHilfen}
              className={`h-9 px-3 rounded-full text-xs font-bold backdrop-blur transition-colors ${
                showHilfen ? 'bg-white text-hbs-slate-dark' : 'bg-black/60 text-white'
              }`}
            >
              ✎ Hilfen{currentPageHilfenCount ? ` · ${currentPageHilfenCount}` : ''}
            </button>
          )}
          {spotsAll.length > 0 && (
            <button
              type="button"
              onClick={onToggleStellen}
              className={`h-9 px-3 rounded-full text-xs font-bold backdrop-blur transition-colors ${
                showStellen ? 'bg-white text-hbs-slate-dark' : 'bg-black/60 text-white'
              }`}
            >
              📍 Stellen{currentPageSpotsCount ? ` · ${currentPageSpotsCount}` : ''}
            </button>
          )}
          {canEditHilfen && exhibit.mediaType !== 'video' && exhibit.mediaType !== 'audio' && (
            <button
              type="button"
              onClick={() => setAnnotatorMode('hilfen')}
              className="h-9 px-3 rounded-full text-xs font-bold bg-hbs-blue text-white hover:bg-hbs-blue-deep shadow"
            >
              ✎ Hilfen bearbeiten
            </button>
          )}
        </div>

        {/* Zoom-Button oben rechts */}
        {exhibit.mediaType !== 'video' && (
          <button
            type="button"
            aria-label="Vollbild mit Zoom"
            title="Vollbild mit Zoom"
            onClick={onOpenZoom}
            className="absolute right-3 top-3 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center z-10"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}

        {/* Hauptmedium: Video, Audio oder Bild/Folie */}
        {exhibit.mediaType === 'video' && mediaAssetUrl ? (
          <div className="w-full max-w-4xl flex flex-col items-center gap-3">
            <video
              src={mediaAssetUrl}
              poster={imgUrl}
              controls
              playsInline
              className="w-full max-h-[42dvh] lg:max-h-[78dvh] rounded-xl bg-black shadow-2xl"
            />
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-200 bg-black/50 px-3 py-1 rounded-full">
              <Film className="w-3.5 h-3.5" /> Video-Präsentation · {exhibit.mediaAsset?.fileName}
            </span>
          </div>
        ) : (
          <div className="relative flex items-center justify-center w-full h-full min-h-0">
            <img
              ref={imgRef}
              src={imgUrl}
              alt={`${exhibit.titel}, Seite ${safePage + 1}`}
              onClick={onOpenZoom}
              className="max-w-full max-h-[42dvh] lg:max-h-[calc(100dvh-6rem)] object-contain bg-white shadow-2xl cursor-zoom-in rounded"
            />
            <AnnotationSvgOverlay
              imgRef={imgRef}
              annotations={pageHilfen}
              stellen={pageSpots}
              selectedSpotId={selectedSpotId}
              onSpotClick={selectSpot}
            />
          </div>
        )}

        {/* Audio-Player (bei reinem Audio-Exponat ODER Begleit-Audio zu einem Plakat) */}
        {((exhibit.mediaType === 'audio' && mediaAssetUrl) || audioCompanionUrl) && (
          <div className="mt-3 w-full max-w-xl bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-hbs-teal text-white flex items-center justify-center shrink-0">
              {exhibit.mediaType === 'audio' ? <Headphones className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white/90 truncate mb-1">
                {exhibit.mediaType === 'audio'
                  ? `Audio-Beitrag: ${exhibit.mediaAsset?.fileName || exhibit.titel}`
                  : `Audio-Kommentar: ${exhibit.audioCompanion?.fileName || 'Erklärung'}`}
              </p>
              <audio
                src={exhibit.mediaType === 'audio' ? mediaAssetUrl : audioCompanionUrl}
                controls
                className="w-full h-8"
              />
            </div>
          </div>
        )}

        {/* Seitenblättern */}
        {exhibit.seiten > 1 && (
          <>
            <button
              type="button"
              aria-label="Vorige Seite"
              disabled={safePage === 0}
              onClick={() => onPageChange(safePage - 1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 text-white text-xl font-bold disabled:opacity-25"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Nächste Seite"
              disabled={safePage >= exhibit.seiten - 1}
              onClick={() => onPageChange(safePage + 1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 text-white text-xl font-bold disabled:opacity-25"
            >
              ›
            </button>
            <span className="absolute bottom-2.5 left-1/2 -translate-x-1/2 text-xs font-bold text-white bg-black/60 px-3 py-1 rounded-full">
              Seite {safePage + 1} von {exhibit.seiten}
            </span>
          </>
        )}
      </div>

      {/* Rechte Seite: Schild, Likes, Downloads, Kommentare, Fragen, Rückmeldungen */}
      <aside className="bg-white text-hbs-slate overflow-y-auto p-4 sm:p-5 space-y-4 border-l border-hbs-slate-border">
        <header className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <HbsBadge
                label={
                  exhibit.mediaType === 'video'
                    ? 'Video'
                    : exhibit.mediaType === 'audio'
                      ? 'Audio'
                      : exhibit.mediaType === 'pptx'
                        ? 'PPTX → PDF'
                        : exhibit.mediaType === 'pdf'
                          ? 'PDF-Präsentation'
                          : 'Plakat / Foto'
                }
                variant="blue"
              />
              {isMine && <HbsBadge label="Dein Exponat" variant="teal" />}
            </div>
            <h2 className="font-serif font-bold text-xl text-hbs-slate-dark leading-tight">{exhibit.titel}</h2>
            <p className="text-sm text-hbs-slate-muted mt-0.5">
              von {exhibit.name}
              {isMine ? ' (du)' : ''}
            </p>
          </div>
          <HbsButton variant="secondary" onClick={onClose} className="shrink-0">
            ✕ Zurück
          </HbsButton>
        </header>

        {exhibit.text && <p className="text-sm whitespace-pre-wrap text-hbs-slate leading-relaxed">{exhibit.text}</p>}

        <div className="flex flex-wrap items-center gap-2">
          {canInteract ? (
            <button
              type="button"
              onClick={() => onLike(exhibit.id)}
              className={`h-11 px-5 rounded-full border-2 font-extrabold text-sm transition-all ${
                liked
                  ? 'bg-pink-600 border-pink-600 text-white shadow-sm'
                  : 'border-pink-600 text-pink-600 hover:bg-pink-50'
              }`}
            >
              ♥ Gefällt mir · {exhibit.likesCount}
            </button>
          ) : (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-pink-50 text-pink-700 font-bold text-sm">
              ♥ {exhibit.likesCount}
            </span>
          )}

          {mediaAssetUrl && (exhibit.mediaType === 'pdf' || exhibit.mediaType === 'pptx') && (
            <a
              href={mediaAssetUrl}
              download={exhibit.mediaAsset?.fileName || `${exhibit.titel}.pdf`}
              className="inline-flex items-center gap-1.5 h-11 px-4 rounded-xl border border-hbs-slate-border text-xs font-bold text-hbs-blue hover:bg-hbs-blue-soft"
            >
              <Download className="w-4 h-4" /> PDF herunterladen
            </a>
          )}
        </div>

        {/* Rückmeldungen an mich (nur Ersteller sieht das) */}
        {((isMine && !isTeacherMode) || isTeacherMode) && myReceivedFeedback.length > 0 && (
          <div className="rounded-xl border border-dashed border-hbs-blue/40 bg-hbs-blue-soft/50 p-3.5 space-y-2.5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-hbs-blue flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5" />
              Rückmeldungen ({myReceivedFeedback.length}) – privat für Ersteller &amp; Lehrkraft
            </h4>
            {starAvg.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {starAvg.map((x) => (
                  <span key={x.name} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-hbs-slate-border text-xs">
                    <span>{x.name}</span>
                    <b className="text-amber-600">{x.avg.toFixed(1).replace('.', ',')} ★</b>
                  </span>
                ))}
              </div>
            )}
            <ul className="space-y-2">
              {myReceivedFeedback.map((r: Rueckmeldung) => (
                <li key={r.id} className="bg-white rounded-xl p-2.5 border border-hbs-slate-border text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-hbs-slate-muted">
                    <span>{r.name}</span>
                    {isTeacherMode && (
                      <button
                        type="button"
                        onClick={() => onDeleteFeedback(exhibit.id, r.id)}
                        className="text-rose-600 hover:underline"
                      >
                        Entfernen
                      </button>
                    )}
                  </div>
                  {r.sterne.some((s) => s > 0) && (
                    <div className="flex flex-wrap gap-2 text-amber-600">
                      {kriterien.map((k, i) =>
                        r.sterne[i] ? (
                          <span key={k}>
                            {k}: {'★'.repeat(r.sterne[i])}
                            {'☆'.repeat(5 - r.sterne[i])}
                          </span>
                        ) : null
                      )}
                    </div>
                  )}
                  {r.gut && (
                    <p>
                      <b>Gelungen:</b> {r.gut}
                    </p>
                  )}
                  {r.tipp && (
                    <p>
                      <b>Tipp:</b> {r.tipp}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Kommentare & Fragen */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-hbs-slate-muted flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            {exhibit.kommentare.length
              ? `Kommentare und Fragen (${exhibit.kommentare.length})`
              : 'Noch keine Kommentare'}
          </h4>

          <ul className="space-y-2">
            {exhibit.kommentare.map((c: Kommentar) => {
              const spotNr = c.stelle ? spotsAll.findIndex((s) => s.id === c.id) + 1 : 0;
              const isOwnComment = c.deviceId === deviceId;
              return (
                <li
                  key={c.id}
                  onClick={() => {
                    if (c.stelle) selectSpot(c.id);
                  }}
                  className={`rounded-xl border p-3 text-sm space-y-1.5 transition-all ${
                    c.art === 'frage' ? 'border-l-4 border-l-hbs-amber bg-hbs-amber-light/40' : 'bg-hbs-bg border-hbs-slate-border'
                  } ${c.stelle ? 'cursor-pointer hover:border-hbs-blue' : ''} ${
                    selectedSpotId === c.id ? 'ring-2 ring-hbs-blue border-hbs-blue' : ''
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-hbs-slate-muted flex-wrap">
                    {c.art === 'frage' && <HbsBadge label="Frage" variant="amber" />}
                    {spotNr > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-hbs-blue-light text-hbs-blue font-bold">
                        📍 {c.art === 'frage' ? '?' : ''}
                        {spotNr}
                        {exhibit.seiten > 1 ? ` · S. ${c.stelle!.s + 1}` : ''}
                      </span>
                    )}
                    <span>
                      {c.name}
                      {isOwnComment ? ' (du)' : ''}
                    </span>
                    <span className="flex-1" />
                    {((isOwnComment && canInteract) || isTeacherMode) && (
                      <button
                        type="button"
                        title="Entfernen"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onDeleteComment(exhibit.id, c.id);
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <p className="text-hbs-slate">{c.text}</p>
                  {c.antwort && (
                    <div className="rounded-lg bg-hbs-blue-soft px-3 py-2 text-xs">
                      <b className="block text-hbs-blue mb-0.5">Antwort von {exhibit.name}</b>
                      <span>{c.antwort.text}</span>
                    </div>
                  )}
                  {c.art === 'frage' && isMine && canInteract && (
                    <div className="flex gap-1.5 pt-1" onClick={(ev) => ev.stopPropagation()}>
                      <input
                        type="text"
                        maxLength={300}
                        placeholder="Antworten …"
                        value={answersDraft[c.id] ?? c.antwort?.text ?? ''}
                        onChange={(ev) => setAnswersDraft((prev) => ({ ...prev, [c.id]: ev.target.value }))}
                        className="flex-1 h-9 px-2.5 rounded-lg border border-hbs-slate-border bg-white text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => onAnswerQuestion(exhibit.id, c.id, answersDraft[c.id] ?? c.antwort?.text ?? '')}
                        className="h-9 px-3 rounded-lg bg-hbs-blue text-white text-xs font-bold"
                      >
                        {c.antwort ? 'Ändern' : 'Antworten'}
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Neuen Kommentar / Frage schreiben */}
        {canInteract && museum.kommentare ? (
          <div className="pt-2 border-t border-slate-100 space-y-2.5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-hbs-slate-muted">Selbst etwas sagen</h4>
            <div className="inline-flex rounded-full border-2 border-hbs-blue overflow-hidden">
              {(['kommentar', 'frage'] as const).map((art) => (
                <button
                  key={art}
                  type="button"
                  onClick={() => setCommentArt(art)}
                  className={`px-4 py-1.5 text-xs font-bold ${
                    commentArt === art ? 'bg-hbs-blue text-white' : 'text-hbs-blue bg-white'
                  }`}
                >
                  {art === 'kommentar' ? 'Kommentar' : 'Frage'}
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              maxLength={300}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={commentArt === 'frage' ? 'Was möchtest du wissen?' : 'Was fällt dir auf? Was gefällt dir?'}
              className="w-full p-2.5 rounded-xl border border-hbs-slate-border text-sm bg-white"
            />
            <div className="flex flex-wrap items-center gap-2">
              {exhibit.mediaType !== 'video' && (
                <button
                  type="button"
                  onClick={() => setAnnotatorMode('stelle')}
                  className="h-9 px-3 rounded-xl border border-hbs-slate-border text-xs font-bold text-hbs-slate hover:bg-hbs-blue-soft"
                >
                  {pendingSpot ? '📍 Stelle ändern' : '📍 An einer Stelle'}
                </button>
              )}
              {pendingSpot && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-hbs-blue-light text-hbs-blue text-xs font-bold">
                  📍 Seite {pendingSpot.s + 1}
                  <button type="button" onClick={() => setPendingSpot(null)} className="ml-1">
                    ✕
                  </button>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <HbsButton disabled={busy || !commentText.trim()} onClick={handleSendComment}>
                Senden
              </HbsButton>
              <span className="text-xs text-hbs-slate-muted">als</span>
              <button
                type="button"
                onClick={() => {
                  const next = prompt('Dein Spitzname (nicht dein echter Name):', nickname || spitzname());
                  if (next && next.trim()) {
                    const clean = next.trim().slice(0, 20);
                    setNickname(clean);
                    setSavedNickname(clean);
                  }
                }}
                className="px-2.5 py-1 rounded-full bg-hbs-blue-soft text-hbs-blue text-xs font-bold"
              >
                ✎ {nickname || 'Spitzname wählen'}
              </button>
            </div>
          </div>
        ) : canInteract ? (
          <p className="text-xs text-hbs-slate-muted">Kommentieren ist gerade ausgeschaltet.</p>
        ) : null}

        {/* Rückmeldung an die Ausstellenden */}
        {canInteract && !isMine && museum.rueck && (
          <div className="rounded-xl border border-dashed border-hbs-slate-border p-3.5 space-y-2.5 bg-hbs-bg-paper">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-hbs-slate-dark">
              {existingMyFeedback ? 'Deine Rückmeldung' : 'Rückmeldung an die Ausstellenden'}
            </h4>
            <p className="text-xs text-hbs-slate-muted">Sehen nur die Ausstellenden und deine Lehrkraft.</p>
            {kriterien.map((k, i) => (
              <div key={k} className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-hbs-slate">{k}</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((z) => (
                    <button
                      key={z}
                      type="button"
                      aria-label={`${k}: ${z} von 5`}
                      onClick={() =>
                        setStars((prev) => {
                          const next = [...prev];
                          next[i] = next[i] === z ? 0 : z;
                          return next;
                        })
                      }
                      className={`text-xl leading-none px-0.5 ${
                        (stars[i] || 0) >= z ? 'text-amber-500' : 'text-slate-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <textarea
              rows={2}
              maxLength={300}
              value={gutText}
              onChange={(e) => setGutText(e.target.value)}
              placeholder="Das ist gelungen …"
              className="w-full p-2 rounded-xl border border-hbs-slate-border text-xs bg-white"
            />
            <textarea
              rows={2}
              maxLength={300}
              value={tippText}
              onChange={(e) => setTippText(e.target.value)}
              placeholder="Mein Tipp …"
              className="w-full p-2 rounded-xl border border-hbs-slate-border text-xs bg-white"
            />
            <HbsButton disabled={busy} variant="secondary" onClick={handleSendFeedback}>
              {existingMyFeedback ? 'Rückmeldung ändern' : 'Rückmeldung senden'}
            </HbsButton>
          </div>
        )}

        {isTeacherMode && onDeleteExhibit && (
          <div className="pt-2 border-t border-slate-100">
            <HbsButton variant="danger" onClick={() => onDeleteExhibit(exhibit)} className="w-full">
              <Trash2 className="w-4 h-4" /> Exponat aus dem Museum nehmen
            </HbsButton>
          </div>
        )}
      </aside>

      {annotatorMode === 'hilfen' && (
        <AnnotatorModal
          imageUrl={imgUrl}
          title={`Hilfen auf Seite ${safePage + 1} – „${exhibit.titel}“`}
          mode="hilfen"
          initialAnnotations={getPageAnnotations(exhibit, safePage)}
          onCancel={() => setAnnotatorMode(null)}
          onConfirmHilfen={async (items) => {
            const nextAnm: Record<string, AnnotationItem[]> = { ...(exhibit.anm || {}) };
            nextAnm[String(safePage)] = items;
            await onSaveAnnotations(exhibit.id, nextAnm);
            setAnnotatorMode(null);
            onToast(
              items.length
                ? `${mehrzahl(items.length, 'Hilfe', 'Hilfen')} auf Seite ${safePage + 1} gespeichert.`
                : `Hilfen auf Seite ${safePage + 1} entfernt.`
            );
          }}
          onToast={onToast}
        />
      )}

      {annotatorMode === 'stelle' && (
        <AnnotatorModal
          imageUrl={imgUrl}
          title={`Stelle auf Seite ${safePage + 1} markieren`}
          mode="stelle"
          initialSpot={pendingSpot && pendingSpot.s === safePage ? pendingSpot : null}
          onCancel={() => setAnnotatorMode(null)}
          onConfirmSpot={(spot) => {
            setPendingSpot(spot ? { ...spot, s: safePage, t: spot.t } : null);
            setAnnotatorMode(null);
          }}
          onToast={onToast}
        />
      )}
    </div>
  );
};
