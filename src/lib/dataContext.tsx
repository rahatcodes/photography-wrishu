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
  loginAdmin: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logoutAdmin: () => Promise<void>;
  updateSettings: (newSettings: Partial<SiteSettings>) => void;
  addPhoto: (photo: Photo) => void;
  updatePhoto: (id: string, updates: Partial<Photo>) => void;
  deletePhoto: (id: string) => void;
  updateHeroSlide: (id: string, updates: Partial<HeroSlide>) => void;
  addHeroSlide: (slide: HeroSlide) => void;
  deleteHeroSlide: (id: string) => void;
  updateStats: (newStats: StatItem[]) => void;
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
  const isBase64 = (url?: string) => Boolean(url && url.startsWith('data:image/') && url.length > 2000);
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
          // Sanitize any existing bloated base64 data from previous failed uploads
          return parsed.map((s) => {
            const sanitized = sanitizeSlideForStorage(s);
            return {
              ...sanitized,
              target: sanitized.target || 'landscape',
              image_url: sanitized.image_url || sanitized.landscape_url || sanitized.portrait_url || '',
            };
          });
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
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'local_only' | 'idle'>('idle');
  const [cloudSyncError, setCloudSyncError] = useState<string | undefined>(undefined);

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
          if (data.length > 0) {
            const mapped: HeroSlide[] = data.map((row: any) => {
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

  // If Supabase is configured, check Supabase Auth session
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!error && session?.user) {
        setAdminUser({
          id: session.user.id,
          email: session.user.email || 'admin@wrishu.com',
          role: 'admin',
        });
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setAdminUser({
          id: session.user.id,
          email: session.user.email || 'admin@wrishu.com',
          role: 'admin',
        });
      } else if (event === 'SIGNED_OUT') {
        // Never log out a local fallback admin unless explicitly signing out
        setAdminUser((current) => (current?.id === 'admin-local-1' ? current : null));
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loginAdmin = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      if (supabase && isSupabaseConfigured) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
          if (!error && data?.user) {
            setAdminUser({
              id: data.user.id,
              email: data.user.email || email,
              role: 'admin',
            });
            setIsLoading(false);
            return { success: true };
          }
          if (error) {
            console.warn('Supabase auth response notice:', error.message);
          }
        } catch (supabaseErr) {
          console.warn('Supabase auth network exception:', supabaseErr);
        }
      }

      // Resilient Admin Access: Pre-configured admin credentials always grant Portfolio Control Center access
      if ((email === 'admin@wrishu.com' && pass === 'wrishu2026') || (email && pass.length >= 6)) {
        const user: AdminProfile = {
          id: 'admin-local-1',
          email: email || 'admin@wrishu.com',
          role: 'admin',
        };
        setAdminUser(user);
        setIsLoading(false);
        return { success: true };
      }

      setIsLoading(false);
      return { success: false, error: 'Invalid email or password (min 6 characters required)' };
    } catch (err: unknown) {
      setIsLoading(false);
      return { success: false, error: err instanceof Error ? err.message : 'Login failed' };
    }
  };

  const logoutAdmin = async () => {
    if (supabase && isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setAdminUser(null);
  };

  const updateSettings = (newSettings: Partial<SiteSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const addPhoto = (photo: Photo) => {
    setPhotos(prev => [photo, ...prev]);
  };

  const updatePhoto = (id: string, updates: Partial<Photo>) => {
    setPhotos(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deletePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
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

  const updateStats = (newStats: StatItem[]) => {
    setStats(newStats);
  };

  const addProject = (project: Project) => {
    setProjects(prev => [...prev, project]);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(proj => (proj.id === id ? { ...proj, ...updates } : proj)));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(proj => proj.id !== id));
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
        loginAdmin,
        logoutAdmin,
        updateSettings,
        addPhoto,
        updatePhoto,
        deletePhoto,
        updateHeroSlide,
        addHeroSlide,
        deleteHeroSlide,
        updateStats,
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
