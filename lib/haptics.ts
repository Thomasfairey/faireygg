import { useSettingsStore } from "./store/settingsStore";

function vibrate(pattern: number | number[]) {
  if (typeof navigator === "undefined") return;
  if (!useSettingsStore.getState().hapticsEnabled) return;
  navigator.vibrate?.(pattern);
}

export const haptic = {
  light: () => vibrate(10),
  medium: () => vibrate(25),
  heavy: () => vibrate(50),
  error: () => vibrate([50, 30, 50]),
  success: () => vibrate([10, 30, 10]),
  countdown: () => vibrate(15),
  rankUp: () => vibrate([30, 50, 30, 50, 80]),
};
