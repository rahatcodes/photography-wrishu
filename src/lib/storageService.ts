/**
 * Storage Service Adapter
 * Delegates to the unified imageEngine for zero-local-memory uploads:
 * 1. Hero images -> Supabase Storage ('hero' bucket)
 * 2. Catalog & project images -> Cloudflare R2
 */

import {
  uploadHeroImageToSupabase,
  uploadImageToCloudflareR2,
  listHeroBucketImages,
  compressImageToWebP,
  UploadResult,
  BucketImageItem,
} from './imageEngine.ts';

export {
  uploadHeroImageToSupabase,
  uploadImageToCloudflareR2,
  listHeroBucketImages,
  compressImageToWebP,
};

export type { UploadResult, BucketImageItem };

export interface UploadHeroResult {
  url: string;
  width: number;
  height: number;
  orientation: 'landscape' | 'portrait';
  compressedSize: number;
  originalSize: number;
  savingsPercent: number;
  storage: 'supabase';
}

export interface UploadR2Result {
  url: string;
  variants: Record<number, string>;
  width: number;
  height: number;
  orientation: 'landscape' | 'portrait';
  lqip: string;
  compressedSize: number;
  originalSize: number;
  savingsPercent: number;
  storage: 'r2';
}

/**
 * Uploads Catalog & Project photos to Cloudflare R2 with responsive variant mapping.
 * Never stores in local memory / base64.
 */
export async function uploadCatalogImageToR2(
  file: File,
  category: string,
  onProgress?: (stage: string, percent: number) => void
): Promise<UploadR2Result> {
  const result = await uploadImageToCloudflareR2(file, category, (pct, stage) => {
    onProgress?.(stage, pct);
  });

  const orientation = result.width >= result.height ? 'landscape' : 'portrait';

  return {
    url: result.url,
    variants: {
      [result.width]: result.url,
      1920: result.url,
      1280: result.url,
      768: result.url,
      480: result.url,
    },
    width: result.width,
    height: result.height,
    orientation,
    lqip: result.url,
    compressedSize: result.sizeBytes,
    originalSize: file.size,
    savingsPercent: result.savingsPercent,
    storage: 'r2',
  };
}
