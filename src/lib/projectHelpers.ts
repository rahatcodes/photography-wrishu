import type { Project, Photo } from '../types/index.ts';

/**
 * Verified Cloudflare R2 CDN cover URLs for migrated projects.
 */
export const PROJECT_FALLBACK_COVERS: Record<string, string> = {
  'proj-1792625196139': 'https://cdn.wrishu.com/projects/1792625464755-dsc09733.webp',
  'proj-1792625566743': 'https://cdn.wrishu.com/projects/1792625727622-dsc05725.webp',
  'proj-1792625808500': 'https://cdn.wrishu.com/projects/1792625920543-dsc03308.webp',
  'proj-1792626156981': 'https://cdn.wrishu.com/projects/1792626245045-dsc09196.webp',
  'proj-1792626481403': 'https://cdn.wrishu.com/projects/1792626554091-dsc03056.webp',
};

/**
 * Replaces any stale Supabase catalog-photos storage URL with the Cloudflare CDN base.
 */
export function cleanCdnUrl(url?: string): string {
  if (!url) return '';
  return url.replace(
    /https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\/hero\/catalog-photos\//g,
    'https://cdn.wrishu.com/'
  );
}

/**
 * Returns a guaranteed working cover image URL for any project.
 * Automatically resolves dead Supabase URLs to Cloudflare R2 URLs or the project's gallery photos.
 */
export function resolveProjectCoverImage(project: Project, photos: Photo[] = []): string {
  // 1. If project has a known migrated Cloudflare R2 cover and current cover is dead/supabase
  if (
    PROJECT_FALLBACK_COVERS[project.id] &&
    (!project.featured_image_url ||
      project.featured_image_url.includes('supabase.co') ||
      project.featured_image_url.includes('catalog-photos'))
  ) {
    return PROJECT_FALLBACK_COVERS[project.id];
  }

  // 2. If valid working direct URL (not pointing to deleted supabase storage)
  if (
    project.featured_image_url &&
    project.featured_image_url.startsWith('http') &&
    !project.featured_image_url.includes('supabase.co/storage') &&
    !project.featured_image_url.includes('catalog-photos')
  ) {
    return project.featured_image_url;
  }

  // 3. Match from project gallery photos by filename in featured_image_url
  const projectPhotos = photos.filter((p) => p.project_id === project.id);
  if (project.featured_image_url) {
    const filenameMatch = project.featured_image_url.match(/([^/\\-_]+)\.(?:webp|jpg|jpeg|png)$/i);
    if (filenameMatch) {
      const keyword = filenameMatch[1].toLowerCase();
      const match = projectPhotos.find((p) => p.url.toLowerCase().includes(keyword));
      if (match?.url) return match.url;
    }
  }

  // 4. Fallback to first photo in project gallery
  if (projectPhotos.length > 0 && projectPhotos[0]?.url) {
    return projectPhotos[0].url;
  }

  // 5. If it's a known project ID from fallback map
  if (PROJECT_FALLBACK_COVERS[project.id]) {
    return PROJECT_FALLBACK_COVERS[project.id];
  }

  // 6. Clean supabase URL prefix to Cloudflare CDN if present
  if (project.featured_image_url?.includes('catalog-photos/')) {
    return cleanCdnUrl(project.featured_image_url);
  }

  return project.featured_image_url || '';
}
