/**
 * A live invite scene is a sticky card: the next scene slides up over it while it shrinks and dims
 * (GSAP drives the shrink via [data-dim]). Background comes from --paper on the template root.
 */
export const STACKED_SCENE =
  "sticky top-0 mx-auto flex min-h-[100svh] w-full max-w-md flex-col items-center justify-center overflow-hidden rounded-t-[32px] px-7 py-14 text-center shadow-[0_-24px_48px_-24px_rgba(90,60,10,0.45)] [background:var(--paper)] will-change-transform";
