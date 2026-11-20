import React, { useEffect } from 'react';
import { ArrowLeft, Sparkles, X } from 'lucide-react';

interface HbsHeaderProps {
  appTitle: string;
  badgeLabel?: string;
  portalUrl?: string;
  userBadge?: React.ReactNode;
  rightActions?: React.ReactNode;
}

export const HbsHeader: React.FC<HbsHeaderProps> = ({
  appTitle,
  badgeLabel = 'Schul-App',
  portalUrl = 'https://appportalhbs.vercel.app',
  userBadge,
  rightActions,
}) => {
  return (
    <header className="bg-white/95 border-b border-hbs-slate-border/70 sticky top-0 z-40 backdrop-blur-md w-full print:hidden">
      <div className="w-full max-w-[2100px] mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-hbs-blue-soft p-1 sm:p-1.5 flex items-center justify-center border border-hbs-blue/20 shadow-xs shrink-0 bg-white">
            <img src="/Siegel_bunt.png" alt="Heimbürgeschule Kahla Siegel" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-hbs-blue truncate">
                Heimbürgeschule Kahla
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-hbs-teal bg-hbs-teal-light px-2 py-0.5 rounded-full border border-hbs-teal/20">
                <Sparkles className="w-3 h-3" /> {badgeLabel}
              </span>
            </div>
            <h1 className="text-sm sm:text-lg font-black text-hbs-slate-dark tracking-tight truncate">
              {appTitle}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {userBadge}
          {rightActions}
          <a
            href={portalUrl}
            className="inline-flex items-center gap-1.5 h-11 px-3 text-xs sm:text-sm font-bold text-hbs-slate hover:text-hbs-blue hover:bg-hbs-blue-light/50 rounded-xl transition-all border border-transparent hover:border-hbs-blue/20 active:scale-95"
            title="Zurück zum App-Portal"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden md:inline">Zum Portal</span>
          </a>
        </div>
      </div>
    </header>
  );
};

interface HbsButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'action' | 'secondary' | 'ghost' | 'danger';
  size?: 'md' | 'lg';
}

export const HbsButton: React.FC<HbsButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-150 select-none cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none';
  const sizes = size === 'lg' ? 'h-12 px-6 text-base gap-2.5' : 'h-11 px-4 sm:px-5 text-sm gap-2';

  const variants = {
    primary: 'bg-hbs-blue hover:bg-hbs-blue-deep text-white shadow-sm hover:shadow-hbs-hover shadow-hbs-blue/20',
    action: 'bg-hbs-amber hover:bg-hbs-amber-dark text-white shadow-sm hover:shadow-hbs-hover shadow-hbs-amber/20',
    secondary: 'bg-white hover:bg-hbs-blue-soft text-hbs-slate border border-hbs-slate-border hover:border-hbs-blue/30 shadow-xs',
    ghost: 'bg-transparent hover:bg-hbs-blue-soft text-hbs-slate hover:text-hbs-blue',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm',
  };

  return (
    <button type="button" className={`${base} ${sizes} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const HbsCard: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-hbs-slate-border/80 shadow-hbs-card transition-all duration-200 p-5 sm:p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

interface HbsBadgeProps {
  label: string;
  variant?: 'blue' | 'teal' | 'amber' | 'neutral';
}

export const HbsBadge: React.FC<HbsBadgeProps> = ({ label, variant = 'blue' }) => {
  const styles = {
    blue: 'bg-hbs-blue-light text-hbs-blue border-hbs-blue/20',
    teal: 'bg-hbs-teal-light text-hbs-teal border-hbs-teal/20',
    amber: 'bg-hbs-amber-light text-hbs-amber-dark border-hbs-amber/25',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border tracking-tight ${styles[variant]}`}>
      {label}
    </span>
  );
};

interface HbsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const HbsModal: React.FC<HbsModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-hbs-slate-dark/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-hbs-modal max-w-2xl w-full max-h-[92vh] sm:max-h-[85vh] flex flex-col overflow-hidden border border-hbs-slate-border">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h2 className="text-base sm:text-lg font-black text-hbs-slate-dark">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Dialog schließen"
            className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">{children}</div>
        {footer && (
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-2 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
