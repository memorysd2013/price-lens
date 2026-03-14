/**
 * Crop image by selection rect
 * @param imageSrc - Image URL (blob: or data:)
 * @param rect - Selection rect (percent of image 0-100)
 */
export async function cropImageToBlob(
  imageSrc: string,
  rect: { x: number; y: number; width: number; height: number }
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;

      const left = Math.round((rect.x / 100) * w);
      const top = Math.round((rect.y / 100) * h);
      const width = Math.round((rect.width / 100) * w);
      const height = Math.round((rect.height / 100) * h);

      // Clamp to bounds
      const clampedLeft = Math.max(0, Math.min(left, w - 1));
      const clampedTop = Math.max(0, Math.min(top, h - 1));
      const clampedWidth = Math.max(1, Math.min(width, w - clampedLeft));
      const clampedHeight = Math.max(1, Math.min(height, h - clampedTop));

      const canvas = document.createElement('canvas');
      canvas.width = clampedWidth;
      canvas.height = clampedHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to create canvas'));
        return;
      }
      ctx.drawImage(
        img,
        clampedLeft,
        clampedTop,
        clampedWidth,
        clampedHeight,
        0,
        0,
        clampedWidth,
        clampedHeight
      );
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Crop failed'));
        },
        'image/jpeg',
        0.9
      );
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = imageSrc;
  });
}
