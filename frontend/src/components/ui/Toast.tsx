import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

// Toast types
type ToastVariant = "default" | "success" | "error" | "warning";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, variant?: ToastVariant, duration?: number) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Generate unique ID
function generateId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Toast Provider
interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, variant: ToastVariant = "default", duration: number = 4000) => {
    const id = generateId();
    const newToast: Toast = { id, message, variant, duration };
    
    setToasts((current) => [...current, newToast]);

    // Auto dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};

// Hook to use toast
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

// Toast Container Component
interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

// Individual Toast Item
interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const variantStyles: Record<ToastVariant, { bg: string; border: string; icon: string }> = {
  default: {
    bg: "bg-white/10",
    border: "border-white/20",
    icon: "ℹ️",
  },
  success: {
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    icon: "✓",
  },
  error: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: "✗",
  },
  warning: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    icon: "⚠",
  },
};

const variantTextColors: Record<ToastVariant, string> = {
  default: "text-white",
  success: "text-green-400",
  error: "text-red-400",
  warning: "text-yellow-400",
};

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const styles = variantStyles[toast.variant];
  const textColor = variantTextColors[toast.variant];

  return (
    <div
      className={`
        ${styles.bg} ${styles.border} ${textColor}
        border rounded-lg p-4 pr-10 shadow-lg backdrop-blur-xl
        animate-in slide-in-from-right-full duration-300
        relative
      `}
      style={{ fontFamily: "var(--bt-font-body)" }}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg">{styles.icon}</span>
        <p className="text-sm">{toast.message}</p>
      </div>
      
      <button
        onClick={() => onDismiss(toast.id)}
        className="absolute top-2 right-2 p-1 text-white/50 hover:text-white transition-colors"
        aria-label="Fermer"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default ToastProvider;
