import { ref } from 'vue';
import { defineStore } from 'pinia';

/** Hard limits for future Settings UI slider */
export const SCAN_PREVIEW_HEIGHT_MIN_PX = 180;
export const SCAN_PREVIEW_HEIGHT_MAX_PX = 240;

/**
 * Scan screen layout preferences.
 * Today: single default height. Later: persist + let user adjust (e.g. Settings slider calling setPreviewHeightPx).
 */
export const useScanLayoutStore = defineStore('scanLayout', () => {
  const previewHeightPx = ref(200);

  function setPreviewHeightPx(px: number) {
    const n = Math.round(px);
    previewHeightPx.value = Math.min(
      SCAN_PREVIEW_HEIGHT_MAX_PX,
      Math.max(SCAN_PREVIEW_HEIGHT_MIN_PX, n),
    );
  }

  return {
    previewHeightPx,
    setPreviewHeightPx,
  };
});
