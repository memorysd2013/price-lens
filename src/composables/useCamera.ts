import { ref, onUnmounted } from 'vue';

export function useCamera() {
  const stream = ref<MediaStream | null>(null);
  const error = ref<string | null>(null);
  const isReady = ref(false);

  async function startCamera(facingMode: 'environment' | 'user' = 'environment') {
    error.value = null;
    isReady.value = false;

    try {
      stream.value = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      isReady.value = true;
      return stream.value;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Cannot access camera';
      error.value = msg;
      throw e;
    }
  }

  function stopCamera() {
    if (stream.value) {
      stream.value.getTracks().forEach((track) => track.stop());
      stream.value = null;
    }
    isReady.value = false;
  }

  /**
   * Capture from video. If container size is given, crops to the same region
   * visible in the preview (object-fit: cover), so the result matches what the user saw.
   */
  function captureFromVideo(
    video: HTMLVideoElement,
    options?: { containerWidth: number; containerHeight: number }
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        reject(new Error('Video not ready'));
        return;
      }

      const vW = video.videoWidth;
      const vH = video.videoHeight;
      let srcX = 0;
      let srcY = 0;
      let srcW = vW;
      let srcH = vH;
      let outW = vW;
      let outH = vH;

      if (options && options.containerWidth > 0 && options.containerHeight > 0) {
        const cW = options.containerWidth;
        const cH = options.containerHeight;
        const scale = Math.max(cW / vW, cH / vH);
        srcW = Math.round(cW / scale);
        srcH = Math.round(cH / scale);
        srcX = Math.round((vW - srcW) / 2);
        srcY = Math.round((vH - srcH) / 2);
        srcX = Math.max(0, Math.min(srcX, vW - 1));
        srcY = Math.max(0, Math.min(srcY, vH - 1));
        srcW = Math.max(1, Math.min(srcW, vW - srcX));
        srcH = Math.max(1, Math.min(srcH, vH - srcY));
        outW = srcW;
        outH = srcH;
      }

      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, outW, outH);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create image'));
        },
        'image/jpeg',
        0.9
      );
    });
  }

  onUnmounted(() => {
    stopCamera();
  });

  return {
    stream,
    error,
    isReady,
    startCamera,
    stopCamera,
    captureFromVideo,
  };
}
