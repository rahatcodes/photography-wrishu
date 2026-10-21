/**
 * Core Domain Models for Wrishu Photography Portfolio
 */

export type Orientation = 'landscape' | 'portrait';

export interface PhotoVariants {
  [width: number]: string; // e.g. 480, 768, 1280, 1920, 2560
}

export interface Photo {
  id: string;
  category_id: string; // sports, street, nature, wildlife
  project_id?: string | null;
  url: string;
  variants: PhotoVariants;
  width: number;
  height: number;
  orientation: Orientation;
  lqip?: string; // low quality image placeholder (base64 data URI or blurhash)
  alt: string;
  title?: string;
  order: number;
  featured: boolean;
  home_gallery: boolean;
  created_at?: string;
}

export interface Category {
  id: string;
  title: string;
  slug: 'sports' | 'street' | 'nature' | 'wildlife' | string;
  order: number;
  description?: string;
}

export type HeroSlideTarget = 'landscape' | 'portrait';

export interface HeroSlide {
  id: string;
  title: string;
  subtitle?: string;
  cta_label?: string;
  cta_url?: string;
  image_url: string;
  target: HeroSlideTarget; // 'landscape' for PC/desktop/tablet, 'portrait' for phone/mobile
  landscape_url?: string; // backward-compatibility
  portrait_url?: string;  // backward-compatibility
  order: number;
  active: boolean;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  featured_image_url: string;
  description: string;
  order: number;
  photos_count?: number;
}

export interface StatItem {
  id: string;
  label: string;
  value: number;
  suffix?: string;
  order: number;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
  read: boolean;
}

export interface SiteSettings {
  logo_top: string;
  logo_bottom: string;
  about_label: string;
  about_name: string;
  about_name_gold: string;
  about_roles: string;
  about_paragraphs: string[];
  about_portrait_url: string;
  contact_quote: string;
  contact_bio: string;
  contact_phone: string;
  contact_email: string;
  contact_location: string;
  map_query: string;
  footer_quote: string;
  copyright: string;
  social_links: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
  };
}

export interface AdminProfile {
  id: string;
  email: string;
  role: 'admin' | 'user';
}
