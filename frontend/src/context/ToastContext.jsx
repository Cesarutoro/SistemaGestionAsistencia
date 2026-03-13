import React, { createContext, useContext, useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const toastStyles = {
  success: {
    bg: "#ecfdf5",
    border: "#6ee7b7",
    color: "#065f46",
    icon: CheckCircle2,
  },
  error: {
    bg: "#fef2f2",
    border: "#fca5a5",
    color: "#991b1b",
    icon: AlertTriangle,
  },
  info: { bg: "#eff6ff", border: "#93c5fd", color: "#1e3a8a", icon: Info },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const pushToast = ({ type = "info", message, duration = 3000 }) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => removeToast(id), duration);
  };

  const value = useMemo(
    () => ({
      success: (message, duration) =>
        pushToast({ type: "success", message, duration }),
      error: (message, duration) =>
        pushToast({ type: "error", message, duration }),
      info: (message, duration) =>
        pushToast({ type: "info", message, duration }),
      removeToast,
    }),
    [],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 2000,
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          width: "min(380px, calc(100vw - 2rem))",
        }}
      >
        {toasts.map((toast) => {
          const style = toastStyles[toast.type] || toastStyles.info;
          const Icon = style.icon;
          return (
            <div
              key={toast.id}
              data-testid="toast-item"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem",
                padding: "0.75rem 0.9rem",
                borderRadius: 10,
                border: `1px solid ${style.border}`,
                background: style.bg,
                color: style.color,
                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <Icon size={16} />
                <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                  {toast.message}
                </span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: style.color,
                  cursor: "pointer",
                  padding: 0,
                }}
                aria-label="Cerrar toast"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe usarse dentro de ToastProvider");
  }
  return context;
};
