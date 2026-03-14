// Stable references for Zustand selector fallbacks.
// Using inline `?? []` or `?? {}` in selectors creates a new reference each render,
// which Zustand interprets as a state change, causing infinite re-render loops.
export const EMPTY_ARRAY: never[] = [];
export const EMPTY_OBJECT: Record<string, never> = {};
