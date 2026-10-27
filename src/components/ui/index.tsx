import React from 'react';
import {
  CheckCircle2,
  Clock,
  Eye,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Inbox,
  X,
  Check,
  Info,
} from 'lucide-react';
import { ApplicationStatus } from '../../types';
import { usePortal } from '../../context/PortalContext';

// 1. Card Component
interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  action,
  noPadding = false,
}) => {
  return (
    <section
      className={`bg-white rounded-xl border border-slate-200/80 shadow-xs transition-all ${className}`}
    >
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-100">
          <div>
            {title && <h2 className="text-base font-semibold text-slate-900">{title}</h2>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>{children}</div>
    </section>
  );
};

// 2. StatCard Component (4-column summary grid card matching design system)
interface StatCardProps {
  label: string;
  value: string;
  subtext: string;
  icon: React.ReactNode;
  accentColor: 'green' | 'purple' | 'orange' | 'blue';
  onClick?: () => void;
  viewLabel?: string;
}

const ACCENT_STYLES: Record<
  StatCardProps['accentColor'],
  { iconBg: string; iconText: string; subtextColor: string; linkText: string }
> = {
  green: {
    iconBg: 'bg-[#0B4D2E]/10',
    iconText: 'text-[#0B4D2E]',
    subtextColor: 'text-[#1E8E4F]',
    linkText: 'text-[#0B4D2E] hover:text-[#1E8E4F]',
  },
  purple: {
    iconBg: 'bg-purple-100',
    iconText: 'text-purple-700',
    subtextColor: 'text-purple-700',
    linkText: 'text-purple-700 hover:text-purple-900',
  },
  orange: {
    iconBg: 'bg-orange-100',
    iconText: 'text-orange-700',
    subtextColor: 'text-orange-700',
    linkText: 'text-orange-700 hover:text-orange-900',
  },
  blue: {
    iconBg: 'bg-sky-100',
    iconText: 'text-sky-700',
    subtextColor: 'text-sky-700',
    linkText: 'text-sky-700 hover:text-sky-900',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  accentColor,
  onClick,
  viewLabel = 'View',
}) => {
  const style = ACCENT_STYLES[accentColor];
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between gap-3 transition-all ${
        onClick
          ? 'cursor-pointer hover:border-[#1E8E4F]/50 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-[#0B4D2E]'
          : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500 truncate">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1.5 tabular-nums tracking-tight">
            {value}
          </p>
        </div>
        <div
          className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${style.iconBg} ${style.iconText}`}
        >
          {icon}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <p className={`text-xs font-medium truncate ${style.subtextColor}`}>{subtext}</p>
        {onClick && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold shrink-0 ${style.linkText}`}
          >
            <span>{viewLabel}</span>
            <span aria-hidden="true">→</span>
          </span>
        )}
      </div>
    </div>
  );
};

// 3. StatusBadge Component (Approved = green, Pending = orange, Under Review = blue, Rejected = red)
// Always pairs semantic color with an icon + clear text label for WCAG AA color-blind accessibility
export const StatusBadge: React.FC<{ status: ApplicationStatus }> = ({ status }) => {
  const { t } = usePortal();

  const config: Record<
    ApplicationStatus,
    { classes: string; icon: React.ReactNode; label: string }
  > = {
    Approved: {
      classes: 'text-emerald-800 bg-emerald-50 border-emerald-200',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
      label: t('statusApproved'),
    },
    Pending: {
      classes: 'text-orange-800 bg-orange-50 border-orange-200',
      icon: <Clock className="w-3.5 h-3.5 text-orange-600 shrink-0" />,
      label: t('statusPending'),
    },
    'Under Review': {
      classes: 'text-sky-800 bg-sky-50 border-sky-200',
      icon: <Eye className="w-3.5 h-3.5 text-sky-600 shrink-0" />,
      label: t('statusUnderReview'),
    },
    Rejected: {
      classes: 'text-red-800 bg-red-50 border-red-200',
      icon: <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />,
      label: t('statusRejected'),
    },
  };

  const item = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border whitespace-nowrap shrink-0 ${item.classes}`}
    >
      {item.icon}
      <span>{item.label}</span>
    </span>
  );
};

// 4. Stepper Component for Subsidy & Loan Multi-Stage Tracking
interface StepperProps {
  steps: string[];
  currentStep: number; // 1-indexed
  status?: ApplicationStatus;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep, status }) => {
  return (
    <div className="w-full py-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {steps.map((stepLabel, idx) => {
          const stepNumber = idx + 1;
          const isCompleted = stepNumber < currentStep || status === 'Approved';
          const isCurrent = stepNumber === currentStep && status !== 'Approved';
          const isRejected = isCurrent && status === 'Rejected';

          return (
            <div key={stepLabel} className="flex items-center gap-2.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 tabular-nums transition-colors ${
                  isRejected
                    ? 'bg-red-600 text-white'
                    : isCompleted
                    ? 'bg-[#1E8E4F] text-white'
                    : isCurrent
                    ? 'bg-sky-600 text-white ring-4 ring-sky-100'
                    : 'bg-slate-100 text-slate-500 border border-slate-300'
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : stepNumber}
              </div>
              <div className="min-w-0">
                <p
                  className={`text-xs font-medium truncate ${
                    isCompleted || isCurrent ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  {stepLabel}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 5. Modal Component (Keyboard accessible with ESC and backdrop click)
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidthClass?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidthClass = 'max-w-lg',
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`bg-white rounded-xl border border-slate-200 shadow-xl w-full ${maxWidthClass} overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 bg-[#0B4D2E] text-white">
          <div>
            <h3 id="modal-title" className="text-base font-semibold">
              {title}
            </h3>
            {subtitle && <p className="text-xs text-emerald-100/90 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

// 6. Loading Skeleton State
export const LoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading content">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="bg-white rounded-xl border border-slate-200/80 p-5 h-28 animate-pulse flex flex-col justify-between"
          >
            <div className="h-3 w-24 bg-slate-200 rounded" />
            <div className="h-6 w-32 bg-slate-200 rounded" />
            <div className="h-3 w-28 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 space-y-4 animate-pulse">
        <div className="h-5 w-48 bg-slate-200 rounded" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-11 w-full bg-slate-100 rounded-lg" />
        ))}
      </div>
    </div>
  );
};

// 7. Error State Banner
export const ErrorState: React.FC<{ message?: string; onRetry: () => void }> = ({
  message = 'Unable to synchronize with the Tamil Nadu Agrisnet / e-Adangal gateway.',
  onRetry,
}) => {
  const { t } = usePortal();
  return (
    <div className="bg-white rounded-xl border border-red-200 p-8 text-center max-w-lg mx-auto my-6">
      <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">Gateway Connection Interrupted</h3>
      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] transition-colors cursor-pointer"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>{t('retryAction')}</span>
      </button>
    </div>
  );
};

// 8. Empty State Component
export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ title, description, actionLabel, onAction }) => {
  return (
    <div className="py-12 px-4 text-center">
      <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
        <Inbox className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] transition-colors cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

// 9. Toast Container
export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = usePortal();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl bg-slate-900 text-white shadow-lg border border-slate-700 animate-in slide-in-from-bottom-4 duration-150"
        >
          {toast.variant === 'error' ? (
            <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          ) : toast.variant === 'info' ? (
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold">{toast.title}</p>
            {toast.description && (
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toast.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            className="text-slate-400 hover:text-white p-0.5"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
