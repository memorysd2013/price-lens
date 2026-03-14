import { createWorker } from 'tesseract.js';
import { extractPrice } from '@/utils/priceParser';

export interface OcrResult {
  text: string;
  price: string | null;
  prices: string[];
  confidence: number;
}

export async function recognizePrice(image: Blob): Promise<OcrResult> {
  const worker = await createWorker('eng', 1, {
    logger: () => {},
  });

  try {
    const {
      data: { text, confidence },
    } = await worker.recognize(image);
    await worker.terminate();

    const { best, all } = extractPrice(text);
    const result: OcrResult = {
      text: text.trim(),
      price: best,
      prices: all,
      confidence: confidence ?? 0,
    };

    // Debug: log OCR result
    console.log('[Price Lens OCR] Raw text:', result.text);
    console.log('[Price Lens OCR] Extracted prices:', result.prices);
    console.log('[Price Lens OCR] Best guess:', result.price);
    console.log('[Price Lens OCR] Confidence:', result.confidence);

    return result;
  } finally {
    await worker.terminate();
  }
}
