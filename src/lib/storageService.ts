/**
 * Dual Storage Service
 *
 * Requirements:
 * 1. Hero Slider images: Uploaded to Supabase Public Storage bucket ('hero') for instant ultra-fast delivery.
 * 2. All other images (Photo Catalog, Projects, etc.): Uploaded to Cloudflare R2 bucket.
 * 3. Client-side compression pipeline: Guarantees files are strictly < 100 KB, preserving image fidelity and sharpness.
 */

import { supabase, supabaseStorage, isSupabaseConfigured } from './supabaseClient.ts';
import {
  compressImageBelow100KB,
  compressImageWithProfile,
  compressAndGenerateVariants,
  CompressionResult,
  CompressionProfile,
  COMPRESSION_PROFILES,
} from './imageCompression.ts';

export interface UploadHeroResult {
  url: string;
  width: number;
  height: number;
  orientation: 'landscape' | 'portrait';
  compressedSize: number;
  originalSize: number;
  savingsPercent: number;
  storage: 'supabase' | 'fallback';
  profile: CompressionProfile;
  warning?: string;
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
  storage: 'r2' | 'fallback';
  profile: CompressionProfile;
  warning?: string;
}

/**
 * Converts a Blob to a base64 Data URL (used as zero-dependency fallback)
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Uploads Hero Slider image to Supabase Storage bucket ('hero')
 * Fast global delivery via Supabase CDN.
 */
export async function uploadHeroImageToSupabase(
  file: File,
  orientation: 'landscape' | 'portrait',
  onProgress?: (stage: string, percent: number) => void,
  profile: CompressionProfile = 'ultra'
): Promise<UploadHeroResult> {
  const profileCfg = COMPRESSION_PROFILES[profile];
  onProgress?.(`Compressing hero visual (${profileCfg.label})...`, 25);

  // 1. Compress with selected quality profile
  const compressed = await compressImageWithProfile(file, {
    profile,
    preferredMaxDimension: orientation === 'portrait' ? profileCfg.maxDimPortrait : profileCfg.maxDimLandscape,
    onProgress: (p) => onProgress?.(p.stage, Math.round(p.percent * 0.5)),
  });

  const savings = Math.max(
    0,
    Math.round(((file.size - compressed.compressedSize) / file.size) * 100)
  );

  onProgress?.('Uploading to Supabase Storage bucket (hero)...', 60);

  // 2. Upload to Supabase 'hero' bucket using clean storage client
  const client = supabaseStorage || supabase;
  if (!client || !isSupabaseConfigured) {
    throw new Error('Supabase client is not configured. Please check your environment variables.');
  }

  try {
    const cleanName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .toLowerCase();
    const filePath = `hero-slides/${orientation}-${Date.now()}-${cleanName}.webp`;

    const { data, error } = await client.storage
      .from('hero')
      .upload(filePath, compressed.blob, {
        contentType: 'image/webp',
        upsert: true,
        cacheControl: '31536000',
      });

    if (!error && data?.path) {
      const { data: urlData } = client.storage
        .from('hero')
        .getPublicUrl(data.path);

      onProgress?.('Uploaded to Supabase successfully!', 100);

      return {
        url: urlData.publicUrl,
        width: compressed.width,
        height: compressed.height,
        orientation: compressed.orientation,
        compressedSize: compressed.compressedSize,
        originalSize: file.size,
        savingsPercent: savings,
        storage: 'supabase',
        profile,
      };
    } else {
      console.error('Supabase hero bucket upload error:', error);
      const errMsg = error?.message || 'Access Denied / RLS Policy';
      throw new Error(
        `Supabase upload rejected: "${errMsg}". ` +
        `Please ensure the "hero" bucket exists in Supabase and that public/anon uploads are permitted by an RLS policy.`
      );
    }
  } catch (err: unknown) {
    console.error('Supabase upload exception:', err);
    throw err;
  }
}

/**
 * Uploads General Catalog photos and all other images to Cloudflare R2 Bucket
 */
export async function uploadCatalogImageToR2(
  file: File,
  category: string,
  onProgress?: (stage: string, percent: number) => void,
  profile: CompressionProfile = 'compact'
): Promise<UploadR2Result> {
  const profileCfg = COMPRESSION_PROFILES[profile];
  onProgress?.(`Compressing photo (${profileCfg.label})...`, 20);

  // 1. Compress with responsive variants
  const result: CompressionResult = await compressAndGenerateVariants(file, {
    profile,
    onProgress: (p) => onProgress?.(p.stage, Math.round(p.percent * 0.5)),
  });

  onProgress?.('Streaming to Cloudflare R2 bucket...', 60);

  const workerUrl = import.meta.env.VITE_WORKER_UPLOAD_URL;
  const cdnBase = import.meta.env.VITE_CLOUDFLARE_R2_CDN || 'https://cdn.wrishu.com';

  // 2. Attempt R2 Upload via Cloudflare Worker
  if (workerUrl && !workerUrl.includes('your-worker')) {
    try {
      // Get JWT from Supabase session if authenticated
      let token = 'local-admin-token';
      if (supabase && isSupabaseConfigured) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          token = session.access_token;
        }
      }

      const signerRes = await fetch(workerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category,
          fileName: file.name,
          contentType: 'image/webp',
          size: result.compressedSize,
        }),
      });

      if (signerRes.ok) {
        const signData = await signerRes.json();
        if (signData.uploadUrl) {
          // Upload binary payload directly to presigned URL
          await fetch(signData.uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'image/webp' },
            body: result.blob,
          });

          onProgress?.('R2 Upload Complete!', 100);

          const r2PublicUrl = signData.publicUrl || `${cdnBase}/${signData.key}`;
          return {
            url: r2PublicUrl,
            variants: {
              [result.width]: r2PublicUrl,
              1920: r2PublicUrl,
              1280: r2PublicUrl,
              768: r2PublicUrl,
              480: r2PublicUrl,
            },
            width: result.width,
            height: result.height,
            orientation: result.orientation,
            lqip: result.lqip,
            compressedSize: result.compressedSize,
            originalSize: result.originalSize,
            savingsPercent: result.savingsPercent,
            storage: 'r2',
            profile,
          };
        }
      }
    } catch (err) {
      console.warn('Cloudflare R2 worker unreachable, using local fallback:', err);
    }
  }

  // Graceful fallback to persistent Data URL / Object URL
  const dataUrl = await blobToDataUrl(result.blob);
  onProgress?.('Stored with local fallback', 100);

  return {
    url: dataUrl,
    variants: {
      [result.width]: dataUrl,
      1920: dataUrl,
      1280: dataUrl,
      768: dataUrl,
      480: dataUrl,
    },
    width: result.width,
    height: result.height,
    orientation: result.orientation,
    lqip: result.lqip,
    compressedSize: result.compressedSize,
    originalSize: result.originalSize,
    savingsPercent: result.savingsPercent,
    storage: 'fallback',
    profile,
  };
}
