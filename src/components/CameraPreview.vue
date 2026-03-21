<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useCamera } from '@/composables/useCamera';
import { useScanStore } from '@/stores/scan';
import type { RectPercent } from '@/stores/scan';

const props = defineProps<{
  /** OCR region overlay; must match crop rect used after capture */
  aimingRect: RectPercent;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const videoRef = ref<HTMLVideoElement | null>(null);
const { stream, isReady, startCamera, captureFromVideo } = useCamera();
const scanStore = useScanStore();

onMounted(async () => {
  try {
    await startCamera();
    scanStore.setStatus('camera');
  } catch {
    scanStore.setStatus('no_camera');
    scanStore.setError('無法使用相機，請在系統或瀏覽器設定中允許相機權限。');
  }
});

watch(stream, (s) => {
  const video = videoRef.value;
  if (video && s) {
    video.srcObject = s;
  }
});

/** Capture current frame cropped to preview visible area (same as object-fit: cover) */
async function capture(): Promise<Blob> {
  const video = videoRef.value;
  if (!video || !isReady.value) throw new Error('Camera not ready');
  const container = containerRef.value;
  const opts =
    container && container.clientWidth > 0 && container.clientHeight > 0
      ? {
          containerWidth: container.clientWidth,
          containerHeight: container.clientHeight,
        }
      : undefined;
  return captureFromVideo(video, opts);
}

defineExpose({ capture });

function handleFlash() {
  // Flash toggle - skeleton placeholder
}
</script>

<template>
  <div
    ref="containerRef"
    class="camera-preview"
  >
    <video
      ref="videoRef"
      class="video"
      autoplay
      playsinline
      muted
    />
    <div
      class="aiming-frame"
      aria-hidden="true"
      :style="{
        left: props.aimingRect.x + '%',
        top: props.aimingRect.y + '%',
        width: props.aimingRect.width + '%',
        height: props.aimingRect.height + '%',
        transform: 'translate(0, 0)',
      }"
    />
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
}

.aiming-frame {
  position: absolute;
  border: 2px solid rgba(255, 255, 255, 0.85);
  border-radius: 8px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.35);
  pointer-events: none;
  z-index: 5;
}
</style>
