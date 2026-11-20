import React from 'react';
import { Exponat, MuseumAusstellung } from '../../types/museum';
import { resolvePageImageUrl } from '../../services/r2Storage';
import { mehrzahl } from '../../utils/museumHelpers';
import { HbsBadge, HbsButton, HbsCard } from '../hbs/HbsKit';

interface ExitSummaryViewProps {
  museum: MuseumAusstellung;
  exponate: Exponat[];
  deviceId: string;
  isBeamer: boolean;
  visitedIds: Set<string>;
  onReenter: () => void;
  onBackToExhibition?: () => void;
}

export const ExitSummaryView: React.FC<ExitSummaryViewProps> = ({
  museum,
  exponate,
  deviceId,
  isBeamer,
  visitedIds,
  onReenter,
  onBackToExhibition,
}) => {
  const favorites = [...exponate]
    .filter((e) => e.likesCount > 0)
    .sort((a, b) => b.likesCount - a.likesCount || b.kommentare.length - a.kommentare.length)
    .slice(0, 3);

  const totalLikes = exponate.reduce((a, e) => a + e.likesCount, 0);
  const totalComments = exponate.reduce((a, e) => a + e.kommentare.filter((k) => k.art !== 'frage').length, 0);
  const totalQuestions = exponate.reduce((a, e) => a + e.kommentare.filter((k) => k.art === 'frage').length, 0);
  const totalFeedback = exponate.reduce((a, e) => a + (e.rueck?.length || 0), 0);

  const myLiked = exponate.filter((e) => (e.likedBy || []).includes(deviceId));
  const myComments: { e: Exponat; k: Exponat['kommentare'][number] }[] = [];
  exponate.forEach((e) => {
    e.kommentare.forEach((k) => {
      if (k.deviceId === deviceId) myComments.push({ e, k });
    });
  });
  const myExhibit = exponate.find((e) => e.deviceId === deviceId);
  const visitedCount = exponate.filter((e) => visitedIds.has(e.id)).length;

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-6 space-y-5">
      <HbsCard className="bg-gradient-to-br from-hbs-blue to-hbs-blue-dark text-white border-0">
        <span className="text-xs font-extrabold uppercase tracking-wider text-hbs-blue-light">
          {isBeamer ? 'Ende des Rundgangs' : 'Danke für deinen Besuch · Heimbürgeschule Kahla'}
        </span>
        <h2 className="text-2xl sm:text-3xl font-black mt-1">{museum.titel}</h2>
      </HbsCard>

      {isBeamer ? (
        <HbsCard>
          <h3 className="text-lg font-black text-hbs-slate-dark mb-3">Bilanz der Ausstellung</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatTile value={String(exponate.length)} label="Exponate" />
            <StatTile value={String(totalLikes)} label="Likes" />
            <StatTile value={String(totalComments)} label="Kommentare" />
            <StatTile value={String(totalQuestions)} label="Fragen" />
            <StatTile value={String(totalFeedback)} label="Rückmeldungen" />
          </div>
        </HbsCard>
      ) : (
        <>
          <HbsCard>
            <h3 className="text-lg font-black text-hbs-slate-dark mb-3">Dein Rundgang</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatTile value={`${visitedCount} / ${exponate.length}`} label="Angesehen" />
              <StatTile value={String(myLiked.length)} label={myLiked.length === 1 ? 'Like vergeben' : 'Likes vergeben'} />
              <StatTile
                value={String(myComments.filter((x) => x.k.art !== 'frage').length)}
                label="Kommentare"
              />
              <StatTile
                value={String(myComments.filter((x) => x.k.art === 'frage').length)}
                label="Fragen"
              />
            </div>
          </HbsCard>

          {myExhibit && (
            <HbsCard className="space-y-3">
              <h3 className="text-lg font-black text-hbs-slate-dark">Dein Exponat</h3>
              <div className="flex items-center gap-3">
                <img
                  src={resolvePageImageUrl(myExhibit.pages[0])}
                  alt={myExhibit.titel}
                  className="w-20 h-14 object-contain bg-white rounded-lg border border-hbs-slate-border"
                />
                <div>
                  <b className="text-hbs-slate-dark block">{myExhibit.titel}</b>
                  <span className="text-xs text-hbs-slate-muted">
                    ♥ {myExhibit.likesCount} · {mehrzahl(myExhibit.kommentare.length, 'Kommentar/Frage', 'Kommentare/Fragen')} ·{' '}
                    {mehrzahl(myExhibit.rueck?.length || 0, 'Rückmeldung', 'Rückmeldungen')}
                  </span>
                </div>
              </div>
            </HbsCard>
          )}

          <HbsCard className="space-y-3">
            <h3 className="text-lg font-black text-hbs-slate-dark">Was dir gefallen hat</h3>
            {myLiked.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {myLiked.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 p-2 rounded-xl bg-hbs-bg border border-hbs-slate-border">
                    <img
                      src={resolvePageImageUrl(e.pages[0])}
                      alt=""
                      className="w-16 h-12 object-contain bg-white rounded border border-hbs-slate-border"
                    />
                    <div className="min-w-0">
                      <b className="text-sm text-hbs-slate-dark truncate block">{e.titel}</b>
                      <span className="text-xs text-hbs-slate-muted">
                        von {e.name} · ♥ {e.likesCount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-hbs-slate-muted">Du hast kein Exponat mit ♥ markiert.</p>
            )}
          </HbsCard>

          <HbsCard className="space-y-3">
            <h3 className="text-lg font-black text-hbs-slate-dark">Deine Kommentare und Fragen</h3>
            {myComments.length ? (
              <ul className="space-y-2">
                {myComments.map(({ e, k }) => (
                  <li key={k.id} className="rounded-xl border border-hbs-slate-border bg-hbs-bg p-3 text-sm space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-hbs-slate-muted">
                      {k.art === 'frage' && <HbsBadge label="Frage" variant="amber" />}
                      <span>zu „{e.titel}“</span>
                    </div>
                    <p>{k.text}</p>
                    {k.antwort && (
                      <div className="rounded-lg bg-hbs-blue-soft px-3 py-1.5 text-xs">
                        <b className="text-hbs-blue">Antwort von {e.name}:</b> {k.antwort.text}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-hbs-slate-muted">Du hast nichts geschrieben.</p>
            )}
          </HbsCard>
        </>
      )}

      <HbsCard className="space-y-3">
        <h3 className="text-lg font-black text-hbs-slate-dark">Publikumslieblinge</h3>
        {favorites.length ? (
          <ol className="space-y-2.5">
            {favorites.map((e, idx) => (
              <li key={e.id} className="flex items-center gap-3">
                <span className="text-2xl w-8 text-center">{['🥇', '🥈', '🥉'][idx]}</span>
                <img
                  src={resolvePageImageUrl(e.pages[0])}
                  alt=""
                  className="w-16 h-12 object-contain bg-white rounded border border-hbs-slate-border"
                />
                <div className="min-w-0">
                  <b className="text-sm text-hbs-slate-dark block truncate">{e.titel}</b>
                  <span className="text-xs text-hbs-slate-muted">
                    von {e.name} · ♥ {e.likesCount} · 💬 {e.kommentare.length}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-hbs-slate-muted">Noch hat niemand ein Exponat mit ♥ markiert.</p>
        )}
      </HbsCard>

      <div className="flex flex-wrap gap-3">
        <HbsButton size="lg" variant="action" onClick={onReenter}>
          Noch einmal hineingehen
        </HbsButton>
        {onBackToExhibition && (
          <HbsButton size="lg" variant="secondary" onClick={onBackToExhibition}>
            Zur Ausstellungs-Verwaltung
          </HbsButton>
        )}
      </div>
    </div>
  );
};

const StatTile: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div className="rounded-xl border border-hbs-slate-border bg-hbs-bg p-3 flex flex-col">
    <b className="text-2xl font-black text-hbs-blue leading-tight">{value}</b>
    <span className="text-xs font-semibold text-hbs-slate-muted mt-0.5">{label}</span>
  </div>
);
