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

  function captureFromVideo(video: HTMLVideoElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        reject(new Error('Video not ready'));
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(video, 0, 0);
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
