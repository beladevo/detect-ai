"use client";

import { useEffect } from "react";

const HOTJAR_VERSION = 6;

export default function HotjarProvider() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    const siteId = process.env.NEXT_PUBLIC_HOTJAR_SITE_ID;
    if (!siteId) return;

    const initHotjar = async () => {
      const { default: Hotjar } = await import("@hotjar/browser");
      Hotjar.init(Number(siteId), HOTJAR_VERSION);
    };

    const idleCallback = (
      window as Window & { requestIdleCallback?: (callback: () => void) => number }
    ).requestIdleCallback;
    if (idleCallback) {
      const idleId = idleCallback(() => {
        void initHotjar();
      });
      return () => {
        const cancelIdleCallback = (
          window as Window & { cancelIdleCallback?: (id: number) => void }
        ).cancelIdleCallback;
        if (cancelIdleCallback) {
          cancelIdleCallback(idleId);
        }
      };
    }

    const timeoutId = window.setTimeout(() => {
      void initHotjar();
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, []);

  return null;
}
