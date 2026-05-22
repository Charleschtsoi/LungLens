"use client";

import { useReducedMotion } from "framer-motion";
import type { Transition, Variants } from "framer-motion";

export const EASE_OUT = "easeOut" as const;

export const VIEWPORT_ONCE = { once: true, margin: "-100px" } as const;

const transition = (duration: number, reduced: boolean): Transition => ({
  duration: reduced ? 0.2 : duration,
  ease: EASE_OUT,
});

/** Shared motion variants (pitch, upload, results, about). Respects prefers-reduced-motion. */
export function useAppMotion() {
  const reduced = useReducedMotion() ?? false;

  const yHero = reduced ? 0 : 30;
  const yFadeIn = reduced ? 0 : 20;
  const yScroll = reduced ? 0 : 40;
  const yStagger = reduced ? 0 : 24;
  const xStep = reduced ? 0 : 12;

  const heroStagger: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduced ? 0 : 0.1,
        delayChildren: reduced ? 0 : 0.05,
      },
    },
  };

  const heroItem: Variants = {
    hidden: { opacity: 0, y: yHero },
    show: {
      opacity: 1,
      y: 0,
      transition: transition(0.8, reduced),
    },
  };

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: yFadeIn },
    show: {
      opacity: 1,
      y: 0,
      transition: transition(0.7, reduced),
    },
  };

  const scrollReveal: Variants = {
    hidden: { opacity: 0, y: yScroll },
    show: {
      opacity: 1,
      y: 0,
      transition: transition(0.7, reduced),
    },
  };

  const staggerContainer: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduced ? 0 : 0.1,
        delayChildren: reduced ? 0 : 0.05,
      },
    },
  };

  const staggerItem: Variants = {
    hidden: { opacity: 0, y: yStagger },
    show: {
      opacity: 1,
      y: 0,
      transition: transition(0.6, reduced),
    },
  };

  const stepTransition: Variants = {
    hidden: { opacity: 0, x: xStep },
    show: {
      opacity: 1,
      x: 0,
      transition: transition(0.45, reduced),
    },
    exit: {
      opacity: 0,
      x: reduced ? 0 : -xStep,
      transition: transition(0.35, reduced),
    },
  };

  const navbarDropIn = {
    initial: { opacity: 0, y: reduced ? 0 : -20 },
    animate: { opacity: 1, y: 0 },
    transition: transition(0.5, reduced),
  };

  const llmDelayedReveal = {
    initial: { opacity: 0, y: reduced ? 0 : 24 },
    animate: { opacity: 1, y: 0 },
    transition: {
      ...transition(0.7, reduced),
      delay: reduced ? 0 : 0.6,
    },
  };

  return {
    reduced,
    heroStagger,
    heroItem,
    fadeInUp,
    scrollReveal,
    staggerContainer,
    staggerItem,
    stepTransition,
    navbarDropIn,
    llmDelayedReveal,
    viewport: VIEWPORT_ONCE,
  };
}
