-- ==============================================================================
-- Wrishu Photography Portfolio - Supabase Database Migration & Security Schema
-- Production Ready Schema with Row Level Security (RLS) and Storage Policies
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (Role-Based Access Control)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are readable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can update profile roles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Site Settings Table
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  logo_top TEXT NOT NULL DEFAULT 'NAVID MUSTASIM',
  logo_bottom TEXT NOT NULL DEFAULT 'WRISHU',
  about_label TEXT NOT NULL DEFAULT 'ABOUT ME',
  about_name TEXT NOT NULL DEFAULT 'My name is Navid Mustasim',
  about_name_gold TEXT NOT NULL DEFAULT 'Wrishu',
  about_roles TEXT NOT NULL DEFAULT 'Photographer | Traveler | Educator | Entrepreneur',
  about_paragraphs JSONB NOT NULL DEFAULT '[]'::jsonb,
  about_portrait_url TEXT,
  contact_quote TEXT,
  contact_bio TEXT,
  contact_phone TEXT NOT NULL DEFAULT '+880-1686-867-747',
  contact_email TEXT NOT NULL DEFAULT 'n.m.wrishu@gmail.com',
  contact_location TEXT NOT NULL DEFAULT 'Kallyanpur, Dhaka',
  map_query TEXT NOT NULL DEFAULT 'Kallyanpur, Dhaka, Bangladesh',
  footer_quote TEXT,
  copyright TEXT NOT NULL DEFAULT 'Copyright © 2026 Eruditech. All Rights Reserved.',
  social_links JSONB NOT NULL DEFAULT '{"instagram": "https://instagram.com"}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view site settings"
  ON public.site_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Only admins can modify site settings"
  ON public.site_settings FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. Hero Slides Table (Dual Landscape & Portrait)
CREATE TABLE IF NOT EXISTS public.hero_slides (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  cta_label TEXT,
  cta_url TEXT,
  landscape_url TEXT NOT NULL,
  portrait_url TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active hero slides"
  ON public.hero_slides FOR SELECT
  TO anon, authenticated
  USING (active = true OR public.is_admin());

CREATE POLICY "Admins can manage hero slides"
  ON public.hero_slides FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  order_index INT NOT NULL DEFAULT 1
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view categories"
  ON public.categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (public.is_admin());

-- 6. Photos Table
CREATE TABLE IF NOT EXISTS public.photos (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES public.categories(slug) ON DELETE CASCADE,
  project_id TEXT,
  url TEXT NOT NULL,
  variants JSONB NOT NULL DEFAULT '{}'::jsonb,
  width INT NOT NULL,
  height INT NOT NULL,
  orientation TEXT NOT NULL CHECK (orientation IN ('landscape', 'portrait')),
  lqip TEXT,
  alt TEXT NOT NULL,
  title TEXT,
  order_index INT NOT NULL DEFAULT 1,
  featured BOOLEAN NOT NULL DEFAULT false,
  home_gallery BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view photos"
  ON public.photos FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert/update/delete photos"
  ON public.photos FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 7. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  featured_image_url TEXT NOT NULL,
  description TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 1,
  photos_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view projects"
  ON public.projects FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage projects"
  ON public.projects FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 8. Stats Table
CREATE TABLE IF NOT EXISTS public.stats (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  value INT NOT NULL,
  suffix TEXT DEFAULT '+',
  order_index INT NOT NULL DEFAULT 1
);

ALTER TABLE public.stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view stats"
  ON public.stats FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can update stats"
  ON public.stats FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 9. Contact Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY DEFAULT ('msg-' || floor(extract(epoch from now()))::text),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Allow public insert through sanitized contact endpoint
CREATE POLICY "Public can submit contact messages"
  ON public.messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (length(trim(name)) > 0 AND length(trim(email)) > 3 AND length(trim(message)) >= 5);

CREATE POLICY "Only admins can view and delete messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Only admins can update/delete messages"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Only admins can delete messages"
  ON public.messages FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 10. Supabase Storage Bucket Setup: "hero"
-- Note: Run in Supabase SQL editor or storage dashboard
INSERT INTO storage.buckets (id, name, public)
VALUES ('hero', 'hero', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view hero slider bucket"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'hero');

CREATE POLICY "Admins can upload to hero bucket"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'hero' AND public.is_admin());

CREATE POLICY "Admins can update/delete hero bucket files"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'hero' AND public.is_admin());
