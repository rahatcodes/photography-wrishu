import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type {
  Photo,
  HeroSlide,
  Project,
  StatItem,
  SiteSettings,
  ContactMessage,
  Category,
  AdminProfile,
} from '../types/index.ts';
import {
  INITIAL_CATEGORIES,
  INITIAL_HERO_SLIDES,
  INITIAL_PHOTOS,
  INITIAL_PROJECTS,
  INITIAL_SETTINGS,
  INITIAL_STATS,
} from './mockData.ts';
import { supabase, isSupabaseConfigured } from './supabaseClient.ts';

interface DataContextType {
  categories: Category[];
  heroSlides: HeroSlide[];
  photos: Photo[];
  projects: Project[];
  stats: StatItem[];
  settings: SiteSettings;
  messages: ContactMessage[];
  adminUser: AdminProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  cloudSyncStatus: 'synced' | 'syncing' | 'error' | 'local_only' | 'idle';
  cloudSyncError?: string;
  syncHeroSlidesToCloud: (slides?: HeroSlide[]) => Promise<{ success: boolean; error?: string }>;
  photoSyncStatus: 'synced' | 'syncing' | 'error' | 'local_only' | 'idle';
  photoSyncError?: string;
  syncPhotosToCloud: (photos?: Photo[]) => Promise<{ success: boolean; error?: string }>;
  reorderPhotos: (newPhotos: Photo[]) => void;
  syncSettingsToCloud: (newSettings?: Partial<SiteSettings>) => Promise<{ success: boolean; error?: string }>;
  loginAdmin: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logoutAdmin: () => Promise<void>;
  updateSettings: (newSettings: Partial<SiteSettings>) => void;
  addPhoto: (photo: Photo) => void;
  updatePhoto: (id: string, updates: Partial<Photo>) => void;
  deletePhoto: (id: string) => void;
  updateHeroSlide: (id: string, updates: Partial<HeroSlide>) => void;
  addHeroSlide: (slide: HeroSlide) => void;
  deleteHeroSlide: (id: string) => void;
  reorderHeroSlides: (newSlides: HeroSlide[]) => void;
  updateStats: (newStats: StatItem[]) => void;
  projectSyncStatus: 'synced' | 'syncing' | 'error' | 'local_only' | 'idle';
  projectSyncError?: string;
  syncProjectsToCloud: (projects?: Project[]) => Promise<{ success: boolean; error?: string }>;
  checkSlugAvailability: (slug: string, currentProjectId?: string) => Promise<{ available: boolean; suggestedSlug: string }>;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  submitMessage: (name: string, email: string, message: string) => Promise<boolean>;
  markMessageRead: (id: string) => void;
  deleteMessage: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PHOTOS: 'wrishu_photos_v1',
  HERO: 'wrishu_hero_slides_v1',
  PROJECTS: 'wrishu_projects_v1',
  STATS: 'wrishu_stats_v1',
  SETTINGS: 'wrishu_settings_v1',
  MESSAGES: 'wrishu_messages_v1',
  ADMIN: 'wrishu_admin_session_v1',
};

// Safe localStorage write wrapper that prevents QuotaExceededError from crashing React root
function safeSetLocalStorage(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.warn(`[LocalStorage] Failed to save key "${key}" (quota or permission):`, err);
    return false;
  }
}

// Strip oversized base64 data URLs to protect browser storage quota (< 5MB limit)
function sanitizeSlideForStorage(slide: HeroSlide): HeroSlide {
  const isBase64 = (url?: string) => Boolean(url && url.startsWith('data:image/') && url.length > 500);
  return {
    ...slide,
    image_url: isBase64(slide.image_url) ? '' : slide.image_url,
    landscape_url: isBase64(slide.landscape_url) ? '' : slide.landscape_url,
    portrait_url: isBase64(slide.portrait_url) ? '' : slide.portrait_url,
  };
}

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [categories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HERO);
    if (saved) {
      try {
        const parsed: HeroSlide[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasValidUrls = parsed.some(
            (s) => Boolean(s.image_url && s.image_url.startsWith('http')) ||
                   Boolean(s.landscape_url && s.landscape_url.startsWith('http')) ||
                   Boolean(s.portrait_url && s.portrait_url.startsWith('http'))
          );

          if (hasValidUrls) {
            return parsed
              .map((s) => {
                const sanitized = sanitizeSlideForStorage(s);
                return {
                  ...sanitized,
                  target: sanitized.target || 'landscape',
                  image_url: sanitized.image_url || sanitized.landscape_url || sanitized.portrait_url || '',
                };
              })
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          }
        }
      } catch {
        return INITIAL_HERO_SLIDES;
      }
    }
    return INITIAL_HERO_SLIDES;
  });
  const [photos, setPhotos] = useState<Photo[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PHOTOS);
    return saved ? JSON.parse(saved) : INITIAL_PHOTOS;
  });
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });
  const [stats, setStats] = useState<StatItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STATS);
    return saved ? JSON.parse(saved) : INITIAL_STATS;
  });
  const [settings, setSettings] = useState<SiteSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });
  const [messages, setMessages] = useState<ContactMessage[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    return saved ? JSON.parse(saved) : [
      {
        id: 'msg-demo-1',
        name: 'FIFA Media Coordinator',
        email: 'media@fifa-regional.org',
        message: 'Dear Navid, we were thoroughly impressed with your match coverage in Dhaka. Inquiring for accreditation on the upcoming AFC preliminary matches.',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        read: false,
      },
      {
        id: 'msg-demo-2',
        name: 'Rahim Chowdhury',
        email: 'rahim.c@gmail.com',
        message: 'Inquiring about limited edition prints of the Old Dhaka monsoon street series.',
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        read: true,
      }
    ];
  });
  const [adminUser, setAdminUser] = useState<AdminProfile | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ADMIN);
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      if (parsed?.id === 'admin-local-1' || parsed?.id === 'demo-admin') {
        localStorage.removeItem(STORAGE_KEYS.ADMIN);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'local_only' | 'idle'>('idle');
  const [cloudSyncError, setCloudSyncError] = useState<string | undefined>(undefined);
  const [photoSyncStatus, setPhotoSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'local_only' | 'idle'>('idle');
  const [photoSyncError, setPhotoSyncError] = useState<string | undefined>(undefined);
  const [projectSyncStatus, setProjectSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'local_only' | 'idle'>('idle');
  const [projectSyncError, setProjectSyncError] = useState<string | undefined>(undefined);

  // Sync to local storage for persistence across reloads using safeSetLocalStorage
  useEffect(() => {
    safeSetLocalStorage(STORAGE_KEYS.PHOTOS, JSON.stringify(photos));
  }, [photos]);

  useEffect(() => {
    // Sanitize before saving: never save megabytes of base64 data to localStorage
    const cleanSlides = heroSlides.map(sanitizeSlideForStorage);
    safeSetLocalStorage(STORAGE_KEYS.HERO, JSON.stringify(cleanSlides));
  }, [heroSlides]);

  useEffect(() => {
    safeSetLocalStorage(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    safeSetLocalStorage(STORAGE_KEYS.STATS, JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    safeSetLocalStorage(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    safeSetLocalStorage(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (adminUser) {
      safeSetLocalStorage(STORAGE_KEYS.ADMIN, JSON.stringify(adminUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.ADMIN);
    }
  }, [adminUser]);

  // Load hero slides from Supabase cloud database on startup so ALL devices & visitors see updated slides
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) return;

    let isMounted = true;
    const fetchCloudHeroSlides = async () => {
      try {
        const { data, error } = await supabase
          .from('hero_slides')
          .select('*')
          .order('order_index', { ascending: true });

        if (!error && Array.isArray(data)) {
          const validRows = data.filter((row: any) =>
            Boolean(
              (row.image_url && String(row.image_url).startsWith('http')) ||
              (row.landscape_url && String(row.landscape_url).startsWith('http')) ||
              (row.portrait_url && String(row.portrait_url).startsWith('http'))
            )
          );

          if (validRows.length > 0) {
            const mapped: HeroSlide[] = validRows.map((row: any) => {
              const target = (row.target as HeroSlide['target']) ||
                (row.portrait_url && !row.landscape_url ? 'portrait' : 'landscape');
              const image_url = row.image_url ||
                (target === 'portrait' ? row.portrait_url : row.landscape_url) ||
                row.landscape_url ||
                row.portrait_url ||
                '';
              return {
                id: row.id,
                title: row.title || '',
                subtitle: row.subtitle || '',
                cta_label: row.cta_label || '',
                cta_url: row.cta_url || '',
                target,
                image_url,
                landscape_url: row.landscape_url || (target === 'landscape' ? image_url : ''),
                portrait_url: row.portrait_url || (target === 'portrait' ? image_url : ''),
                order: row.order_index ?? 1,
                active: row.active ?? true,
              };
            });

            if (isMounted) {
              setHeroSlides(mapped);
              safeSetLocalStorage(STORAGE_KEYS.HERO, JSON.stringify(mapped));
              setCloudSyncStatus('synced');
            }
          } else {
            // Cloud has 0 slides. If local storage already has slides, mark as local_only
            const localSaved = localStorage.getItem(STORAGE_KEYS.HERO);
            if (localSaved && isMounted) {
              setCloudSyncStatus('local_only');
            }
          }
        }
      } catch (err) {
        console.warn('[DataContext] Failed to fetch cloud hero slides:', err);
      }
    };

    fetchCloudHeroSlides();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save/Publish hero slides to Supabase cloud database
  const syncHeroSlidesToCloud = async (slidesToSync?: HeroSlide[]): Promise<{ success: boolean; error?: string }> => {
    const targetSlides = slidesToSync || heroSlides;
    if (!supabase || !isSupabaseConfigured) {
      setCloudSyncStatus('local_only');
      return { success: false, error: 'Supabase client is not configured' };
    }

    setCloudSyncStatus('syncing');
    setCloudSyncError(undefined);

    try {
      const rows = targetSlides.map((s, idx) => {
        const isMob = s.target === 'portrait' || (s.portrait_url && !s.landscape_url);
        const lUrl = isMob ? (s.landscape_url || '') : (s.image_url || s.landscape_url || '');
        const pUrl = isMob ? (s.image_url || s.portrait_url || '') : (s.portrait_url || '');

        return {
          id: s.id,
          title: s.title || '',
          subtitle: s.subtitle || '',
          cta_label: s.cta_label || '',
          cta_url: s.cta_url || '',
          landscape_url: lUrl,
          portrait_url: pUrl,
          order_index: s.order ?? idx + 1,
          active: s.active ?? true,
        };
      });

      // Try full upsert with target and image_url first
      const fullRows = rows.map((r, idx) => ({
        ...r,
        target: targetSlides[idx].target || 'landscape',
        image_url: targetSlides[idx].image_url || (targetSlides[idx].target === 'portrait' ? targetSlides[idx].portrait_url : targetSlides[idx].landscape_url) || '',
      }));

      let { error } = await supabase.from('hero_slides').upsert(fullRows);
      if (error && error.code === 'PGRST204') {
        // Table doesn't have target/image_url columns yet, fallback to base columns
        const res = await supabase.from('hero_slides').upsert(rows);
        error = res.error;
      }

      if (error) {
        console.error('[DataContext] Failed to sync hero slides to Supabase:', error);
        setCloudSyncStatus('error');
        setCloudSyncError(error.message);
        return { success: false, error: error.message };
      }

      // Delete any removed slides in Supabase that are no longer in targetSlides
      const currentIds = targetSlides.map((s) => s.id);
      if (currentIds.length > 0) {
        const { data: cloudRows } = await supabase.from('hero_slides').select('id');
        if (Array.isArray(cloudRows)) {
          const idsToDelete = cloudRows.map((r) => r.id).filter((id) => !currentIds.includes(id));
          if (idsToDelete.length > 0) {
            await supabase.from('hero_slides').delete().in('id', idsToDelete);
          }
        }
      }

      setCloudSyncStatus('synced');
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      console.error('[DataContext] Cloud sync exception:', err);
      setCloudSyncStatus('error');
      setCloudSyncError(msg);
      return { success: false, error: msg };
    }
  };

  // Load photos from Supabase cloud database on startup so ALL devices & visitors see updated photos
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) return;

    let isMounted = true;
    const fetchCloudPhotos = async () => {
      try {
        const { data, error } = await supabase
          .from('photos')
          .select('*')
          .order('order_index', { ascending: true });

        if (!error && Array.isArray(data)) {
          const validRows = data.filter((row: any) => Boolean(row.url && String(row.url).startsWith('http')));

          if (validRows.length > 0) {
            const mapped: Photo[] = validRows.map((row: any) => ({
              id: row.id,
              category_id: row.category_id || 'sports',
              project_id: row.project_id || null,
              url: row.url,
              variants: (row.variants && typeof row.variants === 'object') ? row.variants : {},
              width: Number(row.width) || 1920,
              height: Number(row.height) || 1080,
              orientation: (row.orientation === 'portrait' ? 'portrait' : 'landscape') as Orientation,
              lqip: row.lqip || undefined,
              alt: row.alt || '',
              title: row.title || '',
              order: Number(row.order_index) || 1,
              featured: Boolean(row.featured),
              home_gallery: Boolean(row.home_gallery),
              created_at: row.created_at || new Date().toISOString(),
            }));

            if (isMounted) {
              setPhotos(mapped);
              safeSetLocalStorage(STORAGE_KEYS.PHOTOS, JSON.stringify(mapped));
              setPhotoSyncStatus('synced');
            }
          } else {
            // Cloud has 0 photos. If local storage already has photos, mark as local_only
            const localSaved = localStorage.getItem(STORAGE_KEYS.PHOTOS);
            if (localSaved && isMounted) {
              setPhotoSyncStatus('local_only');
            }
          }
        } else if (error) {
          console.warn('[DataContext] Supabase photos query notice:', error.message);
        }
      } catch (err) {
        console.warn('[DataContext] Failed to fetch cloud photos:', err);
      }
    };

    fetchCloudPhotos();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save/Publish photos to Supabase cloud database
  const syncPhotosToCloud = async (photosToSync?: Photo[]): Promise<{ success: boolean; error?: string }> => {
    const targetPhotos = photosToSync || photos;
    if (!supabase || !isSupabaseConfigured) {
      setPhotoSyncStatus('local_only');
      return { success: false, error: 'Supabase client is not configured' };
    }

    setPhotoSyncStatus('syncing');
    setPhotoSyncError(undefined);

    try {
      // 1. Ensure categories exist in Supabase first so foreign key constraint (photos.category_id -> categories.slug) does not fail
      const initialCatRows = [
        { id: 'cat-sports', title: 'Sports Photography', slug: 'sports', order_index: 1 },
        { id: 'cat-street', title: 'Street Photography', slug: 'street', order_index: 2 },
        { id: 'cat-nature', title: 'Nature Photography', slug: 'nature', order_index: 3 },
        { id: 'cat-wildlife', title: 'Wildlife', slug: 'wildlife', order_index: 4 },
      ];
      await supabase.from('categories').upsert(initialCatRows, { onConflict: 'slug' });

      // 2. Prepare photo rows
      if (targetPhotos.length > 0) {
        const rows = targetPhotos.map((p, idx) => ({
          id: p.id,
          category_id: p.category_id || 'sports',
          project_id: p.project_id || null,
          url: p.url,
          variants: p.variants || {},
          width: Math.round(Number(p.width)) || 1920,
          height: Math.round(Number(p.height)) || 1080,
          orientation: p.orientation === 'portrait' ? 'portrait' : 'landscape',
          lqip: p.lqip || null,
          alt: p.alt || '',
          title: p.title || '',
          order_index: Number(p.order) || (idx + 1),
          featured: Boolean(p.featured),
          home_gallery: Boolean(p.home_gallery),
          created_at: p.created_at || new Date().toISOString(),
        }));

        const { error: upsertErr } = await supabase.from('photos').upsert(rows);
        if (upsertErr) {
          console.error('[DataContext] Failed to sync photos to Supabase:', upsertErr);
          setPhotoSyncStatus('error');
          setPhotoSyncError(upsertErr.message);
          return { success: false, error: upsertErr.message };
        }

        // 3. Delete photos from Supabase that were deleted locally
        const currentIds = targetPhotos.map((p) => p.id);
        const { data: cloudRows } = await supabase.from('photos').select('id');
        if (Array.isArray(cloudRows)) {
          const idsToDelete = cloudRows.map((r: any) => r.id).filter((id: string) => !currentIds.includes(id));
          if (idsToDelete.length > 0) {
            await supabase.from('photos').delete().in('id', idsToDelete);
          }
        }
      } else {
        // If targetPhotos is empty (all photos deleted)
        await supabase.from('photos').delete().neq('id', '__keep_none__');
      }

      setPhotoSyncStatus('synced');
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Photo sync failed';
      console.error('[DataContext] Photo sync exception:', err);
      setPhotoSyncStatus('error');
      setPhotoSyncError(msg);
      return { success: false, error: msg };
    }
  };

  // Load projects from Supabase on startup so ALL devices & visitors see updated projects
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) return;
    let isMounted = true;

    const fetchCloudProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('order_index', { ascending: true });

        if (!error && Array.isArray(data)) {
          if (data.length > 0) {
            const mapped: Project[] = data.map((row: any) => ({
              id: row.id,
              title: row.title || 'Untitled Project',
              slug: row.slug,
              featured_image_url: row.featured_image_url || '',
              description: row.description || '',
              order: Number(row.order_index) || 1,
              photos_count: Number(row.photos_count) || 0,
              gallery_images: Array.isArray(row.gallery_images) ? row.gallery_images : [],
            }));

            if (isMounted) {
              setProjects(mapped);
              safeSetLocalStorage(STORAGE_KEYS.PROJECTS, JSON.stringify(mapped));
              setProjectSyncStatus('synced');
            }
          } else {
            // Cloud has 0 projects, check local storage
            const localSaved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
            if (localSaved && isMounted) {
              setProjectSyncStatus('local_only');
            }
          }
        } else if (error) {
          console.warn('[DataContext] Supabase projects query notice:', error.message);
        }
      } catch (err) {
        console.warn('[DataContext] Failed to fetch cloud projects:', err);
      }
    };

    fetchCloudProjects();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save/Publish projects to Supabase cloud database
  const syncProjectsToCloud = async (projectsToSync?: Project[]): Promise<{ success: boolean; error?: string }> => {
    const targetProjects = projectsToSync || projects;
    if (!supabase || !isSupabaseConfigured) {
      setProjectSyncStatus('local_only');
      return { success: false, error: 'Supabase client is not configured' };
    }

    setProjectSyncStatus('syncing');
    try {
      if (targetProjects.length > 0) {
        const rows = targetProjects.map((p, idx) => ({
          id: p.id,
          title: p.title || 'Untitled Project',
          slug: p.slug,
          featured_image_url: p.featured_image_url || '',
          description: p.description || '',
          order_index: Number(p.order) || (idx + 1),
          photos_count: Number(p.photos_count) || 0,
        }));

        const { error: upsertErr } = await supabase.from('projects').upsert(rows);
        if (upsertErr) {
          console.error('[DataContext] Failed to sync projects to Supabase:', upsertErr);
          setProjectSyncStatus('error');
          setProjectSyncError(upsertErr.message);
          return { success: false, error: upsertErr.message };
        }

        // Delete projects from Supabase that were deleted locally
        const currentIds = targetProjects.map((p) => p.id);
        const { data: cloudRows } = await supabase.from('projects').select('id');
        if (Array.isArray(cloudRows)) {
          const idsToDelete = cloudRows.map((r: any) => r.id).filter((id: string) => !currentIds.includes(id));
          if (idsToDelete.length > 0) {
            await supabase.from('projects').delete().in('id', idsToDelete);
          }
        }
      } else {
        await supabase.from('projects').delete().neq('id', '__keep_none__');
      }

      setProjectSyncStatus('synced');
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Project sync failed';
      console.error('[DataContext] Project sync exception:', err);
      setProjectSyncStatus('error');
      setProjectSyncError(msg);
      return { success: false, error: msg };
    }
  };

  // Check database and local state for duplicate slugs, returning unique candidate
  const checkSlugAvailability = async (
    candidateSlug: string,
    currentProjectId?: string
  ): Promise<{ available: boolean; suggestedSlug: string }> => {
    const cleanSlug = candidateSlug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '') || 'project';

    // 1. Check local projects first
    const localConflict = projects.some(
      (p) => p.slug === cleanSlug && p.id !== currentProjectId
    );

    let isTaken = localConflict;

    // 2. Query Supabase directly
    if (!isTaken && supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, slug')
          .eq('slug', cleanSlug);

        if (!error && Array.isArray(data)) {
          isTaken = data.some((row: any) => row.id !== currentProjectId);
        }
      } catch {
        // Fall back to local check
      }
    }

    if (!isTaken) {
      return { available: true, suggestedSlug: cleanSlug };
    }

    // Generate unique suggestion by incrementing suffix
    let counter = 1;
    let suggested = `${cleanSlug}-${counter}`;
    while (projects.some((p) => p.slug === suggested && p.id !== currentProjectId)) {
      counter += 1;
      suggested = `${cleanSlug}-${counter}`;
    }

    return { available: false, suggestedSlug: suggested };
  };

  // Load site_settings from Supabase on startup so ALL devices & visitors see updated profile image and settings
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) return;
    let isMounted = true;

    const fetchCloudSettings = async () => {
      try {
        const { data, error } = await supabase.from('site_settings').select('*').limit(1).maybeSingle();

        // 1. Check if this browser has an uploaded portrait URL in local storage
        let localPortrait = '';
        const localSavedRaw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (localSavedRaw) {
          try {
            const parsed = JSON.parse(localSavedRaw);
            if (parsed?.about_portrait_url && String(parsed.about_portrait_url).startsWith('http')) {
              localPortrait = String(parsed.about_portrait_url);
            }
          } catch {}
        }

        if (!error && data && isMounted) {
          const cloudPortrait = data.about_portrait_url && String(data.about_portrait_url).startsWith('http')
            ? String(data.about_portrait_url)
            : '';
          const finalPortrait = cloudPortrait || localPortrait;

          setSettings(prev => ({
            ...prev,
            ...data,
            about_portrait_url: finalPortrait || prev.about_portrait_url,
            about_paragraphs: Array.isArray(data.about_paragraphs) && data.about_paragraphs.length > 0
              ? data.about_paragraphs
              : prev.about_paragraphs,
            social_links: (data.social_links && typeof data.social_links === 'object')
              ? data.social_links
              : prev.social_links,
          }));

          // If local storage has a profile picture that the database didn't have, auto-sync it to Supabase!
          if (localPortrait && !cloudPortrait) {
            supabase.from('site_settings').upsert([{
              ...data,
              id: 'default',
              about_portrait_url: localPortrait,
              updated_at: new Date().toISOString(),
            }]).then(({ error: syncErr }) => {
              if (!syncErr) {
                console.log('[DataContext] Successfully auto-synced local profile portrait to Supabase!');
              }
            });
          }
        } else if (!data && localPortrait) {
          // Cloud has 0 rows, but local storage has a profile picture: push it to Supabase!
          supabase.from('site_settings').upsert([{
            id: 'default',
            about_portrait_url: localPortrait,
            updated_at: new Date().toISOString(),
          }]);
        }
      } catch (err) {
        console.warn('[DataContext] Failed to fetch site_settings:', err);
      }
    };

    fetchCloudSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync site_settings to Supabase
  const syncSettingsToCloud = async (newSettings?: Partial<SiteSettings>): Promise<{ success: boolean; error?: string }> => {
    if (!supabase || !isSupabaseConfigured) return { success: false, error: 'Supabase client not configured' };
    try {
      const current = { ...settings, ...newSettings };
      const toSave = {
        id: 'default',
        logo_top: current.logo_top || 'NAVID MUSTASIM',
        logo_bottom: current.logo_bottom || 'WRISHU',
        about_label: current.about_label || 'ABOUT ME',
        about_name: current.about_name || 'My name is Navid Mustasim',
        about_name_gold: current.about_name_gold || 'Wrishu',
        about_roles: current.about_roles || 'Photographer | Traveler | Educator | Entrepreneur',
        about_paragraphs: Array.isArray(current.about_paragraphs) ? current.about_paragraphs : [],
        about_portrait_url: current.about_portrait_url || null,
        contact_quote: current.contact_quote || null,
        contact_bio: current.contact_bio || null,
        contact_phone: current.contact_phone || '+880-1686-867-747',
        contact_email: current.contact_email || 'n.m.wrishu@gmail.com',
        contact_location: current.contact_location || 'Kallyanpur, Dhaka',
        map_query: current.map_query || 'Kallyanpur, Dhaka, Bangladesh',
        footer_quote: current.footer_quote || null,
        copyright: current.copyright || 'Copyright © 2026 Eruditech. All Rights Reserved.',
        social_links: current.social_links || { instagram: 'https://instagram.com' },
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('site_settings').upsert([toSave]);
      if (error) {
        console.warn('[DataContext] Failed to sync site_settings:', error.message);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Settings sync failed' };
    }
  };

  // Check Supabase Auth session on startup and listen for auth state changes
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!error && session?.user) {
        setAdminUser({
          id: session.user.id,
          email: session.user.email || '',
          role: 'admin',
        });
      } else {
        setAdminUser(null);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setAdminUser({
          id: session.user.id,
          email: session.user.email || '',
          role: 'admin',
        });
      } else if (event === 'SIGNED_OUT') {
        setAdminUser(null);
        localStorage.removeItem(STORAGE_KEYS.ADMIN);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loginAdmin = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      if (!supabase || !isSupabaseConfigured) {
        setIsLoading(false);
        return { success: false, error: 'Authentication service is not configured.' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });

      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      if (data?.user) {
        setAdminUser({
          id: data.user.id,
          email: data.user.email || email.trim(),
          role: 'admin',
        });
        setIsLoading(false);
        return { success: true };
      }

      setIsLoading(false);
      return { success: false, error: 'Invalid administrator email or password.' };
    } catch (err: unknown) {
      setIsLoading(false);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Authentication failed.',
      };
    }
  };

  const logoutAdmin = async () => {
    if (supabase && isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setAdminUser(null);
    localStorage.removeItem(STORAGE_KEYS.ADMIN);
  };

  const updateSettings = (newSettings: Partial<SiteSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...newSettings };
      syncSettingsToCloud(newSettings);
      return next;
    });
  };

  const addPhoto = (photo: Photo) => {
    setPhotos(prev => {
      const next = [photo, ...prev];
      syncPhotosToCloud(next);
      return next;
    });
  };

  const updatePhoto = (id: string, updates: Partial<Photo>) => {
    setPhotos(prev => {
      const next = prev.map(p => (p.id === id ? { ...p, ...updates } : p));
      syncPhotosToCloud(next);
      return next;
    });
  };

  const deletePhoto = (id: string) => {
    setPhotos(prev => {
      const next = prev.filter(p => p.id !== id);
      syncPhotosToCloud(next);
      return next;
    });
  };

  const reorderPhotos = (newPhotos: Photo[]) => {
    setPhotos(newPhotos);
    safeSetLocalStorage(STORAGE_KEYS.PHOTOS, JSON.stringify(newPhotos));
    syncPhotosToCloud(newPhotos);
  };

  const updateHeroSlide = (id: string, updates: Partial<HeroSlide>) => {
    setHeroSlides(prev => {
      const next = prev.map(s => (s.id === id ? { ...s, ...updates } : s));
      syncHeroSlidesToCloud(next);
      return next;
    });
  };

  const addHeroSlide = (slide: HeroSlide) => {
    setHeroSlides(prev => {
      const next = [...prev, slide];
      syncHeroSlidesToCloud(next);
      return next;
    });
  };

  const deleteHeroSlide = (id: string) => {
    setHeroSlides(prev => {
      const next = prev.filter(s => s.id !== id);
      syncHeroSlidesToCloud(next);
      return next;
    });
  };

  const reorderHeroSlides = (newSlides: HeroSlide[]) => {
    setHeroSlides(newSlides);
    safeSetLocalStorage(STORAGE_KEYS.HERO, JSON.stringify(newSlides.map(sanitizeSlideForStorage)));
    syncHeroSlidesToCloud(newSlides);
  };

  const updateStats = (newStats: StatItem[]) => {
    setStats(newStats);
  };

  const addProject = (project: Project) => {
    setProjects((prev) => {
      const next = [...prev, project];
      safeSetLocalStorage(STORAGE_KEYS.PROJECTS, JSON.stringify(next));
      syncProjectsToCloud(next);
      return next;
    });
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects((prev) => {
      const next = prev.map((proj) => (proj.id === id ? { ...proj, ...updates } : proj));
      safeSetLocalStorage(STORAGE_KEYS.PROJECTS, JSON.stringify(next));
      syncProjectsToCloud(next);
      return next;
    });
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => {
      const next = prev.filter((proj) => proj.id !== id);
      safeSetLocalStorage(STORAGE_KEYS.PROJECTS, JSON.stringify(next));
      syncProjectsToCloud(next);
      return next;
    });
  };

  const submitMessage = async (name: string, email: string, message: string): Promise<boolean> => {
    const newMsg: ContactMessage = {
      id: `msg-${Date.now()}`,
      name,
      email,
      message,
      created_at: new Date().toISOString(),
      read: false,
    };
    setMessages(prev => [newMsg, ...prev]);
    return true;
  };

  const markMessageRead = (id: string) => {
    setMessages(prev => prev.map(m => (m.id === id ? { ...m, read: true } : m)));
  };

  const deleteMessage = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  return (
    <DataContext.Provider
      value={{
        categories,
        heroSlides,
        photos,
        projects,
        stats,
        settings,
        messages,
        adminUser,
        isAdmin: adminUser?.role === 'admin',
        isLoading,
        cloudSyncStatus,
        cloudSyncError,
        syncHeroSlidesToCloud,
        photoSyncStatus,
        photoSyncError,
        syncPhotosToCloud,
        reorderPhotos,
        syncSettingsToCloud,
        loginAdmin,
        logoutAdmin,
        updateSettings,
        addPhoto,
        updatePhoto,
        deletePhoto,
        updateHeroSlide,
        addHeroSlide,
        deleteHeroSlide,
        reorderHeroSlides,
        updateStats,
        projectSyncStatus,
        projectSyncError,
        syncProjectsToCloud,
        checkSlugAvailability,
        addProject,
        updateProject,
        deleteProject,
        submitMessage,
        markMessageRead,
        deleteMessage,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export function useData(): DataContextType {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
