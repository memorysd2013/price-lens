<script setup lang="ts">
import { ref } from 'vue';
import { useScanStore } from '@/stores/scan';
import SelectionOverlay from '@/components/SelectionOverlay.vue';

const emit = defineEmits<{
  confirmSelection: [rect: { x: number; y: number; width: number; height: number }];
  retake: [];
  selectArea: [];
}>();

const scanStore = useScanStore();
const selectionOverlayRef = ref<InstanceType<typeof SelectionOverlay> | null>(null);
const imageAspect = ref<number | null>(null);

function onImageLoad(e: Event) {
  const img = e.target as HTMLImageElement;
  if (img.naturalWidth && img.naturalHeight) {
    imageAspect.value = img.naturalWidth / img.naturalHeight;
  }
}

function confirmSelection() {
  selectionOverlayRef.value?.confirmSelection();
}

function resetSelection() {
  selectionOverlayRef.value?.resetSelection();
}

defineExpose({ confirmSelection, resetSelection });
</script>

<template>
  <div class="photo-preview">
    <template v-if="scanStore.capturedImage">
      <!-- Selection mode: buttons provided by ScanView fixed action bar -->
      <SelectionOverlay
        ref="selectionOverlayRef"
        v-if="scanStore.status === 'selecting'"
        :image-src="scanStore.capturedImage"
        @confirm="emit('confirmSelection', $event)"
        @cancel="scanStore.exitSelectionMode()"
      />
      <!-- Normal preview: photo + OCR region overlay -->
      <template v-else>
        <div
          class="photo-wrap"
          :style="imageAspect ? { aspectRatio: String(imageAspect) } : undefined"
        >
          <img
            :src="scanStore.capturedImage"
            alt="Captured photo"
            class="photo"
            @load="onImageLoad"
          />
          <!-- OCR region frame (aiming frame or Select Area rect) -->
          <div
            v-if="scanStore.aimingFrameRect"
            class="ocr-region-overlay"
            :style="{
              left: scanStore.aimingFrameRect.x + '%',
              top: scanStore.aimingFrameRect.y + '%',
              width: scanStore.aimingFrameRect.width + '%',
              height: scanStore.aimingFrameRect.height + '%',
            }"
          />
        </div>
        <div v-if="scanStore.status === 'recognizing'" class="loading-overlay">
          <div class="spinner" />
          <p>Recognizing...</p>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.photo-preview {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100%;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.ocr-region-overlay {
  position: absolute;
  border: 2px solid var(--accent-gold, #d4af37);
  border-radius: 6px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3);
  pointer-events: none;
  z-index: 2;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  gap: 1rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
