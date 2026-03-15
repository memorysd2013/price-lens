<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const props = defineProps<{
  imageSrc: string;
}>();

const emit = defineEmits<{
  confirm: [rect: SelectionRect];
  cancel: [];
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const imgRef = ref<HTMLImageElement | null>(null);

const isDrawing = ref(false);
const startPoint = ref<{ x: number; y: number } | null>(null);
const currentPoint = ref<{ x: number; y: number } | null>(null);
const finalizedSelection = ref<SelectionRect | null>(null);

const selection = computed<SelectionRect | null>(() => {
  if (finalizedSelection.value) return finalizedSelection.value;
  const start = startPoint.value;
  const current = currentPoint.value;
  if (!start || !current) return null;
  const left = Math.min(start.x, current.x);
  const top = Math.min(start.y, current.y);
  const width = Math.abs(current.x - start.x);
  const height = Math.abs(current.y - start.y);
  if (width < 2 || height < 2) return null;
  return { x: left, y: top, width, height };
});

const selectionStyle = computed(() => {
  const s = selection.value;
  if (!s) return {};
  return {
    left: `${s.x}%`,
    top: `${s.y}%`,
    width: `${s.width}%`,
    height: `${s.height}%`,
  };
});

function getEventPercent(e: MouseEvent | TouchEvent): { x: number; y: number } {
  const el = containerRef.value;
  if (!el) return { x: 0, y: 0 };
  const rect = el.getBoundingClientRect();
  const clientX =
    ('touches' in e
      ? (e.touches[0]?.clientX ?? e.changedTouches?.[0]?.clientX)
      : e.clientX) ?? 0;
  const clientY =
    ('touches' in e
      ? (e.touches[0]?.clientY ?? e.changedTouches?.[0]?.clientY)
      : e.clientY) ?? 0;
  return {
    x: ((clientX - rect.left) / rect.width) * 100,
    y: ((clientY - rect.top) / rect.height) * 100,
  };
}

function onPointerDown(e: MouseEvent | TouchEvent) {
  e.preventDefault();
  const p = getEventPercent(e);
  finalizedSelection.value = null;
  isDrawing.value = true;
  startPoint.value = p;
  currentPoint.value = p;
}

function onPointerMove(e: MouseEvent | TouchEvent) {
  if (!isDrawing.value) return;
  e.preventDefault();
  currentPoint.value = getEventPercent(e);
}

function onPointerUp() {
  if (!isDrawing.value) return;
  isDrawing.value = false;
  const s = selection.value;
  if (s && s.width >= 5 && s.height >= 5) {
    finalizedSelection.value = s;
  }
  startPoint.value = null;
  currentPoint.value = null;
}

function confirmSelection() {
  const s = selection.value;
  if (!s || s.width < 5 || s.height < 5) return;

  const container = containerRef.value;
  const img = imgRef.value;
  if (!container || !img) return;

  const cRect = container.getBoundingClientRect();
  const cw = cRect.width;
  const ch = cRect.height;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (iw === 0 || ih === 0) return;

  const scale = Math.min(cw / iw, ch / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const ox = (cw - dw) / 2;
  const oy = (ch - dh) / 2;

  const selLeft = (s.x / 100) * cw;
  const selTop = (s.y / 100) * ch;
  const selWidth = (s.width / 100) * cw;
  const selHeight = (s.height / 100) * ch;

  let imgLeft = Math.max(0, selLeft - ox);
  let imgTop = Math.max(0, selTop - oy);
  let imgWidth = Math.min(dw, selWidth);
  let imgHeight = Math.min(dh, selHeight);
  if (imgLeft + imgWidth > dw) imgWidth = dw - imgLeft;
  if (imgTop + imgHeight > dh) imgHeight = dh - imgTop;
  if (imgWidth <= 0 || imgHeight <= 0) return;

  const rect: SelectionRect = {
    x: (imgLeft / dw) * 100,
    y: (imgTop / dh) * 100,
    width: (imgWidth / dw) * 100,
    height: (imgHeight / dh) * 100,
  };
  emit('confirm', rect);
}

function resetSelection() {
  startPoint.value = null;
  currentPoint.value = null;
  finalizedSelection.value = null;
}

defineExpose({ confirmSelection, resetSelection });

onMounted(() => {
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);
  window.addEventListener('touchmove', onPointerMove, { passive: false });
  window.addEventListener('touchend', onPointerUp);
});

onUnmounted(() => {
  window.removeEventListener('mousemove', onPointerMove);
  window.removeEventListener('mouseup', onPointerUp);
  window.removeEventListener('touchmove', onPointerMove);
  window.removeEventListener('touchend', onPointerUp);
});
</script>

<template>
  <div
    ref="containerRef"
    class="selection-container"
    @mousedown="onPointerDown"
    @touchstart="onPointerDown"
  >
    <img
      ref="imgRef"
      :src="imageSrc"
      alt=""
      class="photo"
    />
    <!-- Teal selection box with golden corners -->
    <div
      v-if="selection"
      class="selection-box"
      :style="selectionStyle"
    >
      <span class="corner corner-tl" />
      <span class="corner corner-tr" />
      <span class="corner corner-bl" />
      <span class="corner corner-br" />
    </div>
  </div>
</template>

<style scoped>
.selection-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  cursor: crosshair;
}

.photo {
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
  pointer-events: none;
}

.selection-box {
  position: absolute;
  border: 2px solid var(--selection-teal);
  border-radius: 8px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.4);
  pointer-events: none;
}

.corner {
  position: absolute;
  width: 16px;
  height: 16px;
  border-color: var(--primary);
  border-style: solid;
  border-width: 0;
}

.corner-tl {
  top: -2px;
  left: -2px;
  border-top-width: 3px;
  border-left-width: 3px;
  border-radius: 4px 0 0 0;
}

.corner-tr {
  top: -2px;
  right: -2px;
  border-top-width: 3px;
  border-right-width: 3px;
  border-radius: 0 4px 0 0;
}

.corner-bl {
  bottom: -2px;
  left: -2px;
  border-bottom-width: 3px;
  border-left-width: 3px;
  border-radius: 0 0 0 4px;
}

.corner-br {
  bottom: -2px;
  right: -2px;
  border-bottom-width: 3px;
  border-right-width: 3px;
  border-radius: 0 0 4px 0;
}
</style>
