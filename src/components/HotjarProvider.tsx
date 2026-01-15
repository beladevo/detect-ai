"use client";

import { useEffect } from "react";
import Hotjar from "@hotjar/browser";

const HOTJAR_VERSION = 6;

export default function HotjarProvider() {
  useEffect(() => {
    const siteId = process.env.NEXT_PUBLIC_HOTJAR_SITE_ID;
    if (siteId) {
      Hotjar.init(Number(siteId), HOTJAR_VERSION);
    }
  }, []);

  return null;
}
