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
      <!-- Normal preview: photo (actions from fixed action bar) -->
      <template v-else>
        <img
          :src="scanStore.capturedImage"
          alt="Captured photo"
          class="photo"
        />
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

.photo {
  width: 100%;
  height: 100%;
  object-fit: contain;
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
