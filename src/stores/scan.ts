import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import type { OcrResult } from '@/composables/useOcr';

export type ScanStatus = 'idle' | 'camera' | 'captured' | 'selecting' | 'recognizing' | 'done' | 'error';

export interface RectPercent {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const useScanStore = defineStore('scan', () => {
  const status = ref<ScanStatus>('idle');
  const capturedImage = ref<string | null>(null);
  const aimingFrameRect = ref<RectPercent | null>(null);
  const ocrResult = ref<OcrResult | null>(null);
  const errorMessage = ref<string | null>(null);

  const recognizedPrice = computed(() => ocrResult.value?.price ?? null);
  const recognizedPrices = computed(() => ocrResult.value?.prices ?? []);
  const rawOcrText = computed(() => ocrResult.value?.text ?? '');

  function setStatus(s: ScanStatus) {
    status.value = s;
  }

  function setCapturedImage(dataUrl: string | null) {
    capturedImage.value = dataUrl;
  }

  function setAimingFrameRect(rect: RectPercent | null) {
    aimingFrameRect.value = rect;
  }

  function enterSelectionMode() {
    status.value = 'selecting';
  }

  function exitSelectionMode() {
    status.value = 'captured';
  }

  function setOcrResult(result: OcrResult | null) {
    ocrResult.value = result;
  }

  function setError(msg: string | null) {
    errorMessage.value = msg;
  }

  function reset() {
    status.value = 'idle';
    capturedImage.value = null;
    ocrResult.value = null;
    errorMessage.value = null;
  }

  function retake() {
    if (capturedImage.value?.startsWith('blob:')) {
      URL.revokeObjectURL(capturedImage.value);
    }
    capturedImage.value = null;
    aimingFrameRect.value = null;
    ocrResult.value = null;
    errorMessage.value = null;
    status.value = 'camera';
  }

  return {
    status,
    capturedImage,
    aimingFrameRect,
    ocrResult,
    errorMessage,
    recognizedPrice,
    recognizedPrices,
    rawOcrText,
    setStatus,
    setCapturedImage,
    setAimingFrameRect,
    enterSelectionMode,
    exitSelectionMode,
    setOcrResult,
    setError,
    reset,
    retake,
  };
});
