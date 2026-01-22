// Type augmentation for framer-motion compatibility with Next.js 16
declare module 'framer-motion' {
  import * as React from 'react';

  export interface MotionProps {
    initial?: any;
    animate?: any;
    exit?: any;
    whileInView?: any;
    whileHover?: any;
    whileTap?: any;
    whileFocus?: any;
    whileDrag?: any;
    variants?: any;
    transition?: any;
    viewport?: any;
    drag?: any;
    dragConstraints?: any;
    dragElastic?: any;
    dragMomentum?: any;
    layout?: any;
    layoutId?: any;
    onAnimationStart?: any;
    onAnimationComplete?: any;
    [key: string]: any;
  }

  export const motion: {
    [K in keyof JSX.IntrinsicElements]: React.ForwardRefExoticComponent<
      React.PropsWithoutRef<JSX.IntrinsicElements[K] & MotionProps> &
        React.RefAttributes<any>
    >;
  };

  export const AnimatePresence: React.FC<{
    children?: React.ReactNode;
    initial?: boolean;
    mode?: 'sync' | 'popLayout' | 'wait';
    onExitComplete?: () => void;
  }>;

  export const LazyMotion: React.FC<{
    children: React.ReactNode;
    features: any;
    strict?: boolean;
  }>;

  export const LayoutGroup: React.FC<{
    children: React.ReactNode;
    id?: string;
  }>;

  export function useAnimation(): any;
  export function useMotionValue(initial: number): any;
  export function useTransform(value: any, from: number[], to: number[]): any;
  export function useScroll(options?: any): any;
  export function useSpring(value: any, config?: any): any;
  export function useInView(ref: React.RefObject<Element>, options?: any): boolean;
}
