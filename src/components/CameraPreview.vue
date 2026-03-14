<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useCamera } from '@/composables/useCamera';
import { useScanStore } from '@/stores/scan';

const videoRef = ref<HTMLVideoElement | null>(null);
const { stream, error, isReady, startCamera, captureFromVideo } = useCamera();
const scanStore = useScanStore();

onMounted(async () => {
  try {
    await startCamera();
    scanStore.setStatus('camera');
  } catch {
    scanStore.setStatus('error');
    scanStore.setError('Cannot start camera. Please check permissions.');
  }
});

watch(stream, (s) => {
  const video = videoRef.value;
  if (video && s) {
    video.srcObject = s;
  }
});

/** Capture current frame as Blob for parent to crop and run OCR */
async function capture(): Promise<Blob> {
  const video = videoRef.value;
  if (!video || !isReady.value) throw new Error('Camera not ready');
  return captureFromVideo(video);
}

defineExpose({ capture });

function handleFlash() {
  // Flash toggle - skeleton placeholder
}
</script>

<template>
  <div class="camera-preview">
    <!-- Header overlay -->
    <div class="camera-header">
      <button class="header-btn icon-btn" type="button" aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <span class="header-hint">Drag to select price</span>
      <button class="header-btn icon-btn" type="button" aria-label="Flash" @click="handleFlash">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      </button>
    </div>

    <video
      ref="videoRef"
      class="video"
      autoplay
      playsinline
      muted
    />
    <div v-if="error" class="error-overlay">
      <p>{{ error }}</p>
    </div>
  </div>
</template>

<style scoped>
.camera-preview {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100%;
  overflow: hidden;
  background: #000;
}

.camera-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  padding-top: calc(0.75rem + env(safe-area-inset-top));
  z-index: 10;
}

.header-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-btn svg {
  width: 20px;
  height: 20px;
}

.header-hint {
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-size: 0.875rem;
}

.video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
}

.error-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 2rem;
  text-align: center;
}
</style>
