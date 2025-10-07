// PDF Fonts - Inter font family embedded as base64 for reliable PDF generation
// These fonts provide full Unicode support, accurate text metrics, and clean copy/paste

import InterRegularTTF from '../fonts/Inter-Regular.ttf?url';
import InterBoldTTF from '../fonts/Inter-Bold.ttf?url';

export interface PDFFontData {
  regular: string;
  bold: string;
}

// Load fonts as URLs (Vite will handle them)
export const INTER_FONTS = {
  regularUrl: InterRegularTTF,
  boldUrl: InterBoldTTF
};

// Memoized font cache to avoid re-loading on every PDF generation
let fontCache: PDFFontData | null = null;
let fontLoadPromise: Promise<PDFFontData> | null = null;

// Function to fetch and convert fonts to base64 for jsPDF with memoization and error handling
export async function loadInterFonts(): Promise<PDFFontData> {
  // Return cached fonts if already loaded
  if (fontCache) {
    return fontCache;
  }

  // Return in-flight promise if already loading
  if (fontLoadPromise) {
    return fontLoadPromise;
  }

  // Start new load with timeout protection
  fontLoadPromise = (async () => {
    try {
      const timeoutMs = 10000; // 10 second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const [regularResponse, boldResponse] = await Promise.all([
        fetch(InterRegularTTF, { signal: controller.signal }),
        fetch(InterBoldTTF, { signal: controller.signal })
      ]);

      clearTimeout(timeoutId);

      if (!regularResponse.ok || !boldResponse.ok) {
        throw new Error('Font fetch failed: HTTP error');
      }

      const [regularBlob, boldBlob] = await Promise.all([
        regularResponse.blob(),
        boldResponse.blob()
      ]);

      const [regularBase64, boldBase64] = await Promise.all([
        blobToBase64(regularBlob),
        blobToBase64(boldBlob)
      ]);

      const fonts = {
        regular: regularBase64,
        bold: boldBase64
      };

      // Cache successful load
      fontCache = fonts;
      return fonts;
    } catch (error) {
      fontLoadPromise = null; // Clear failed promise so retry is possible
      throw new Error(`Failed to load PDF fonts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  })();

  return fontLoadPromise;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix if present
      const base64Data = base64.split(',')[1] || base64;
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
