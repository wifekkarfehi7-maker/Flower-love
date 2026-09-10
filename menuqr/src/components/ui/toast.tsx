"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastRecord extends ToastOptions {
  id: number;
}

const ToastContext = React.createContext<((options: ToastOptions) => void) | null>(null);

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: "border-success/30 bg-success/[0.06]",
  error: "border-destructive/30 bg-destructive/[0.06]",
  info: "border-border bg-card",
};

const VARIANT_ICONS: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 className="size-5 text-success" />,
  error: <AlertTriangle className="size-5 text-destructive" />,
  info: <Info className="size-5 text-muted-foreground" />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastRecord[]>([]);
  const counter = React.useRef(0);

  const push = React.useCallback((options: ToastOptions) => {
    counter.current += 1;
    const id = counter.current;
    setToasts((current) => [...current.slice(-2), { ...options, id }]);
  }, []);

  const dismiss = React.useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={push}>
      <ToastPrimitive.Provider swipeDirection="right" duration={4500}>
        {children}
        {toasts.map((toast) => (
          <ToastPrimitive.Root
            key={toast.id}
            duration={toast.duration}
            onOpenChange={(open) => {
              if (!open) dismiss(toast.id);
            }}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-pop",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom-2 data-[state=closed]:fade-out-80",
              VARIANT_STYLES[toast.variant ?? "info"]
            )}
          >
            <span aria-hidden className="mt-0.5 shrink-0">
              {VARIANT_ICONS[toast.variant ?? "info"]}
            </span>
            <div className="min-w-0 flex-1">
              <ToastPrimitive.Title className="text-sm font-medium">{toast.title}</ToastPrimitive.Title>
              {toast.description ? (
                <ToastPrimitive.Description className="mt-0.5 text-sm text-muted-foreground">
                  {toast.description}
                </ToastPrimitive.Description>
              ) : null}
            </div>
            <ToastPrimitive.Close
              className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-4" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="pointer-events-none fixed bottom-0 z-[100] flex w-full max-w-[400px] flex-col gap-2 p-4 ltr:right-0 rtl:left-0" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const push = React.useContext(ToastContext);
  if (!push) {
    throw new Error("useToast must be used inside a ToastProvider");
  }
  return push;
}
