"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { clsx } from "@/lib/cn";

type Tone = "success" | "error" | "info";
interface Toast {
  id: number;
  message: string;
  tone: Tone;
}

interface ToastApi {
  toast: (message: string, tone?: Tone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/** App-wide feedback. One style, auto-dismiss, announced to screen readers. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback((message: string, tone: Tone) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, tone }].slice(-4));
    setTimeout(() => remove(id), 3200);
  }, [remove]);

  const api = useMemo<ToastApi>(
    () => ({
      toast: (m, tone: Tone = "info") => push(m, tone),
      success: (m) => push(m, "success"),
      error: (m) => push(m, "error"),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={remove} />
    </ToastContext.Provider>
  );
}

const TONE_DOT: Record<Tone, string> = {
  success: "bg-green-600",
  error: "bg-p-danger",
  info: "bg-text",
};

function ToastViewport({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6"
    >
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onDismiss(t.id)}
          className={clsx(
            "pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-control border border-border bg-surface px-4 py-3 text-left text-sm text-text shadow-overlay transition-all ease-standard",
          )}
        >
          <span className={clsx("h-2 w-2 shrink-0 rounded-pill", TONE_DOT[t.tone])} />
          <span className="flex-1">{t.message}</span>
        </button>
      ))}
    </div>
  );
}

/** Read the toast API. Safe no-op if used outside the provider. */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (ctx) return ctx;
  // Fallback keeps callers crash-free if rendered without the provider.
  return { toast: () => {}, success: () => {}, error: () => {} };
}
