/**
 * Normalize number string (remove thousand separators)
 */
function normalizeNumber(raw: string): string {
  return raw.replace(/,/g, '').replace(/\s/g, '').trim();
}

/**
 * Preprocess: merge thousand-separator format into a single number
 * e.g. "1,290" -> "1290", "1,000,000" -> "1000000"
 * Handles OCR comma-as-space: "1 , 290" -> "1290"
 */
function preprocessThousandSeparators(text: string): string {
  return text.replace(/(\d{1,3})((?:\s*[,，]\s*\d{3})*(?:\.\d+)?)/g, (_, head, tail) => {
    return head + tail.replace(/[\s,，]/g, '');
  });
}

/**
 * Extract all possible price values (multiple numbers)
 * Supports: integers, decimals, thousand separators, currency symbols
 */
export function extractAllPrices(text: string): string[] {
  if (!text || typeof text !== 'string') return [];

  // Merge thousand separators first, then extract
  const normalized = preprocessThousandSeparators(text);

  const results: string[] = [];
  const seen = new Set<string>();

  // 1. Numbers with currency symbols (priority)
  const currencyRegex = /[$¥€£]\s*([\d,]+\.?\d*)|(?:NT\$|USD|TWD)\s*([\d,]+\.?\d*)/gi;
  let m: RegExpExecArray | null;
  while ((m = currencyRegex.exec(normalized)) !== null) {
    const raw = (m[1] ?? m[2] ?? '').trim();
    const n = normalizeNumber(raw);
    if (n && /^\d+\.?\d*$/.test(n) && !seen.has(n)) {
      seen.add(n);
      results.push(n);
    }
  }

  // 2. Thousand-separator format (requires comma to avoid matching e.g. 1290)
  const thousandsRegex = /(\d{1,3}(?:,\d{3})+(?:\.\d+)?)|(\d{1,3}(?:\.\d{3})+(?:,\d+)?)/g;
  while ((m = thousandsRegex.exec(normalized)) !== null) {
    const raw = (m[1] ?? m[2] ?? '').trim();
    const n = normalizeNumber(raw);
    if (n && /^\d+\.?\d*$/.test(n) && !seen.has(n)) {
      seen.add(n);
      results.push(n);
    }
  }

  // 3. Plain decimal or integer (skip long digit strings like barcodes)
  const simpleRegex = /\b(\d{1,6}\.\d{1,2})\b|\b(\d{1,6})\b/g;
  while ((m = simpleRegex.exec(normalized)) !== null) {
    const raw = (m[1] ?? m[2] ?? '').trim();
    const n = normalizeNumber(raw);
    if (n && !seen.has(n)) {
      seen.add(n);
      results.push(n);
    }
  }

  // 4. Drop substrings contained in other numbers; prefer longer runs (e.g. 1290 over 129, 0)
  return filterSubstringNumbers(results);
}

/**
 * Remove items that are substrings of other numbers; prefer longer numbers
 */
function filterSubstringNumbers(numbers: string[]): string[] {
  return numbers.filter(
    (n) => !numbers.some((m) => m !== n && m.includes(n))
  );
}

/**
 * Pick the most likely price from multiple numbers
 * Priority: with decimal > longer number
 */
function pickBestPrice(all: string[]): string | null {
  if (all.length === 0) return null;
  if (all.length === 1) return all[0];

  // Prefer numbers with decimal (typical price format)
  const withDecimal = all.filter((n) => n.includes('.'));
  if (withDecimal.length > 0) {
    return withDecimal[0];
  }
  // Otherwise prefer longer number (e.g. 1290 over 50)
  return all.reduce((a, b) => (a.length >= b.length ? a : b));
}

/**
 * Extract price from OCR text (returns best guess + all candidates)
 */
export function extractPrice(text: string): { best: string | null; all: string[] } {
  const all = extractAllPrices(text);
  return { best: pickBestPrice(all), all };
}
