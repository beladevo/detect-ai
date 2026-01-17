"use client";

import { useEffect } from "react";
import { logClientEvent } from "@/src/lib/loggerClient";

const formatAdditional = (value: unknown) => {
  try {
    return JSON.stringify(value, (key, val) => {
      if (val instanceof Error) {
        return {
          name: val.name,
          message: val.message,
          stack: val.stack,
        };
      }
      return val;
    });
  } catch {
    return "";
  }
};

export default function ClientLogger() {
  useEffect(() => {
    let isLogging = false;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    const logConsoleError = (args: unknown[]) => {
      if (isLogging) return;
      isLogging = true;
      void logClientEvent({
        level: "Error",
        source: "UI",
        service: "Console",
        message: "console.error",
        additional: formatAdditional({ args }),
      }).finally(() => {
        isLogging = false;
      });
    };

    console.error = (...args) => {
      originalConsoleError(...args);
      logConsoleError(args);
    };

    console.warn = (...args) => {
      originalConsoleWarn(...args);
      if (isLogging) return;
      isLogging = true;
      void logClientEvent({
        level: "Warn",
        source: "UI",
        service: "Console",
        message: "console.warn",
        additional: formatAdditional({ args }),
      }).finally(() => {
        isLogging = false;
      });
    };

    const onError = (event: ErrorEvent) => {
      void logClientEvent({
        level: "Error",
        source: "UI",
        service: "Window",
        message: event.message || "Unhandled error",
        additional: formatAdditional({
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack,
        }),
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason instanceof Error
        ? { message: event.reason.message, stack: event.reason.stack }
        : event.reason;
      void logClientEvent({
        level: "Error",
        source: "UI",
        service: "Promise",
        message: "Unhandled promise rejection",
        additional: formatAdditional({ reason }),
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
