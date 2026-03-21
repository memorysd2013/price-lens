import type { RectPercent } from '@/stores/scan';

/** Default aiming frame size as % of preview image (width × height). */
export const DEFAULT_AIMING_FRAME_WIDTH_PERCENT = 75;
export const DEFAULT_AIMING_FRAME_HEIGHT_PERCENT = 45;

/**
 * Default OCR / aiming frame in % of the preview image (same coords as cropImageToBlob).
 * Call with current preview container size so logic can evolve when height is user-adjustable
 * or aspect ratio changes.
 */
export function getDefaultAimingFrameRect(
  containerWidth: number,
  containerHeight: number,
): RectPercent {
  const w = DEFAULT_AIMING_FRAME_WIDTH_PERCENT;
  const h = DEFAULT_AIMING_FRAME_HEIGHT_PERCENT;
  const x = (100 - w) / 2;
  const aspect = containerWidth / Math.max(containerHeight, 1);
  let y = (100 - h) / 2;
  // Nudge slightly when preview strip is very wide or narrow; keep frame inside image bounds
  if (aspect > 2.2) {
    y = Math.min(100 - h - 2, y + 2);
  } else if (aspect < 1.8) {
    y = Math.max(2, y - 2);
  }
  return { x, y, width: w, height: h };
}
