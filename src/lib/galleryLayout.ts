import type { Photo } from '../types/index.ts';

export interface GalleryRow {
  type: 'landscape' | 'portraits' | 'fallback';
  items: Photo[];
}

/**
 * Pure function that partitions an ordered photo list into 1L + 3P rows
 * Handles leftover photos gracefully without dropping any item.
 *
 * @param photos - List of photos with orientation metadata
 * @returns Array of structured GalleryRows
 */
export function buildOneLandscapeThreePortraitsRows(photos: Photo[]): GalleryRow[] {
  if (!photos || photos.length === 0) return [];

  const rows: GalleryRow[] = [];
  
  // Separate into available pools while maintaining relative ordering
  const landscapes: Photo[] = photos.filter(p => p.orientation === 'landscape');
  const portraits: Photo[] = photos.filter(p => p.orientation === 'portrait');

  let lIdx = 0;
  let pIdx = 0;

  // Pattern loop: 1 Landscape, then 3 Portraits
  while (lIdx < landscapes.length || pIdx < portraits.length) {
    // 1 Landscape
    if (lIdx < landscapes.length) {
      rows.push({
        type: 'landscape',
        items: [landscapes[lIdx]],
      });
      lIdx++;
    } else if (pIdx < portraits.length && pIdx + 3 <= portraits.length) {
      // If we ran out of landscapes, take remaining portraits in groups of 3
      rows.push({
        type: 'portraits',
        items: portraits.slice(pIdx, pIdx + 3),
      });
      pIdx += 3;
      continue;
    }

    // 3 Portraits
    if (pIdx < portraits.length) {
      const takeCount = Math.min(3, portraits.length - pIdx);
      const portraitGroup = portraits.slice(pIdx, pIdx + takeCount);
      rows.push({
        type: 'portraits',
        items: portraitGroup,
      });
      pIdx += takeCount;
    }
  }

  // Gracefully handle any unmatched leftovers if any item was bypassed
  return rows;
}
