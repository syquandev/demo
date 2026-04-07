import { createWorker } from 'tesseract.js';

let worker = null;

/**
 * Initialize Tesseract worker with Vietnamese + English language support
 */
async function getWorker() {
  if (worker) return worker;

  worker = await createWorker('vie+eng', 1, {
    logger: (m) => {
      // Can hook into progress here if needed
      if (m.status === 'recognizing text') {
        // Progress value is m.progress (0-1)
      }
    },
  });

  return worker;
}

/**
 * Preprocess image for better OCR results:
 * - Grayscale conversion
 * - Contrast enhancement
 * - Adaptive binarization (threshold)
 * - Noise reduction
 * @param {string} imageSource - base64 data URL
 * @returns {Promise<string>} processed base64 data URL
 */
export function preprocessImage(imageSource) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Scale up small images for better OCR (minimum 1500px width)
      let scale = 1;
      if (img.width < 1500) {
        scale = 1500 / img.width;
      }
      // Cap scale to avoid huge images
      scale = Math.min(scale, 3);

      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      // Draw scaled image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Get pixel data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Step 1: Grayscale
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }

      // Step 2: Contrast enhancement (histogram stretch)
      let min = 255, max = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] < min) min = data[i];
        if (data[i] > max) max = data[i];
      }
      const range = max - min || 1;
      for (let i = 0; i < data.length; i += 4) {
        const val = Math.round(((data[i] - min) / range) * 255);
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
      }

      // Step 3: Adaptive binarization (Sauvola-like using local mean)
      // Use a simplified approach: global Otsu-like threshold
      const histogram = new Array(256).fill(0);
      for (let i = 0; i < data.length; i += 4) {
        histogram[data[i]]++;
      }

      // Otsu's method to find optimal threshold
      const totalPixels = data.length / 4;
      let sum = 0;
      for (let i = 0; i < 256; i++) sum += i * histogram[i];

      let sumB = 0;
      let wB = 0;
      let wF = 0;
      let maxVariance = 0;
      let threshold = 128;

      for (let t = 0; t < 256; t++) {
        wB += histogram[t];
        if (wB === 0) continue;
        wF = totalPixels - wB;
        if (wF === 0) break;

        sumB += t * histogram[t];
        const mB = sumB / wB;
        const mF = (sum - sumB) / wF;

        const variance = wB * wF * (mB - mF) * (mB - mF);
        if (variance > maxVariance) {
          maxVariance = variance;
          threshold = t;
        }
      }

      // Apply threshold - make text black, background white
      for (let i = 0; i < data.length; i += 4) {
        const val = data[i] < threshold ? 0 : 255;
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
      }

      // Step 4: Simple noise reduction (remove isolated black/white pixels)
      const w = canvas.width;
      const h = canvas.height;
      const cleaned = new Uint8ClampedArray(data);

      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = (y * w + x) * 4;
          const current = data[idx];

          // Count neighbors with same value
          let sameCount = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dy === 0 && dx === 0) continue;
              const nIdx = ((y + dy) * w + (x + dx)) * 4;
              if (data[nIdx] === current) sameCount++;
            }
          }

          // If pixel is isolated (less than 2 same neighbors), flip it
          if (sameCount < 2) {
            const flipped = current === 0 ? 255 : 0;
            cleaned[idx] = flipped;
            cleaned[idx + 1] = flipped;
            cleaned[idx + 2] = flipped;
          }
        }
      }

      // Put cleaned data back
      const cleanedImageData = new ImageData(cleaned, canvas.width, canvas.height);
      ctx.putImageData(cleanedImageData, 0, 0);

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => reject(new Error('Failed to load image for preprocessing'));
    img.src = imageSource;
  });
}

/**
 * Extract text from a single image using Tesseract.js (runs locally in browser)
 * @param {string} imageSource - base64 data URL or image URL
 * @param {boolean} preprocess - whether to preprocess the image first
 * @returns {Promise<string>} extracted text
 */
export async function ocrExtractText(imageSource, preprocess = true) {
  const w = await getWorker();

  let source = imageSource;
  if (preprocess) {
    source = await preprocessImage(imageSource);
  }

  const result = await w.recognize(source, {}, {
    text: true,
  });

  return result.data.text.trim();
}

/**
 * Extract text from multiple images using Tesseract.js
 * @param {Array<string>} imageSources - array of base64 data URLs
 * @param {function} onProgress - optional callback (currentIndex, totalCount, progress)
 * @param {boolean} preprocess - whether to preprocess images first
 * @returns {Promise<string>} combined extracted text
 */
export async function ocrExtractMultipleTexts(imageSources, onProgress, preprocess = true) {
  const results = [];
  const w = await getWorker();

  for (let i = 0; i < imageSources.length; i++) {
    if (onProgress) {
      onProgress(i, imageSources.length, 0);
    }

    let source = imageSources[i];
    if (preprocess) {
      source = await preprocessImage(source);
    }

    const result = await w.recognize(source);
    results.push(result.data.text.trim());

    if (onProgress) {
      onProgress(i, imageSources.length, 100);
    }
  }

  return results.filter(Boolean).join('\n\n---\n\n');
}

/**
 * Terminate the Tesseract worker to free memory
 */
export async function terminateOcr() {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}
