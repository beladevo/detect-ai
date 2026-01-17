---
trigger: always_on
---

# UI Design Guide for AI Agents

This document provides guidelines for AI agents working on the AI-Detector project's UI components. Follow these patterns to maintain consistency with the 2027 modern, glossy design system.

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Core UI Components](#core-ui-components)
3. [Design Tokens](#design-tokens)
4. [Animation Patterns](#animation-patterns)
5. [Component Patterns](#component-patterns)
6. [Code Examples](#code-examples)

---

## Design Philosophy

The UI follows a **futuristic glass-morphism** aesthetic with these key principles:

- **Glass-morphism**: Translucent surfaces with backdrop blur
- **Gradient accents**: Purple, cyan, pink color palette
- **Subtle animations**: Smooth, purposeful micro-interactions
- **Dark-first design**: Deep navy/black backgrounds with light text
- **Depth through shadows**: Glowing shadows that suggest light sources

---

## Core UI Components

### 1. GlassCard (`src/components/ui/GlassCard.tsx`)

The foundation for all card-based content. Features:
- Translucent background with gradient
- Glass shine effect (top-left highlight)
- Top edge highlight line
- Hover animations (lift + scale)
- Configurable glow colors

```tsx
import GlassCard from "./ui/GlassCard";

<GlassCard hover={true} glow="purple" className="p-8">
  {/* Content */}
</GlassCard>
```

**Props:**
- `hover`: Enable hover animations (default: true)
- `glow`: "purple" | "cyan" | "pink" | "emerald" | "none"
- `animate`: Enable framer-motion animations (default: true)

### 2. GlowButton (`src/components/ui/GlowButton.tsx`)

Primary action buttons with glow effects:

```tsx
import GlowButton from "./ui/GlowButton";

<GlowButton onClick={handleClick} variant="primary" size="lg">
  <span>Button Text</span>
  <ArrowRight className="h-4 w-4" />
</GlowButton>
```

**Props:**
- `variant`: "primary" | "secondary" | "ghost"
- `size`: "sm" | "md" | "lg"
- `glowColor`: Custom glow color (default: "#8b5cf6")

### 3. AuroraBackground (`src/components/ui/AuroraBackground.tsx`)

Animated background with floating gradient blobs:

```tsx
import AuroraBackground from "./ui/AuroraBackground";

<AuroraBackground className="min-h-screen">
  {/* Page content */}
</AuroraBackground>
```

---

## Design Tokens

### Colors

```css
/* Primary Palette */
--brand-purple: #8b5cf6;
--brand-pink: #ec4899;
--brand-cyan: #06b6d4;
--brand-mint: #7cf9c9;

/* Background */
--background: #030506;
--panel: rgba(13, 17, 23, 0.78);

/* Borders */
--border-subtle: rgba(255, 255, 255, 0.08);
--border-hover: rgba(255, 255, 255, 0.20);
```

### Tailwind Classes for Borders

```tsx
// Subtle border (default state)
className="border border-white/[0.08]"

// Hover border
className="hover:border-white/20"

// Accent border
className="border-purple-500/30"
```

### Gradients

```tsx
// Glass card background
className="bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-transparent"

// Text gradient
className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent"

// Section gradient
className="bg-gradient-to-br from-white/[0.05] via-white/[0.05] to-purple-500/10"
```

### Shadows

```tsx
// Purple glow
className="shadow-[0_0_40px_rgba(139,92,246,0.25)]"

// Hover glow
className="hover:shadow-[0_0_60px_rgba(139,92,246,0.15)]"

// Large card shadow
className="shadow-2xl"
```

---

## Animation Patterns

### Framer Motion Variants

Use these patterns for consistent animations:

```tsx
// Container with staggered children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

// Child items
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const, // Important: use 'as const'
    },
  },
};
```

### Hover Animations

```tsx
// Card hover lift
<motion.div
  whileHover={{ y: -4, scale: 1.01 }}
  transition={{ type: "spring", stiffness: 300, damping: 20 }}
>

// Button hover
<motion.button
  whileHover={{ scale: 1.02, y: -2 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
>
```

### Scroll Animations

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.6 }}
>
```

### Continuous Animations

```tsx
// Floating animation
<motion.div
  animate={{ y: [0, -8, 0] }}
  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
>

// Pulsing glow
<motion.div
  animate={{
    scale: [1, 1.2, 1],
    opacity: [0.4, 0.6, 0.4],
  }}
  transition={{
    duration: 4,
    repeat: Infinity,
    repeatType: "reverse",
  }}
/>
```

---

## Component Patterns

### Section Structure

Every section should follow this pattern:

```tsx
<section id="section-id" className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6">
  <GlassCard hover={false} glow="purple" className="p-8 sm:p-10">
    {/* Header */}
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
      {/* Badge */}
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 px-4 py-2 backdrop-blur-sm">
        <Icon className="h-4 w-4 text-purple-400" />
        <span className="text-xs font-medium uppercase tracking-[0.25em] text-gray-300">
          Section Label
        </span>
      </div>

      {/* Title */}
      <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
        <span className="text-white">Regular text </span>
        <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
          Gradient text
        </span>
      </h2>

      {/* Description */}
      <p className="mt-4 max-w-2xl text-gray-400">
        Description text here.
      </p>
    </motion.div>

    {/* Content */}
    {/* ... */}
  </GlassCard>
</section>
```

### Badge Pattern

```tsx
<div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 px-4 py-2 backdrop-blur-sm">
  <div className="relative">
    <div className="absolute inset-0 animate-ping rounded-full bg-purple-400/40" />
    <Icon className="relative h-4 w-4 text-purple-400" />
  </div>
  <span className="text-xs font-medium uppercase tracking-[0.25em] text-gray-300">
    Badge Text
  </span>
</div>
```

### Feature Card Pattern

```tsx
<motion.div
  className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-purple-500/20 to-violet-500/10 p-6 backdrop-blur-sm transition-all duration-500 hover:border-white/20 hover:shadow-[0_0_40px_rgba(139,92,246,0.1)]"
  whileHover={{ y: -4, scale: 1.01 }}
  transition={{ type: "spring", stiffness: 300, damping: 20 }}
>
  {/* Glass shine effect */}
  <div
    className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
    style={{
      background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)",
    }}
  />

  {/* Icon */}
  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-all duration-300 group-hover:scale-110">
    <Icon className="h-5 w-5 text-purple-400" />
  </div>

  {/* Content */}
  <h3 className="font-semibold text-white">Title</h3>
  <p className="mt-2 text-xs text-gray-400">Description</p>
</motion.div>
```

### Input Pattern

```tsx
<input
  type="email"
  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder:text-gray-500 transition-all duration-300 focus:border-purple-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
  placeholder="Placeholder text"
/>
```

---

## Code Examples

### Creating a New Section

```tsx
"use client";

import { motion } from "framer-motion";
import { IconName } from "lucide-react";
import GlassCard from "./ui/GlassCard";

export default function NewSection() {
  return (
    <section
      id="new-section"
      className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6"
    >
      <GlassCard hover={false} glow="purple" className="p-8 sm:p-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Section content */}
        </motion.div>
      </GlassCard>
    </section>
  );
}
```

### Adding to AIDetectorPage

1. Import the component:
```tsx
import NewSection from "@/src/components/NewSection";
```

2. Add it to the JSX (usually between PrivacySection and Footer):
```tsx
<PrivacySection />
<NewSection />
<FAQSection />
```

---

## Important Notes

### TypeScript with Framer Motion

When using cubic-bezier easing arrays, always add `as const`:

```tsx
// CORRECT
ease: [0.25, 0.46, 0.45, 0.94] as const

// WRONG - will cause TypeScript error
ease: [0.25, 0.46, 0.45, 0.94]
```

### Lucide Icons

Some icons are deprecated. Use current versions:
- ~~`Github`~~ → use custom SVG or different icon
- ~~`Twitter`~~ → use custom SVG or different icon

### Responsive Design

Always include responsive padding:
```tsx
className="px-4 sm:px-6"
className="p-8 sm:p-10"
className="text-3xl sm:text-4xl lg:text-5xl"
```

### Accessibility

- Add `aria-label` to icon-only buttons
- Use semantic HTML (`section`, `nav`, `main`)
- Ensure color contrast meets WCAG standards
- Add `viewport={{ once: true }}` to scroll animations

---

## File Structure

```
src/components/
├── ui/
│   ├── GlassCard.tsx      # Base card component
│   ├── GlowButton.tsx     # Button with glow effects
│   └── AuroraBackground.tsx # Animated background
├── Navbar.tsx
├── HeroSection.tsx
├── FeaturesSection.tsx
├── WaitlistSection.tsx
├── UploadZone.tsx
├── ResultsDisplay.tsx
├── PrivacySection.tsx
├── FAQSection.tsx
├── Footer.tsx
└── AIDetectorPage.tsx     # Main page orchestrator
```

---

## Quick Reference

| Element | Class Pattern |
|---------|--------------|
| Glass background | `bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-transparent backdrop-blur-xl` |
| Subtle border | `border border-white/[0.08]` |
| Rounded large | `rounded-3xl` |
| Rounded medium | `rounded-2xl` |
| Text gradient | `bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent` |
| Glow shadow | `shadow-[0_0_40px_rgba(139,92,246,0.25)]` |
| Badge | `rounded-full border border-white/10 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 px-4 py-2` |
| Section wrapper | `mx-auto w-full max-w-6xl px-4 sm:px-6` |

---

*Last updated: January 2026*
*Design system version: 2.0 (2027 Modern Glossy)*
