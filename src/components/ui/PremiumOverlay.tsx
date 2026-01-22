"use client";

import React from "react";
import { cn } from "@/src/lib/utils";
import { PremiumBadge } from "@/src/components/ui/PremiumBadge";

type PremiumOverlayProps = {
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  badgeClassName?: string;
  contentClassName?: string;
};

export default function PremiumOverlay({
  children,
  className,
  overlayClassName,
  badgeClassName,
  contentClassName,
}: PremiumOverlayProps) {
  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "absolute inset-0 z-10 cursor-not-allowed rounded-2xl bg-foreground/5 backdrop-blur-[1px]",
          overlayClassName
        )}
      />
      <div className={cn("pointer-events-none absolute right-3 top-3 z-20", badgeClassName)}>
        <PremiumBadge size="sm" />
      </div>
      <div
        className={cn(
          "relative z-0 select-none opacity-60 blur-[2px] pointer-events-none",
          contentClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
