"use client";

import * as React from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "error";

interface ToastAction {
  label: string;
  onClick: () => void | Promise<void>;
}

interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: ToastAction;
}

interface ToastMessage extends ToastInput {
  id: string;
}

interface ToastContextValue {
  toast: (input: ToastInput) => string;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = React.useState<ToastMessage[]>([]);
  const timers = React.useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = React.useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setMessages((current) => current.filter((message) => message.id !== id));
  }, []);

  const toast = React.useCallback((input: ToastInput) => {
    const id = crypto.randomUUID();
    const duration = input.duration ?? 5000;

    setMessages((current) => [...current.slice(-2), { ...input, id }]);

    if (duration > 0) {
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    }

    return id;
  }, [dismiss]);

  React.useEffect(() => {
    const activeTimers = timers.current;
    return () => activeTimers.forEach(clearTimeout);
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 bottom-20 z-[100] flex flex-col items-end gap-2 sm:bottom-4 sm:left-auto sm:w-[380px]"
        aria-live="polite"
        aria-atomic="false"
      >
        {messages.map((message) => (
          <ToastCard key={message.id} message={message} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  message,
  onDismiss,
}: {
  message: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  const Icon = message.variant === "error"
    ? CircleAlert
    : message.variant === "success"
      ? CheckCircle2
      : Info;

  return (
    <div
      role={message.variant === "error" ? "alert" : "status"}
      className={cn(
        "pointer-events-auto flex w-full items-start gap-3 rounded-xl border bg-background p-3.5 shadow-lg",
        message.variant === "error" && "border-destructive/30",
        message.variant === "success" && "border-green-600/25"
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0 text-muted-foreground",
          message.variant === "error" && "text-destructive",
          message.variant === "success" && "text-green-600"
        )}
        aria-hidden="true"
      />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-tight">{message.title}</p>
        {message.description && (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {message.description}
          </p>
        )}
      </div>

      {message.action && (
        <button
          type="button"
          className="h-7 shrink-0 rounded-md px-2 text-xs font-semibold text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => {
            void message.action?.onClick();
            onDismiss(message.id);
          }}
        >
          {message.action.label}
        </button>
      )}

      <button
        type="button"
        className="-mr-1 -mt-1 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => onDismiss(message.id)}
        aria-label="Benachrichtigung schließen"
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast muss innerhalb des ToastProvider verwendet werden.");
  }
  return context;
}
