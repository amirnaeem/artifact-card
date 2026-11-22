/** Phone orientation for the GL card. Baseline is frozen so held tilt sticks. */

export type TiltSample = { x: number; y: number }; // -1..1 yaw/pitch from resting pose

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function wantsDeviceTilt(): boolean {
  if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) return false;
  const DOE = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
  return navigator.maxTouchPoints > 0
    || window.matchMedia("(pointer: coarse)").matches
    || typeof DOE.requestPermission === "function";
}

export function needsMotionPermission(): boolean {
  if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) return false;
  return typeof (window.DeviceOrientationEvent as unknown as { requestPermission?: unknown }).requestPermission === "function";
}

export async function requestMotionPermission(): Promise<"granted" | "denied" | "insecure"> {
  if (typeof window === "undefined") return "denied";
  if (!window.isSecureContext) return "insecure";
  const DOE = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
  if (typeof DOE.requestPermission !== "function") return "granted";
  try {
    return (await DOE.requestPermission()) === "granted" ? "granted" : "denied";
  } catch {
    return "denied";
  }
}

/** Listen for orientation; freeze baseline on first valid sample (or after resetBaseline). */
export function attachDeviceTilt(onSample: (t: TiltSample) => void): {
  stop: () => void;
  resetBaseline: () => void;
} {
  let base: { b: number; g: number } | null = null;
  const onOrient = (e: DeviceOrientationEvent) => {
    if (e.gamma == null || e.beta == null) return;
    if (!base) base = { b: e.beta, g: e.gamma };
    onSample({
      x: clamp((e.gamma - base.g) / 40, -1, 1),
      y: clamp((e.beta - base.b) / 40, -1, 1),
    });
  };
  window.addEventListener("deviceorientation", onOrient);
  return {
    stop: () => window.removeEventListener("deviceorientation", onOrient),
    resetBaseline: () => { base = null; },
  };
}
