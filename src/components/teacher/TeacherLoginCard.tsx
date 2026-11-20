import React, { useEffect, useState } from 'react';
import { KeyRound, Lock, UserCheck } from 'lucide-react';
import { PortalUser } from '../../types/museum';
import { loadPortalTeachers, MASTER_ADMIN_PIN, SEED_TEACHERS } from '../../services/firebase';
import { HbsButton, HbsCard } from '../hbs/HbsKit';

interface TeacherLoginCardProps {
  onLoginSuccess: (user: PortalUser) => void;
  onCancel?: () => void;
}

export const TeacherLoginCard: React.FC<TeacherLoginCardProps> = ({ onLoginSuccess, onCancel }) => {
  const [teachers, setTeachers] = useState<PortalUser[]>(SEED_TEACHERS);
  const [selectedId, setSelectedId] = useState(SEED_TEACHERS[0]?.id || '');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPortalTeachers()
      .then((list) => {
        if (list.length) {
          setTeachers(list);
          setSelectedId((prev) => (list.some((t) => t.id === prev) ? prev : list[0].id));
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanPin = pin.trim();
    if (!cleanPin) {
      setError('Bitte gib deine Lehrkraft-PIN ein.');
      return;
    }

    if (cleanPin === MASTER_ADMIN_PIN) {
      onLoginSuccess({
        id: 'master-admin',
        name: 'Schul-Admin',
        pin: MASTER_ADMIN_PIN,
        role: 'admin',
        active: true,
      });
      return;
    }

    const chosen = teachers.find((t) => t.id === selectedId);
    if (!chosen) {
      setError('Bitte wähle deinen Namen aus.');
      return;
    }

    if (String(chosen.pin).trim() !== cleanPin) {
      setError('Diese PIN stimmt nicht. Nutze deine HBS-Portal-PIN.');
      return;
    }

    onLoginSuccess(chosen);
  };

  return (
    <div className="w-full max-w-md mx-auto px-3 py-10">
      <HbsCard className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-hbs-blue-light text-hbs-blue flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-hbs-slate-dark">Kollegiums-Anmeldung</h2>
            <p className="text-xs text-hbs-slate-muted">Melde dich mit deinem HBS-Appportal-Konto an.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-hbs-slate-dark mb-1">Lehrkraft</label>
            {loading ? (
              <div className="h-11 rounded-xl bg-slate-100 animate-pulse" />
            ) : (
              <div className="relative">
                <UserCheck className="w-4 h-4 text-hbs-slate-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full h-11 pl-9 pr-3 rounded-xl border border-hbs-slate-border bg-white text-sm font-semibold text-hbs-slate-dark"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-hbs-slate-dark mb-1">PIN</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-hbs-slate-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Deine 4-stellige HBS-PIN"
                className="w-full h-11 pl-9 pr-3 rounded-xl border border-hbs-slate-border bg-white text-sm"
              />
            </div>
          </div>

          {error && <p className="text-sm font-bold text-rose-600">{error}</p>}

          <div className="flex flex-wrap gap-2 pt-1">
            <HbsButton type="submit" size="lg" className="flex-1">
              Anmelden
            </HbsButton>
            {onCancel && (
              <HbsButton type="button" size="lg" variant="secondary" onClick={onCancel}>
                Zurück
              </HbsButton>
            )}
          </div>
        </form>
      </HbsCard>
    </div>
  );
};
