<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import CameraPreview from '@/components/CameraPreview.vue';
import PhotoPreview from '@/components/PhotoPreview.vue';
import PriceDisplay from '@/components/PriceDisplay.vue';
import { useScanStore } from '@/stores/scan';
import { useScanLayoutStore } from '@/stores/scanLayout';
import { recognizePrice } from '@/composables/useOcr';
import { cropImageToBlob } from '@/utils/cropImage';
import { getDefaultAimingFrameRect } from '@/utils/scanPreviewAiming';

const scanStore = useScanStore();
const layoutStore = useScanLayoutStore();
const cameraRef = ref<InstanceType<typeof CameraPreview> | null>(null);
const photoPreviewRef = ref<InstanceType<typeof PhotoPreview> | null>(null);

const viewportWidth = ref(
  typeof window !== 'undefined' ? window.innerWidth : 390,
);

function syncViewportWidth() {
  viewportWidth.value = window.innerWidth;
}

onMounted(() => {
  syncViewportWidth();
  window.addEventListener('resize', syncViewportWidth);
});
onUnmounted(() => {
  window.removeEventListener('resize', syncViewportWidth);
});

const scanPreviewStyle = computed(() => ({
  '--scan-preview-height': `${layoutStore.previewHeightPx}px`,
}));

/** Same rect as camera overlay; updates when preview height or width changes */
const currentAimingRect = computed(() =>
  getDefaultAimingFrameRect(viewportWidth.value, layoutStore.previewHeightPx),
);

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
    const rect = { ...currentAimingRect.value };
    scanStore.setAimingFrameRect(rect);
    scanStore.setStatus('recognizing');
    scanStore.setError(null);
    const croppedBlob = await cropImageToBlob(dataUrl, rect);
    await runOcr(croppedBlob);
  } catch (e) {
    scanStore.setError(
      e instanceof Error ? e.message : 'Capture or recognition failed',
    );
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

/** Remount camera preview to request permission again */
function handleRetryCameraPermission() {
  scanStore.setError(null);
  scanStore.setStatus('idle');
}
</script>

<template>
  <div class="scan-view" :style="scanPreviewStyle">
    <!-- Camera preview strip (--scan-preview-height), fixed at top -->
    <template v-if="['idle', 'camera'].includes(scanStore.status)">
      <div class="preview-section preview-section--camera">
        <CameraPreview ref="cameraRef" :aiming-rect="currentAimingRect" />
      </div>
    </template>

    <template v-else-if="scanStore.status === 'no_camera'">
      <div
        class="preview-section preview-section--placeholder"
        role="region"
        aria-label="相機無法使用"
      >
        <div class="camera-permission-placeholder">
          <svg
            class="camera-permission-placeholder__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            aria-hidden="true"
          >
            <path
              d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
            />
            <line x1="1" y1="1" x2="23" y2="23" stroke-linecap="round" />
          </svg>
          <p class="camera-permission-placeholder__title">
            無法使用相機
          </p>
          <p class="camera-permission-placeholder__text">
            {{ scanStore.errorMessage || '請在系統或瀏覽器設定中允許相機權限。' }}
          </p>
        </div>
      </div>
    </template>

    <!-- Photo preview (after capture) -->
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
    </template>

    <div
      v-if="scanStore.status !== 'error'"
      class="result-panel"
    >
      <PriceDisplay />
    </div>
    <div
      v-else
      class="error-panel"
    >
      <p>{{ scanStore.errorMessage }}</p>
    </div>

    <!-- Fixed action bar: above footer -->
    <div class="action-bar">
      <template v-if="scanStore.status === 'no_camera'">
        <button
          type="button"
          class="btn btn-scan"
          @click="handleRetryCameraPermission"
        >
          重試
        </button>
      </template>
      <template v-else-if="['idle', 'camera'].includes(scanStore.status)">
        <button
          class="btn btn-scan"
          :disabled="scanStore.status === 'idle'"
          @click="handleCaptureAndOcr"
        >
          <svg
            class="btn-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="2"
              ry="2"
            />
          </svg>
          SCAN PRICE
        </button>
      </template>
      <template v-else-if="scanStore.status === 'recognizing'">
        <span class="action-bar-label">Recognizing...</span>
      </template>
      <template v-else-if="['captured', 'done'].includes(scanStore.status)">
        <button
          class="btn btn-outline"
          @click="handleRetake"
        >
          Retake
        </button>
        <button
          class="btn btn-scan"
          @click="scanStore.enterSelectionMode()"
        >
          Select Area
        </button>
      </template>
      <template v-else-if="scanStore.status === 'selecting'">
        <button
          class="btn btn-outline"
          @click="handleRetake"
        >
          Retake
        </button>
        <button
          class="btn btn-outline"
          @click="photoPreviewRef?.resetSelection?.()"
        >
          Reset
        </button>
        <button
          class="btn btn-scan"
          @click="photoPreviewRef?.confirmSelection?.()"
        >
          Confirm
        </button>
      </template>
      <template v-else-if="scanStore.status === 'error'">
        <button
          class="btn btn-scan"
          @click="handleRetake"
        >
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

/* Height from --scan-preview-height (scanLayoutStore.previewHeightPx) */
.preview-section {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: var(--scan-preview-height, 180px);
  overflow: hidden;
  background: #000;
  z-index: 10;
}

.preview-section--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0a0c;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.camera-permission-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  text-align: center;
  max-width: 20rem;
}

.camera-permission-placeholder__icon {
  width: 48px;
  height: 48px;
  color: rgba(255, 255, 255, 0.35);
  flex-shrink: 0;
}

.camera-permission-placeholder__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.camera-permission-placeholder__text {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--text-muted);
}

.result-panel {
  flex: 1;
  margin-top: var(--scan-preview-height, 180px);
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
  transition:
    opacity 0.2s,
    background 0.2s;
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
  background: var(--primary);
  color: #fff;
}

.action-bar .btn-scan:hover:not(:disabled) {
  background: var(--primary-hover);
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
