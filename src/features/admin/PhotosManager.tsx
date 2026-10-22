import React, { useState } from 'react';
import { useData } from '../../lib/dataContext.tsx';
import { UploaderDropzone } from './UploaderDropzone.tsx';
import {
  Trash2,
  Check,
  ArrowUp,
  ArrowDown,
  CloudCheck,
  CloudUpload,
  AlertTriangle,
  Copy,
  Loader2,
} from 'lucide-react';
import type { Photo, Orientation } from '../../types/index.ts';

interface PhotosManagerProps {
  onNotify: (msg: string) => void;
}

const SUPABASE_PHOTOS_SQL = `-- Run in Supabase SQL Editor to allow saving photos and categories:
INSERT INTO public.categories (id, title, slug, order_index)
VALUES 
  ('cat-sports', 'Sports Photography', 'sports', 1),
  ('cat-street', 'Street Photography', 'street', 2),
  ('cat-nature', 'Nature Photography', 'nature', 3),
  ('cat-wildlife', 'Wildlife', 'wildlife', 4)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public read categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public write categories" ON public.categories;
CREATE POLICY "Allow public read categories" ON public.categories FOR SELECT TO public USING (true);
CREATE POLICY "Allow public write categories" ON public.categories FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view photos" ON public.photos;
DROP POLICY IF EXISTS "Admins can insert/update/delete photos" ON public.photos;
DROP POLICY IF EXISTS "Allow public read photos" ON public.photos;
DROP POLICY IF EXISTS "Allow public write photos" ON public.photos;
CREATE POLICY "Allow public read photos" ON public.photos FOR SELECT TO public USING (true);
CREATE POLICY "Allow public write photos" ON public.photos FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Only admins can modify site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow public read site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow public write site_settings" ON public.site_settings;
CREATE POLICY "Allow public read site_settings" ON public.site_settings FOR SELECT TO public USING (true);
CREATE POLICY "Allow public write site_settings" ON public.site_settings FOR ALL TO public USING (true) WITH CHECK (true);`;

export const PhotosManager: React.FC<PhotosManagerProps> = ({ onNotify }) => {
  const {
    categories,
    photos,
    addPhoto,
    updatePhoto,
    deletePhoto,
    reorderPhotos,
    photoSyncStatus,
    photoSyncError,
    syncPhotosToCloud,
  } = useData();

  const [selectedCategory, setSelectedCategory] = useState<string>('sports');
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [altText, setAltText] = useState('');
  const [titleText, setTitleText] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSqlHelp, setShowSqlHelp] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);

  const filteredPhotos = photos.filter((p) => p.category_id === selectedCategory && !p.project_id);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_PHOTOS_SQL);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2500);
  };

  const handlePublishToCloud = async () => {
    setIsSyncing(true);
    const res = await syncPhotosToCloud();
    setIsSyncing(false);
    if (res.success) {
      onNotify('Photo catalog successfully published to Supabase! All devices will now see this catalog.');
    } else {
      setShowSqlHelp(true);
      onNotify(`Sync notice: ${res.error || 'Check Supabase SQL policy'}`);
    }
  };

  const handleStartEdit = (photo: Photo) => {
    setEditingPhotoId(photo.id);
    setAltText(photo.alt);
    setTitleText(photo.title || '');
  };

  const handleSavePhotoMetadata = (id: string) => {
    updatePhoto(id, { alt: altText, title: titleText });
    setEditingPhotoId(null);
    onNotify('Photo metadata updated.');
  };

  const handleToggleOrientation = (photo: Photo) => {
    const nextOrient: Orientation = photo.orientation === 'landscape' ? 'portrait' : 'landscape';
    updatePhoto(photo.id, { orientation: nextOrient });
    onNotify(`Photo orientation changed to ${nextOrient}.`);
  };

  const handleToggleHomeGallery = (photo: Photo) => {
    updatePhoto(photo.id, { home_gallery: !photo.home_gallery });
    onNotify(photo.home_gallery ? 'Removed from Home Gallery' : 'Added to Home Gallery');
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this photo?')) {
      deletePhoto(id);
      onNotify('Photo removed.');
    }
  };

  const handleMovePhoto = (photoId: string, direction: 'up' | 'down') => {
    const catPhotos = photos.filter((p) => p.category_id === selectedCategory && !p.project_id);
    const catIndex = catPhotos.findIndex((p) => p.id === photoId);
    if (catIndex === -1) return;
    const targetIndex = direction === 'up' ? catIndex - 1 : catIndex + 1;
    if (targetIndex < 0 || targetIndex >= catPhotos.length) return;

    const newCatPhotos = [...catPhotos];
    const temp = newCatPhotos[catIndex];
    newCatPhotos[catIndex] = newCatPhotos[targetIndex];
    newCatPhotos[targetIndex] = temp;

    const updatedCatPhotos = newCatPhotos.map((p, idx) => ({ ...p, order: idx + 1 }));
    const otherPhotos = photos.filter((p) => p.category_id !== selectedCategory || Boolean(p.project_id));
    const fullNewList = [...otherPhotos, ...updatedCatPhotos];

    reorderPhotos(fullNewList);
    onNotify('Photo order updated and saved.');
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FFF' }}>Photo Catalog & Upload</h2>
        <p style={{ color: '#888', fontSize: '0.85rem' }}>
          Select category, drag and drop photos for automatic AVIF/WebP variant generation, and configure the 1L + 3P Home Gallery pattern.
        </p>
      </div>

      {/* Cloud Sync Status Banner */}
      <div
        style={{
          backgroundColor: photoSyncStatus === 'synced' ? '#0b1d10' : photoSyncStatus === 'error' ? '#261313' : '#1a170f',
          border: `1px solid ${photoSyncStatus === 'synced' ? '#1b4324' : photoSyncStatus === 'error' ? '#4a2020' : '#453818'}`,
          borderRadius: '8px',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {photoSyncStatus === 'synced' ? (
            <CloudCheck size={24} color="#4ade80" />
          ) : photoSyncStatus === 'error' ? (
            <AlertTriangle size={24} color="#f87171" />
          ) : (
            <CloudUpload size={24} color="var(--color-gold)" />
          )}
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>
                {photoSyncStatus === 'synced'
                  ? 'Cloud Synced · Live for All Visitors & Devices'
                  : photoSyncStatus === 'error'
                  ? 'Supabase Database Policy Needed'
                  : 'Saved in Local Browser · Needs Cloud Publish'}
              </span>
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#BBB', maxWidth: '650px' }}>
              {photoSyncStatus === 'synced'
                ? 'Your photo catalog is synced to the Supabase database. Visitors on all other PCs, laptops, and phones will see your exact uploaded Cloudflare photos.'
                : photoSyncStatus === 'error'
                ? (photoSyncError || 'Supabase rejected the database write (Row Level Security). Run the 1-click SQL fix below to allow public sync.')
                : 'Your uploaded photos and removed demo images are currently saved in this browser. Click "Publish to All Devices" to push them to Supabase so every device sees them.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {(photoSyncStatus === 'error' || showSqlHelp || photoSyncStatus === 'local_only') && (
            <button
              type="button"
              onClick={() => setShowSqlHelp(!showSqlHelp)}
              className="btn btn-sm"
              style={{ fontSize: '0.74rem', borderColor: '#555' }}
            >
              {showSqlHelp ? 'Hide SQL' : 'View SQL Fix'}
            </button>
          )}

          <button
            type="button"
            onClick={handlePublishToCloud}
            disabled={isSyncing}
            className="btn btn-gold btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            {isSyncing ? (
              <>
                <Loader2 size={15} className="spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <CloudUpload size={15} />
                <span>Publish to All Devices (Sync Supabase)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* SQL Help Box for RLS policy */}
      {(showSqlHelp || photoSyncStatus === 'error') && (
        <div
          style={{
            backgroundColor: '#121212',
            border: '1px solid #383838',
            borderRadius: '6px',
            padding: '16px',
            marginBottom: '20px',
            fontSize: '0.8rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-gold)' }}>
              📋 1-Click SQL to Enable Photo & Category Sync in Supabase
            </span>
            <button
              type="button"
              onClick={handleCopySql}
              className="btn btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem' }}
            >
              {sqlCopied ? <Check size={13} color="#4ade80" /> : <Copy size={13} />}
              <span>{sqlCopied ? 'Copied to Clipboard!' : 'Copy SQL'}</span>
            </button>
          </div>
          <p style={{ color: '#888', margin: '0 0 8px 0', fontSize: '0.74rem' }}>
            Go to <strong>Supabase Dashboard → SQL Editor</strong>, paste this command, click <strong>Run</strong>, then click <strong>Publish to All Devices</strong> above:
          </p>
          <pre
            style={{
              backgroundColor: '#050505',
              padding: '12px 14px',
              borderRadius: '4px',
              color: '#86efac',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              overflowX: 'auto',
              margin: 0,
              lineHeight: 1.45,
            }}
          >
            {SUPABASE_PHOTOS_SQL}
          </pre>
        </div>
      )}

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => setSelectedCategory(cat.slug)}
            className={`btn btn-sm ${selectedCategory === cat.slug ? 'btn-gold' : ''}`}
            style={{
              borderColor: selectedCategory === cat.slug ? 'var(--color-gold)' : '#333',
              backgroundColor: selectedCategory === cat.slug ? 'rgba(200, 145, 74, 0.15)' : 'transparent',
            }}
          >
            {cat.title} ({photos.filter((p) => p.category_id === cat.slug && !p.project_id).length})
          </button>
        ))}
      </div>

      {/* Multi-file drag and drop uploader with client compression pipeline */}
      <div className="admin-card">
        <h3 className="admin-card-title">Upload New Photos ({categories.find(c => c.slug === selectedCategory)?.title})</h3>
        <UploaderDropzone
          categoryId={selectedCategory}
          onUploadComplete={(newPhoto) => {
            addPhoto(newPhoto);
            onNotify(`Successfully uploaded and compressed: ${newPhoto.title}`);
          }}
        />
      </div>

      {/* Photo List */}
      <div className="admin-card">
        <h3 className="admin-card-title">
          Manage Photos ({filteredPhotos.length})
        </h3>

        {filteredPhotos.length === 0 ? (
          <p style={{ color: '#777', padding: '20px 0' }}>No photos in this category yet. Upload above!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredPhotos.map((photo, idx) => (
              <div
                key={photo.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#1b1b1b',
                  padding: '14px 18px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  gap: '16px',
                }}
              >
                {/* Thumb + Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                  {/* Order & Reorder Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: '#666', fontSize: '0.85rem', width: '24px' }}>#{idx + 1}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <button
                        onClick={() => handleMovePhoto(photo.id, 'up')}
                        disabled={idx === 0}
                        className="btn btn-sm"
                        style={{ padding: '2px 4px', fontSize: '0.65rem', opacity: idx === 0 ? 0.25 : 0.8 }}
                        title="Move Up"
                      >
                        <ArrowUp size={11} />
                      </button>
                      <button
                        onClick={() => handleMovePhoto(photo.id, 'down')}
                        disabled={idx === filteredPhotos.length - 1}
                        className="btn btn-sm"
                        style={{ padding: '2px 4px', fontSize: '0.65rem', opacity: idx === filteredPhotos.length - 1 ? 0.25 : 0.8 }}
                        title="Move Down"
                      >
                        <ArrowDown size={11} />
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      width: '70px',
                      height: '50px',
                      overflow: 'hidden',
                      borderRadius: '2px',
                      background: '#111',
                    }}
                  >
                    <img src={photo.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>

                  {editingPhotoId === photo.id ? (
                    <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Title"
                        style={{ textAlign: 'left', padding: '6px' }}
                        value={titleText}
                        onChange={(e) => setTitleText(e.target.value)}
                      />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Alt text"
                        style={{ textAlign: 'left', padding: '6px' }}
                        value={altText}
                        onChange={(e) => setAltText(e.target.value)}
                      />
                      <button
                        onClick={() => handleSavePhotoMetadata(photo.id)}
                        className="btn btn-sm btn-gold"
                        style={{ padding: '6px 10px' }}
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h4 style={{ fontSize: '0.92rem', color: '#FFF', fontWeight: 600 }}>{photo.title || 'Untitled Photo'}</h4>
                      <p style={{ fontSize: '0.78rem', color: '#888' }}>{photo.alt || 'No alt text'}</p>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Orientation Override */}
                  <button
                    onClick={() => handleToggleOrientation(photo)}
                    className="btn btn-sm"
                    style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                    title="Toggle Orientation"
                  >
                    {photo.orientation.toUpperCase()}
                  </button>

                  {/* Home Gallery Toggle */}
                  <button
                    onClick={() => handleToggleHomeGallery(photo)}
                    className="btn btn-sm"
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.7rem',
                      borderColor: photo.home_gallery ? 'var(--color-gold)' : '#444',
                      color: photo.home_gallery ? 'var(--color-gold)' : '#888',
                    }}
                  >
                    {photo.home_gallery ? '★ Home Gallery' : '+ Add to Home'}
                  </button>

                  {/* Edit Metadata */}
                  {editingPhotoId !== photo.id && (
                    <button
                      onClick={() => handleStartEdit(photo)}
                      className="btn btn-sm"
                      style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                    >
                      Edit
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(photo.id)}
                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '6px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

