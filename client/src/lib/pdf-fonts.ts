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

// Function to fetch and convert fonts to base64 for jsPDF
export async function loadInterFonts(): Promise<PDFFontData> {
  const [regularResponse, boldResponse] = await Promise.all([
    fetch(InterRegularTTF),
    fetch(InterBoldTTF)
  ]);

  const [regularBlob, boldBlob] = await Promise.all([
    regularResponse.blob(),
    boldResponse.blob()
  ]);

  const [regularBase64, boldBase64] = await Promise.all([
    blobToBase64(regularBlob),
    blobToBase64(boldBlob)
  ]);

  return {
    regular: regularBase64,
    bold: boldBase64
  };
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
