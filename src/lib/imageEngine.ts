/**
 * ============================================================================
 * Modular Photography Portfolio Image Engine
 *
 * Designed for high performance, zero local memory bloat, and clean separation:
 * 1. Client-Side WebP Compression:
 *    - Standard Canvas API, fast & anti-aliased (<200ms per photo)
 *    - Strict WebP binary Blob output (ZERO base64 strings in storage)
 *
 * 2. Hero Slider Engine (Supabase Storage):
 *    - Compresses & uploads hero slides directly to Supabase 'hero' bucket
 *    - Renders directly from Supabase CDN public URL
 *    - Lists existing bucket images for 1-click selection in Admin
 *
 * 3. General Image Engine (Cloudflare R2):
 *    - Compresses & streams photo catalog, projects, and portraits to Cloudflare R2
 *    - Renders directly from Cloudflare CDN domain
 *
 * 4. Zero Persistent Memory Storage:
 *    - Never stores binary or base64 data in localStorage / browser memory.
 *    - Only lightweight remote HTTPS URLs are stored in application state.
 * ============================================================================
 */

import { supabase, supabaseStorage, isSupabaseConfigured } from './supabaseClient.ts';

export interface CompressedImage {
  blob: Blob;
  width: number;
  height: number;
  sizeBytes: number;
  savingsPercent: number;
}

export interface UploadResult {
  url: string;
  width: number;
  height: number;
  sizeBytes: number;
  savingsPercent: number;
  storage: 'supabase' | 'cloudflare';
}

export interface BucketImageItem {
  name: string;
  url: string;
  sizeBytes: number;
  updatedAt: string;
}

/**
 * Clean, high-performance client-side WebP compression using HTML5 Canvas.
 * Proportionally resizes large camera photos down to web-optimized dimensions
 * and converts to modern WebP with zero pixelation or blocking artifacts.
 */
export async function compressImageToWebP(
  file: File,
  options?: {
    maxDimension?: number;
    quality?: number;
  }
): Promise<CompressedImage> {
  const maxDim = options?.maxDimension ?? 2048;
  const quality = options?.quality ?? 0.82;

  // 1. Load image into memory as ImageBitmap or Image element
  let source: ImageBitmap | HTMLImageElement;
  let srcWidth: number;
  let srcHeight: number;

  if (typeof createImageBitmap === 'function') {
    source = await createImageBitmap(file);
    srcWidth = source.width;
    srcHeight = source.height;
  } else {
    source = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
    srcWidth = source.width;
    srcHeight = source.height;
  }

  // 2. Calculate proportional dimensions preserving aspect ratio
  let targetWidth = srcWidth;
  let targetHeight = srcHeight;

  if (targetWidth > maxDim || targetHeight > maxDim) {
    if (targetWidth >= targetHeight) {
      targetHeight = Math.round((srcHeight * maxDim) / srcWidth);
      targetWidth = maxDim;
    } else {
      targetWidth = Math.round((srcWidth * maxDim) / srcHeight);
      targetHeight = maxDim;
    }
  }

  // 3. Render onto high-quality smoothing canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context is not available');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);

  // Free source bitmap memory immediately
  if ('close' in source && typeof source.close === 'function') {
    source.close();
  }

  // 4. Encode to modern WebP Blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error('Failed to encode image to WebP'));
      },
      'image/webp',
      quality
    );
  });

  const savingsPercent = Math.max(0, Math.round(((file.size - blob.size) / file.size) * 100));

  return {
    blob,
    width: targetWidth,
    height: targetHeight,
    sizeBytes: blob.size,
    savingsPercent,
  };
}

/**
 * Uploads a hero slider visual to the Supabase Storage 'hero' bucket.
 * Returns the permanent public CDN URL for high-speed delivery.
 */
export async function uploadHeroImageToSupabase(
  file: File,
  orientation: 'landscape' | 'portrait' = 'landscape',
  onProgress?: (percent: number, message: string) => void
): Promise<UploadResult> {
  onProgress?.(25, 'Compressing hero visual...');

  const maxDimension = orientation === 'portrait' ? 1920 : 2560;
  const compressed = await compressImageToWebP(file, {
    maxDimension,
    quality: 0.83,
  });

  onProgress?.(65, 'Uploading to Supabase Storage (hero bucket)...');

  const client = supabaseStorage || supabase;
  if (!client || !isSupabaseConfigured) {
    throw new Error('Supabase client is not configured. Please verify environment credentials.');
  }

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

  if (error || !data?.path) {
    const errorMsg = error?.message || 'Upload rejected';
    throw new Error(`Supabase hero upload rejected: "${errorMsg}".`);
  }

  const { data: urlData } = client.storage
    .from('hero')
    .getPublicUrl(data.path);

  onProgress?.(100, 'Uploaded to Supabase successfully!');

  return {
    url: urlData.publicUrl,
    width: compressed.width,
    height: compressed.height,
    sizeBytes: compressed.sizeBytes,
    savingsPercent: compressed.savingsPercent,
    storage: 'supabase',
  };
}

/**
 * Lists all existing uploaded images in the Supabase 'hero' bucket.
 * Enables 1-click selection of previously uploaded images in Admin Dashboard.
 */
export async function listHeroBucketImages(): Promise<BucketImageItem[]> {
  const client = supabaseStorage || supabase;
  if (!client || !isSupabaseConfigured) return [];

  try {
    const { data, error } = await client.storage
      .from('hero')
      .list('hero-slides', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error || !Array.isArray(data)) return [];

    return data
      .filter((item) => item.name && !item.name.startsWith('.'))
      .map((item) => {
        const { data: urlData } = client.storage
          .from('hero')
          .getPublicUrl(`hero-slides/${item.name}`);

        return {
          name: item.name,
          url: urlData.publicUrl,
          sizeBytes: item.metadata?.size || item.metadata?.contentLength || 0,
          updatedAt: item.updated_at || item.created_at || '',
        };
      });
  } catch (err) {
    console.warn('[ImageEngine] Unable to list hero bucket images:', err);
    return [];
  }
}

/**
 * Uploads catalog photos, project pictures, and portraits to Cloudflare R2 bucket.
 * Renders directly from the custom Cloudflare CDN domain (https://cdn.wrishu.com).
 */
export async function uploadImageToCloudflareR2(
  file: File,
  folder: string = 'catalog',
  onProgress?: (percent: number, message: string) => void
): Promise<UploadResult> {
  onProgress?.(25, 'Compressing image for Cloudflare CDN...');

  const compressed = await compressImageToWebP(file, {
    maxDimension: 1920,
    quality: 0.80,
  });

  onProgress?.(65, 'Uploading to Cloudflare R2...');

  const workerUrl = import.meta.env.VITE_WORKER_UPLOAD_URL;
  const cdnBase = import.meta.env.VITE_CLOUDFLARE_R2_CDN || 'https://cdn.wrishu.com';

  if (!workerUrl || workerUrl.includes('your-worker')) {
    throw new Error('Cloudflare R2 worker upload URL is not configured (VITE_WORKER_UPLOAD_URL).');
  }

  // Retrieve access token if logged in with Supabase Auth
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
      category: folder,
      fileName: file.name,
      contentType: 'image/webp',
      size: compressed.sizeBytes,
    }),
  });

  if (!signerRes.ok) {
    const errText = await signerRes.text();
    throw new Error(`Cloudflare signer error (${signerRes.status}): ${errText}`);
  }

  const signData = await signerRes.json();
  if (!signData.uploadUrl) {
    throw new Error('Cloudflare signer did not return an upload URL.');
  }

  // Upload binary WebP directly to presigned URL
  const uploadRes = await fetch(signData.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/webp' },
    body: compressed.blob,
  });

  if (!uploadRes.ok) {
    throw new Error(`Cloudflare R2 storage rejected upload (${uploadRes.status})`);
  }

  onProgress?.(100, 'Uploaded to Cloudflare successfully!');

  const publicUrl = signData.publicUrl || `${cdnBase}/${signData.key}`;

  return {
    url: publicUrl,
    width: compressed.width,
    height: compressed.height,
    sizeBytes: compressed.sizeBytes,
    savingsPercent: compressed.savingsPercent,
    storage: 'cloudflare',
  };
}

/**
 * Uploads cropped circular profile photo to Cloudflare R2 (with Supabase fallback).
 * Output is high quality WebP. Returns CDN URL with zero local memory storage.
 */
export async function uploadProfilePortraitImage(
  imageBlob: Blob,
  fileName: string = 'profile-portrait.webp',
  onProgress?: (percent: number, message: string) => void
): Promise<UploadResult> {
  const workerUrl = import.meta.env.VITE_WORKER_UPLOAD_URL;
  const isCloudflareReady = Boolean(
    workerUrl &&
    !workerUrl.includes('your-worker') &&
    workerUrl.startsWith('http')
  );

  const file = new File([imageBlob], fileName, { type: 'image/webp' });

  // 1. Try Cloudflare R2 if worker URL is provided
  if (isCloudflareReady) {
    try {
      return await uploadImageToCloudflareR2(file, 'profile', onProgress);
    } catch (cfErr) {
      console.warn('[ImageEngine] Cloudflare upload failed, attempting Supabase bucket fallback:', cfErr);
    }
  }

  // 2. Upload to Supabase bucket
  onProgress?.(40, 'Uploading profile photo to storage...');
  const client = supabaseStorage || supabase;
  if (!client || !isSupabaseConfigured) {
    throw new Error('Storage client is not configured.');
  }

  const cleanName = fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filePath = `profile-photos/portrait-${Date.now()}-${cleanName}.webp`;

  const { data, error } = await client.storage
    .from('hero')
    .upload(filePath, imageBlob, {
      contentType: 'image/webp',
      upsert: true,
      cacheControl: '31536000',
    });

  if (error || !data?.path) {
    throw new Error(`Profile upload rejected: ${error?.message || 'Upload failed'}`);
  }

  const { data: urlData } = client.storage.from('hero').getPublicUrl(data.path);

  onProgress?.(100, 'Profile image uploaded successfully!');

  return {
    url: urlData.publicUrl,
    width: 800,
    height: 800,
    sizeBytes: imageBlob.size,
    savingsPercent: 0,
    storage: 'supabase',
  };
}

