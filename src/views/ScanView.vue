<script setup lang="ts">
import { ref } from 'vue';
import CameraPreview from '@/components/CameraPreview.vue';
import PhotoPreview from '@/components/PhotoPreview.vue';
import PriceDisplay from '@/components/PriceDisplay.vue';
import { useScanStore } from '@/stores/scan';
import { recognizePrice } from '@/composables/useOcr';
import { cropImageToBlob } from '@/utils/cropImage';

const scanStore = useScanStore();
const cameraRef = ref<InstanceType<typeof CameraPreview> | null>(null);
const photoPreviewRef = ref<InstanceType<typeof PhotoPreview> | null>(null);

/** Aiming frame: 75% width × 30% height, centered (matches camera overlay) */
const AIMING_FRAME_RECT = { x: 12.5, y: 35, width: 75, height: 30 };

async function runOcr(blob: Blob) {
  scanStore.setStatus('recognizing');
  scanStore.setError(null);
  try {
    const result = await recognizePrice(blob);
    scanStore.setOcrResult(result);
    scanStore.setStatus('done');
  } catch (e) {
    scanStore.setError(e instanceof Error ? e.message : 'Recognition failed');
    scanStore.setStatus('error');
  }
}

/** Camera mode: tap SCAN PRICE → capture → crop to aiming frame → run OCR on crop */
async function handleCaptureAndOcr() {
  const camera = cameraRef.value;
  if (!camera) return;
  try {
    const blob = await camera.capture();
    const dataUrl = URL.createObjectURL(blob);
    scanStore.setCapturedImage(dataUrl);
    scanStore.setAimingFrameRect(AIMING_FRAME_RECT);
    scanStore.setStatus('recognizing');
    scanStore.setError(null);
    const croppedBlob = await cropImageToBlob(dataUrl, AIMING_FRAME_RECT);
    await runOcr(croppedBlob);
  } catch (e) {
    scanStore.setError(e instanceof Error ? e.message : 'Capture or recognition failed');
    scanStore.setStatus('error');
  }
}

async function handleConfirmSelection(rect: {
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  const imageSrc = scanStore.capturedImage;
  if (!imageSrc) return;
  try {
    scanStore.exitSelectionMode();
    scanStore.setAimingFrameRect(rect);
    const croppedBlob = await cropImageToBlob(imageSrc, rect);
    await runOcr(croppedBlob);
  } catch (e) {
    scanStore.setError(e instanceof Error ? e.message : 'Crop failed');
    scanStore.setStatus('error');
  }
}

function handleRetake() {
  scanStore.retake();
}
</script>

<template>
  <div class="scan-view">
    <!-- Camera preview: 75% height, fixed at top -->
    <template v-if="['idle', 'camera'].includes(scanStore.status)">
      <div class="preview-section preview-section--camera">
        <CameraPreview ref="cameraRef" />
      </div>
    </template>

    <!-- After capture: preview on top + result below -->
    <template
      v-else-if="
        ['captured', 'selecting', 'recognizing', 'done'].includes(
          scanStore.status,
        )
      "
    >
      <div class="preview-section preview-section--photo">
        <PhotoPreview
          ref="photoPreviewRef"
          @confirm-selection="handleConfirmSelection"
          @retake="handleRetake"
          @select-area="scanStore.enterSelectionMode()"
        />
      </div>
      <div class="result-panel">
        <PriceDisplay />
      </div>
    </template>

    <!-- Error state -->
    <div
      v-else-if="scanStore.status === 'error'"
      class="error-panel"
    >
      <p>{{ scanStore.errorMessage }}</p>
    </div>

    <!-- Fixed action bar: above footer -->
    <div class="action-bar">
      <template v-if="['idle', 'camera'].includes(scanStore.status)">
        <button
          class="btn btn-scan"
          :disabled="scanStore.status === 'idle'"
          @click="handleCaptureAndOcr"
        >
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          </svg>
          SCAN PRICE
        </button>
      </template>
      <template v-else-if="scanStore.status === 'recognizing'">
        <span class="action-bar-label">Recognizing...</span>
      </template>
      <template v-else-if="['captured', 'done'].includes(scanStore.status)">
        <button class="btn btn-outline" @click="handleRetake">
          Retake
        </button>
        <button class="btn btn-scan" @click="scanStore.enterSelectionMode()">
          Select Area
        </button>
      </template>
      <template v-else-if="scanStore.status === 'selecting'">
        <button class="btn btn-outline" @click="handleRetake">
          Retake
        </button>
        <button class="btn btn-outline" @click="photoPreviewRef?.resetSelection?.()">
          Reset
        </button>
        <button class="btn btn-scan" @click="photoPreviewRef?.confirmSelection?.()">
          Confirm
        </button>
      </template>
      <template v-else-if="scanStore.status === 'error'">
        <button class="btn btn-scan" @click="handleRetake">
          Retry
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.scan-view {
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--bg-dark);
  display: flex;
  flex-direction: column;
  padding-bottom: calc(112px + env(safe-area-inset-bottom, 0px));
}

/* Preview/capture area: fixed at top, same size */
.preview-section {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: max(37.5vh, 210px);
  overflow: hidden;
  background: #000;
  z-index: 10;
}

/* Spacer below preview so content is not hidden */
.result-panel {
  flex: 1;
  margin-top: max(37.5vh, 210px);
  overflow-y: auto;
  padding: 0 1.5rem 1.5rem;
  min-height: 0;
}

/* Fixed action bar: above BottomNav */
.action-bar {
  position: fixed;
  bottom: calc(40px + env(safe-area-inset-bottom, 0px));
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  background: var(--bg-dark);
  z-index: 50;
}

.action-bar .btn {
  flex: 1;
  max-width: 200px;
  padding: 0.875rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: opacity 0.2s, background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.action-bar .btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-bar .btn-scan {
  background: var(--accent-gold);
  color: #fff;
}

.action-bar .btn-scan:hover:not(:disabled) {
  background: var(--accent-gold-hover);
}

.action-bar .btn-outline {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.action-bar .btn-outline:hover {
  opacity: 0.9;
}

.action-bar .btn-icon {
  width: 20px;
  height: 20px;
}

.action-bar-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
}

.error-panel {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #fff;
  text-align: center;
  gap: 1.5rem;
}

.error-panel .btn-scan {
  max-width: 200px;
}
</style>
