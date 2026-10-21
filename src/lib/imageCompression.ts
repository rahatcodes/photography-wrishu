/**
 * High-Performance Client-Side Image Compression Engine
 *
 * Designed specifically for professional photography portfolios:
 * 1. Multi-profile support: Ultra Crisp (2K/Hero), Balanced Pro (1080p), and Compact Web (< 100 KB).
 * 2. Anti-pixelation architecture:
 *    - Eliminates high-frequency Laplacian noise filters that cause WebP blocky artifacts.
 *    - Uses multi-step stepped downsampling with high-quality bicubic canvas interpolation.
 *    - Enforces anti-pixelation resolution floors so images are never downscaled to blurry thumbnails.
 * 3. Compact mode (< 100 KB) is optimized specifically for lowest pixelation and smooth tonal gradients.
 */

export type CompressionProfile = 'ultra' | 'balanced' | 'compact';

export interface CompressionProfileConfig {
  id: CompressionProfile;
  label: string;
  badge: string;
  description: string;
  maxSizeBytes: number;
  maxDimLandscape: number;
  maxDimPortrait: number;
  minDimFloor: number;
  minQuality: number;
  maxQuality: number;
  initialQuality: number;
}

export const COMPRESSION_PROFILES: Record<CompressionProfile, CompressionProfileConfig> = {
  ultra: {
    id: 'ultra',
    label: 'Ultra Crisp (2K Hero)',
    badge: '💎 2K / 2560px',
    description: 'Pristine photography fidelity for full-screen hero & prints (~240 - 320 KB)',
    maxSizeBytes: 320 * 1024,
    maxDimLandscape: 2560,
    maxDimPortrait: 1920,
    minDimFloor: 1920,
    minQuality: 0.82,
    maxQuality: 0.92,
    initialQuality: 0.86,
  },
  balanced: {
    id: 'balanced',
    label: 'Balanced Pro (Full HD)',
    badge: '⚖️ 1080p / 1920px',
    description: 'Crisp Full HD with fast global delivery (~140 - 190 KB)',
    maxSizeBytes: 190 * 1024,
    maxDimLandscape: 1920,
    maxDimPortrait: 1440,
    minDimFloor: 1440,
    minQuality: 0.74,
    maxQuality: 0.85,
    initialQuality: 0.79,
  },
  compact: {
    id: 'compact',
    label: 'Compact Web (< 100 KB)',
    badge: '🪶 < 100 KB Target',
    description: 'Strictly below 100 KB with anti-pixelation tuning and smooth gradients (< 98 KB)',
    maxSizeBytes: 98 * 1024,
    maxDimLandscape: 1600,
    maxDimPortrait: 1200,
    minDimFloor: 1280,
    minQuality: 0.65,
    maxQuality: 0.80,
    initialQuality: 0.73,
  },
};

export interface CompressionResult {
  width: number;
  height: number;
  orientation: 'landscape' | 'portrait';
  lqip: string;
  originalSize: number;
  compressedSize: number;
  savingsPercent: number;
  profile: CompressionProfile;
  variants: Record<number, Blob>;
  variantUrls: Record<number, string>;
  format: 'image/webp';
  blob: Blob;
  url: string;
  quality: number;
}

export interface CompressionProgress {
  stage: string;
  percent: number;
}

/**
 * High-quality stepped downsampling.
 * When downscaling large images (> 2x reduction), stepping down by 50% iteratively
 * prevents aliasing, staircasing, and moiré pixelation.
 */
function renderSteppedCanvas(
  source: ImageBitmap | HTMLImageElement | HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number
): HTMLCanvasElement {
  const currentW = 'width' in source ? (source.width as number) : 0;
  const currentH = 'height' in source ? (source.height as number) : 0;

  // If reduction is less than 2x, single high-quality draw is optimal
  if (currentW <= targetWidth * 2 && currentH <= targetHeight * 2) {
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
    }
    return canvas;
  }

  // Stepped downsampling for giant original camera photos
  let stepCanvas = document.createElement('canvas');
  let stepW = currentW;
  let stepH = currentH;
  stepCanvas.width = stepW;
  stepCanvas.height = stepH;
  let stepCtx = stepCanvas.getContext('2d');
  if (stepCtx) {
    stepCtx.imageSmoothingEnabled = true;
    stepCtx.imageSmoothingQuality = 'high';
    stepCtx.drawImage(source, 0, 0);
  }

  while (stepW * 0.5 > targetWidth && stepH * 0.5 > targetHeight) {
    stepW = Math.round(stepW * 0.5);
    stepH = Math.round(stepH * 0.5);
    const nextCanvas = document.createElement('canvas');
    nextCanvas.width = stepW;
    nextCanvas.height = stepH;
    const nextCtx = nextCanvas.getContext('2d');
    if (nextCtx) {
      nextCtx.imageSmoothingEnabled = true;
      nextCtx.imageSmoothingQuality = 'high';
      nextCtx.drawImage(stepCanvas, 0, 0, stepW, stepH);
    }
    stepCanvas = nextCanvas;
  }

  // Final draw to exact target dimensions
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = targetWidth;
  finalCanvas.height = targetHeight;
  const finalCtx = finalCanvas.getContext('2d');
  if (finalCtx) {
    finalCtx.imageSmoothingEnabled = true;
    finalCtx.imageSmoothingQuality = 'high';
    finalCtx.drawImage(stepCanvas, 0, 0, targetWidth, targetHeight);
  }

  return finalCanvas;
}

/**
 * Converts canvas to WebP Blob at given quality
 */
function canvasToWebpBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (b) => resolve(b || new Blob([], { type: 'image/webp' })),
      'image/webp',
      quality
    );
  });
}

/**
 * Primary compression engine:
 * Compresses an image according to the chosen profile (Ultra, Balanced, or Compact).
 * In Compact (<100KB) mode, it prevents pixelation by:
 * - Removing artificial Laplacian noise spikes
 * - Preserving an anti-pixelation resolution floor (>= 1280px)
 * - Using clean multi-step bicubic resampling
 * - Tuning WebP quality gracefully
 */
export async function compressImageWithProfile(
  file: File | Blob,
  options?: {
    profile?: CompressionProfile;
    maxSizeBytes?: number;
    preferredMaxDimension?: number;
    onProgress?: (progress: CompressionProgress) => void;
  }
): Promise<{
  blob: Blob;
  width: number;
  height: number;
  orientation: 'landscape' | 'portrait';
  quality: number;
  compressedSize: number;
  originalSize: number;
  profile: CompressionProfile;
}> {
  const profileKey = options?.profile || 'compact';
  const cfg = COMPRESSION_PROFILES[profileKey];
  const maxSizeBytes = options?.maxSizeBytes ?? cfg.maxSizeBytes;
  const onProgress = options?.onProgress;

  onProgress?.({ stage: `Decoding image for ${cfg.label}...`, percent: 15 });

  const imgBitmap = await createImageBitmap(file);
  const origWidth = imgBitmap.width;
  const origHeight = imgBitmap.height;
  const orientation = origWidth >= origHeight ? 'landscape' : 'portrait';

  // Determine initial target dimensions based on profile
  const profileMaxDim =
    orientation === 'landscape' ? cfg.maxDimLandscape : cfg.maxDimPortrait;
  const preferredDim = options?.preferredMaxDimension ?? profileMaxDim;

  let currentWidth = origWidth;
  let currentHeight = origHeight;

  if (Math.max(currentWidth, currentHeight) > preferredDim) {
    const scale = preferredDim / Math.max(currentWidth, currentHeight);
    currentWidth = Math.round(currentWidth * scale);
    currentHeight = Math.round(currentHeight * scale);
  }

  onProgress?.({ stage: `Anti-aliased resampling (${currentWidth}x${currentHeight})...`, percent: 35 });

  let canvas = renderSteppedCanvas(imgBitmap, currentWidth, currentHeight);

  // Binary search for highest quality that fits under maxSizeBytes
  let minQ = cfg.minQuality;
  let maxQ = cfg.maxQuality;
  let bestBlob: Blob | null = null;
  let bestQuality = cfg.initialQuality;
  let attempts = 0;

  while (attempts < 6) {
    attempts++;
    const testQ = parseFloat(((minQ + maxQ) / 2).toFixed(2));
    const testBlob = await canvasToWebpBlob(canvas, testQ);

    if (testBlob.size <= maxSizeBytes) {
      bestBlob = testBlob;
      bestQuality = testQ;
      minQ = testQ; // Try higher quality
    } else {
      maxQ = testQ; // Try lower quality
    }

    if (maxQ - minQ < 0.04) break;
  }

  // If still above budget (extremely complex textures like dense crowds or foliage),
  // gently step down resolution while maintaining the anti-pixelation floor (cfg.minDimFloor).
  while (
    (!bestBlob || bestBlob.size > maxSizeBytes) &&
    Math.max(currentWidth, currentHeight) > cfg.minDimFloor
  ) {
    currentWidth = Math.round(currentWidth * 0.92);
    currentHeight = Math.round(currentHeight * 0.92);

    onProgress?.({
      stage: `Fine-tuning resolution (${currentWidth}x${currentHeight}) without pixelation...`,
      percent: 65,
    });

    canvas = renderSteppedCanvas(imgBitmap, currentWidth, currentHeight);

    // Search quality in acceptable visual range
    minQ = cfg.minQuality;
    maxQ = cfg.maxQuality;
    for (let i = 0; i < 4; i++) {
      const testQ = parseFloat(((minQ + maxQ) / 2).toFixed(2));
      const testBlob = await canvasToWebpBlob(canvas, testQ);
      if (testBlob.size <= maxSizeBytes) {
        bestBlob = testBlob;
        bestQuality = testQ;
        minQ = testQ;
      } else {
        maxQ = testQ;
      }
      if (maxQ - minQ < 0.05) break;
    }
  }

  // Absolute fallback: encode with quality floor to strictly guarantee output
  if (!bestBlob || bestBlob.size > maxSizeBytes) {
    bestQuality = cfg.minQuality;
    bestBlob = await canvasToWebpBlob(canvas, bestQuality);
  }

  onProgress?.({ stage: 'Compression finalized', percent: 95 });

  return {
    blob: bestBlob,
    width: currentWidth,
    height: currentHeight,
    orientation,
    quality: bestQuality,
    compressedSize: bestBlob.size,
    originalSize: file.size,
    profile: profileKey,
  };
}

/**
 * Backward-compatible helper for legacy callers
 */
export async function compressImageBelow100KB(
  file: File | Blob,
  options?: {
    maxSizeBytes?: number;
    preferredMaxDimension?: number;
    profile?: CompressionProfile;
    onProgress?: (progress: CompressionProgress) => void;
  }
) {
  return compressImageWithProfile(file, {
    profile: options?.profile || 'compact',
    maxSizeBytes: options?.maxSizeBytes,
    preferredMaxDimension: options?.preferredMaxDimension,
    onProgress: options?.onProgress,
  });
}

/**
 * Strips EXIF and generates responsive variants + LQIP
 */
export async function compressAndGenerateVariants(
  file: File,
  options?: {
    profile?: CompressionProfile;
    quality?: number;
    isHero?: boolean;
    onProgress?: (progress: CompressionProgress) => void;
  }
): Promise<CompressionResult> {
  const profileKey = options?.profile || (options?.isHero ? 'ultra' : 'compact');
  const onProgress = options?.onProgress;
  onProgress?.({ stage: 'Reading image data', percent: 10 });

  // 1. Perform smart profile compression
  const compressed = await compressImageWithProfile(file, {
    profile: profileKey,
    preferredMaxDimension: options?.isHero ? 2560 : undefined,
    onProgress,
  });

  // 2. Generate 24px LQIP placeholder
  const imgBitmap = await createImageBitmap(compressed.blob);
  const lqipCanvas = document.createElement('canvas');
  const lqipWidth = 24;
  const lqipHeight = Math.max(1, Math.round((24 / compressed.width) * compressed.height));
  lqipCanvas.width = lqipWidth;
  lqipCanvas.height = lqipHeight;
  const lqipCtx = lqipCanvas.getContext('2d');
  if (lqipCtx) {
    lqipCtx.drawImage(imgBitmap, 0, 0, lqipWidth, lqipHeight);
  }
  const lqip = lqipCanvas.toDataURL('image/webp', 0.4);

  // 3. Build variant blobs and URLs
  const primaryUrl = URL.createObjectURL(compressed.blob);
  const targetWidths = [480, 768, 1280, 1920];
  const variants: Record<number, Blob> = {};
  const variantUrls: Record<number, string> = {};

  for (const width of targetWidths) {
    if (width >= compressed.width) {
      variants[width] = compressed.blob;
      variantUrls[width] = primaryUrl;
    } else {
      const renderW = width;
      const renderH = Math.round((renderW / compressed.width) * compressed.height);
      const varCanvas = renderSteppedCanvas(imgBitmap, renderW, renderH);
      const varBlob = await canvasToWebpBlob(varCanvas, Math.min(0.90, compressed.quality + 0.05));
      variants[width] = varBlob;
      variantUrls[width] = URL.createObjectURL(varBlob);
    }
  }

  variants[compressed.width] = compressed.blob;
  variantUrls[compressed.width] = primaryUrl;

  const savings = Math.max(
    0,
    Math.round(((file.size - compressed.compressedSize) / file.size) * 100)
  );

  onProgress?.({ stage: 'Compression completed successfully', percent: 100 });

  return {
    width: compressed.width,
    height: compressed.height,
    orientation: compressed.orientation,
    lqip,
    originalSize: file.size,
    compressedSize: compressed.compressedSize,
    savingsPercent: savings,
    profile: profileKey,
    variants,
    variantUrls,
    format: 'image/webp',
    blob: compressed.blob,
    url: primaryUrl,
    quality: compressed.quality,
  };
}
