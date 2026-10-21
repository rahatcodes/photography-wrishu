import React, { useState, useRef } from 'react';
import { useData } from '../../lib/dataContext.tsx';
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Save,
  UploadCloud,
  CheckCircle2,
  Loader2,
  Database,
  Monitor,
  Smartphone,
  SlidersHorizontal,
  Sparkles,
  CloudCheck,
  CloudUpload,
  AlertTriangle,
  Copy,
  Check,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react';
import type { HeroSlide, HeroSlideTarget } from '../../types/index.ts';
import {
  uploadHeroImageToSupabase,
  listHeroBucketImages,
  BucketImageItem,
  UploadResult,
} from '../../lib/imageEngine.ts';

interface SingleImageUploaderProps {
  currentUrl: string;
  target: HeroSlideTarget;
  onUrlChange: (newUrl: string) => void;
}

const SingleImageUploader: React.FC<SingleImageUploaderProps> = ({
  currentUrl,
  target,
  onUrlChange,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [lastResult, setLastResult] = useState<UploadResult | null>(null);
  const [showBucketBrowser, setShowBucketBrowser] = useState(false);
  const [bucketImages, setBucketImages] = useState<BucketImageItem[]>([]);
  const [isLoadingBucket, setIsLoadingBucket] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPortrait = target === 'portrait';

  const handleOpenBucketBrowser = async () => {
    setShowBucketBrowser(true);
    setIsLoadingBucket(true);
    const items = await listHeroBucketImages();
    setBucketImages(items);
    setIsLoadingBucket(false);
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WebP, etc.).');
      return;
    }

    setIsUploading(true);
    setProgressStage('Compressing image to WebP...');
    setProgressPercent(25);
    setLastResult(null);

    try {
      const result = await uploadHeroImageToSupabase(
        file,
        target,
        (pct, stage) => {
          setProgressStage(stage);
          setProgressPercent(pct);
        }
      );

      setLastResult(result);
      onUrlChange(result.url);
    } catch (err) {
      console.error('Hero upload error:', err);
      const msg = err instanceof Error ? err.message : 'Upload failed. Please check the console or try another image.';
      alert(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#181818',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '6px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FFF' }}>
            {isPortrait ? '📱 Phone / Mobile Visual' : '🖥️ Desktop / Tablet Visual'}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#888' }}>
            Optimal Ratio: <span style={{ color: 'var(--color-gold)' }}>{isPortrait ? '9:16 / 4:5 (Vertical)' : '16:9 / 3:2 (Horizontal)'}</span>
          </div>
        </div>
        <span
          style={{
            fontSize: '0.68rem',
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: 'rgba(200, 145, 74, 0.15)',
            color: 'var(--color-gold)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontWeight: 600,
          }}
        >
          <Database size={11} />
          Supabase Bucket: hero
        </span>
      </div>

      {/* Preview Box & Dropzone */}
      <div style={{ display: 'grid', gridTemplateColumns: isPortrait ? '100px 1fr' : '140px 1fr', gap: '14px', alignItems: 'center' }}>
        <div
          style={{
            width: '100%',
            height: isPortrait ? '130px' : '85px',
            backgroundColor: '#0f0f0f',
            border: '1px solid #333',
            borderRadius: '4px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {currentUrl ? (
            <img
              src={currentUrl}
              alt="Slide Preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: '0.72rem', color: '#666' }}>No Image</span>
          )}
        </div>

        {/* Upload Trigger Area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files?.[0]) {
              handleFile(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `1px dashed ${dragOver ? 'var(--color-gold)' : '#444'}`,
            backgroundColor: dragOver ? 'rgba(200, 145, 74, 0.08)' : '#121212',
            borderRadius: '4px',
            padding: '16px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />
          {isUploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <Loader2 size={20} color="var(--color-gold)" className="animate-spin" />
              <span style={{ fontSize: '0.75rem', color: '#DDD' }}>{progressStage}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <UploadCloud size={22} color="var(--color-gold)" />
              <span style={{ fontSize: '0.8rem', color: '#EEE', fontWeight: 600 }}>
                Upload {isPortrait ? 'Mobile' : 'Desktop'} Image to Supabase
              </span>
              <span style={{ fontSize: '0.7rem', color: '#777' }}>
                Auto-compressed to clean WebP · Rendered from Supabase bucket
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {isUploading && (
        <div style={{ width: '100%', height: '3px', backgroundColor: '#333', borderRadius: '2px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              backgroundColor: 'var(--color-gold)',
              transition: 'width 200ms ease',
            }}
          />
        </div>
      )}

      {/* Success Metrics Banner */}
      {lastResult && (
        <div
          style={{
            backgroundColor: '#112211',
            border: '1px solid #1e3a1e',
            borderRadius: '4px',
            padding: '8px 12px',
            fontSize: '0.76rem',
            color: '#86efac',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={14} color="#4ade80" />
            <span>
              {(lastResult.sizeBytes / 1024).toFixed(1)} KB ({lastResult.width}x{lastResult.height}) · -{lastResult.savingsPercent}% Saved
            </span>
          </div>
          <span style={{ color: '#4ade80', fontWeight: 600 }}>
            Uploaded to Supabase Bucket
          </span>
        </div>
      )}

      {/* Direct Image URL input & Bucket Browser Button */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: '0.7rem', color: '#777', margin: 0 }}>
            Image URL (Supabase Public CDN):
          </label>
          <button
            type="button"
            onClick={handleOpenBucketBrowser}
            className="btn btn-sm"
            style={{ fontSize: '0.72rem', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <Database size={11} color="var(--color-gold)" />
            <span>Browse Bucket Images</span>
          </button>
        </div>

        <input
          type="text"
          className="form-input"
          style={{ textAlign: 'left', fontSize: '0.75rem', padding: '6px 10px', height: '32px' }}
          value={currentUrl || ''}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://hkkyewcysomxwwsjfjwb.supabase.co/storage/v1/object/public/hero/..."
        />

        {showBucketBrowser && (
          <div
            style={{
              backgroundColor: '#111',
              border: '1px solid #333',
              borderRadius: '6px',
              padding: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#EEE' }}>
                Pick an existing image from Supabase Bucket (`hero/hero-slides/`):
              </span>
              <button
                type="button"
                onClick={() => setShowBucketBrowser(false)}
                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.75rem' }}
              >
                ✕ Close
              </button>
            </div>

            {isLoadingBucket ? (
              <div style={{ padding: '12px', textAlign: 'center', color: '#888', fontSize: '0.75rem' }}>
                <Loader2 size={16} className="animate-spin" /> Loading bucket images...
              </div>
            ) : bucketImages.length === 0 ? (
              <p style={{ color: '#777', fontSize: '0.75rem', margin: 0 }}>No images found in bucket yet.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                {bucketImages.map((bImg) => (
                  <div
                    key={bImg.name}
                    onClick={() => {
                      onUrlChange(bImg.url);
                      setShowBucketBrowser(false);
                    }}
                    style={{
                      border: currentUrl === bImg.url ? '2px solid var(--color-gold)' : '1px solid #333',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      backgroundColor: '#0a0a0a',
                    }}
                    title={bImg.name}
                  >
                    <img src={bImg.url} alt={bImg.name} style={{ width: '100%', height: '55px', objectFit: 'cover' }} />
                    <div style={{ padding: '3px 4px', fontSize: '0.62rem', color: '#AAA', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {(bImg.sizeBytes / 1024).toFixed(0)} KB
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const SUPABASE_HERO_SQL = `-- Run in Supabase SQL Editor to allow saving slides to the database:
ALTER TABLE public.hero_slides ADD COLUMN IF NOT EXISTS target TEXT DEFAULT 'landscape';
ALTER TABLE public.hero_slides ADD COLUMN IF NOT EXISTS image_url TEXT;

DROP POLICY IF EXISTS "Admins can manage hero slides" ON public.hero_slides;
DROP POLICY IF EXISTS "Public can view active hero slides" ON public.hero_slides;
DROP POLICY IF EXISTS "Allow public write on hero_slides" ON public.hero_slides;
DROP POLICY IF EXISTS "Allow public read of hero_slides" ON public.hero_slides;

CREATE POLICY "Allow public read of hero_slides"
  ON public.hero_slides FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public write on hero_slides"
  ON public.hero_slides FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);`;

export const HeroSlideEditor: React.FC = () => {
  const {
    heroSlides,
    updateHeroSlide,
    addHeroSlide,
    deleteHeroSlide,
    reorderHeroSlides,
    cloudSyncStatus,
    cloudSyncError,
    syncHeroSlidesToCloud,
  } = useData();

  const [activeFilter, setActiveFilter] = useState<'all' | 'landscape' | 'portrait'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<Partial<HeroSlide>>({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSqlHelp, setShowSqlHelp] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [orderSaveFeedback, setOrderSaveFeedback] = useState<string | null>(null);

  const handleSyncToCloud = async () => {
    setIsSyncing(true);
    const res = await syncHeroSlidesToCloud();
    setIsSyncing(false);
    if (res.success) {
      alert('Success! All slides have been published to Supabase database. They will now appear on all devices and browsers!');
      setShowSqlHelp(false);
    } else {
      if (res.error?.includes('row-level security') || res.error?.includes('42501') || res.error?.includes('permission')) {
        setShowSqlHelp(true);
      } else {
        alert(`Cloud sync note: ${res.error || 'Unknown error'}`);
      }
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_HERO_SQL);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2500);
  };

  const handleEdit = (slide: HeroSlide) => {
    setEditingId(slide.id);
    setFormState({
      ...slide,
      target: slide.target || (slide.portrait_url && !slide.landscape_url ? 'portrait' : 'landscape'),
      image_url: slide.image_url || slide.landscape_url || slide.portrait_url || '',
    });
  };

  const handleSave = (id: string) => {
    const updated: Partial<HeroSlide> = {
      ...formState,
      // Keep legacy fields populated so existing code is always backward-compatible
      landscape_url: formState.target === 'landscape' ? formState.image_url : formState.landscape_url || formState.image_url,
      portrait_url: formState.target === 'portrait' ? formState.image_url : formState.portrait_url || formState.image_url,
    };
    updateHeroSlide(id, updated);
    if (formState.order !== undefined) {
      handleIndexChange(id, formState.order);
    }
    setEditingId(null);
  };

  const handleAddNew = (targetType: HeroSlideTarget) => {
    const isPortrait = targetType === 'portrait';
    const newSlide: HeroSlide = {
      id: `hero-${isPortrait ? 'mob' : 'desk'}-${Date.now()}`,
      title: isPortrait ? 'Mobile Story Visual' : 'Cinematic Match Coverage',
      subtitle: isPortrait ? 'Phone Exclusive Headline' : 'International Sports Storytelling',
      image_url: '',
      target: targetType,
      landscape_url: '',
      portrait_url: '',
      order: sortedSlides.length + 1,
      active: true,
    };
    addHeroSlide(newSlide);
    handleEdit(newSlide);
  };

  // Filter slides according to selected tab filter and sort strictly by sequence order
  const filteredSlides = heroSlides.filter((slide) => {
    const slideTarget = slide.target || (slide.portrait_url && !slide.landscape_url ? 'portrait' : 'landscape');
    if (activeFilter === 'all') return true;
    return slideTarget === activeFilter;
  });

  const sortedSlides = [...filteredSlides].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const desktopCount = heroSlides.filter((s) => (s.target || 'landscape') === 'landscape').length;
  const mobileCount = heroSlides.filter((s) => s.target === 'portrait' || (s.portrait_url && !s.landscape_url)).length;

  const handleReorder = (newOrderedSubset: HeroSlide[]) => {
    // Re-assign sequential order numbers (1, 2, 3...)
    const updatedSubset = newOrderedSubset.map((slide, idx) => ({
      ...slide,
      order: idx + 1,
    }));

    let newFullList: HeroSlide[];
    if (activeFilter === 'all') {
      newFullList = updatedSubset;
    } else {
      const subsetIds = new Set(updatedSubset.map((s) => s.id));
      const nonSubset = heroSlides.filter((s) => !subsetIds.has(s.id));
      newFullList = [...updatedSubset, ...nonSubset];
    }

    reorderHeroSlides(newFullList);
    setOrderSaveFeedback('Sequence updated & synced to Supabase cloud!');
    setTimeout(() => setOrderSaveFeedback(null), 3000);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const currentList = [...sortedSlides];
    const temp = currentList[index];
    currentList[index] = currentList[index - 1];
    currentList[index - 1] = temp;
    handleReorder(currentList);
  };

  const handleMoveDown = (index: number) => {
    if (index >= sortedSlides.length - 1) return;
    const currentList = [...sortedSlides];
    const temp = currentList[index];
    currentList[index] = currentList[index + 1];
    currentList[index + 1] = temp;
    handleReorder(currentList);
  };

  const handleIndexChange = (slideId: string, newPosition1Based: number) => {
    const currentList = [...sortedSlides];
    const oldIndex = currentList.findIndex((s) => s.id === slideId);
    if (oldIndex === -1) return;

    const targetIndex = Math.max(0, Math.min(newPosition1Based - 1, currentList.length - 1));
    if (oldIndex === targetIndex) return;

    const [movedItem] = currentList.splice(oldIndex, 1);
    currentList.splice(targetIndex, 0, movedItem);

    handleReorder(currentList);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const currentList = [...sortedSlides];
    const sourceIndex = currentList.findIndex((s) => s.id === draggedId);
    const targetIndex = currentList.findIndex((s) => s.id === targetId);

    if (sourceIndex !== -1 && targetIndex !== -1) {
      const [movedItem] = currentList.splice(sourceIndex, 1);
      currentList.splice(targetIndex, 0, movedItem);
      handleReorder(currentList);
    }

    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <div>
      {/* Top Header & Action Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FFF' }}>Hero Slider Slides</h2>
          <p style={{ color: '#888', fontSize: '0.85rem', maxWidth: '750px', marginTop: '4px' }}>
            Manage separate slides for <strong>PC / Desktop</strong> and <strong>Phone / Mobile</strong>.
            Images are uploaded to the <strong>Supabase (`hero`) bucket</strong> and slide records are synced to the <strong>Supabase `hero_slides` database table</strong> so all visitors see them live.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => handleAddNew('landscape')}
            className="btn btn-gold btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Monitor size={15} />
            <span>+ Add Desktop Slide</span>
          </button>
          <button
            onClick={() => handleAddNew('portrait')}
            className="btn btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', borderColor: 'var(--color-gold)', color: 'var(--color-gold)' }}
          >
            <Smartphone size={15} />
            <span>+ Add Phone Slide</span>
          </button>
        </div>
      </div>

      {/* Cloud Sync Status Banner */}
      <div
        style={{
          backgroundColor: cloudSyncStatus === 'synced' ? '#0b1d10' : cloudSyncStatus === 'error' ? '#261313' : '#1a170f',
          border: `1px solid ${cloudSyncStatus === 'synced' ? '#1b4324' : cloudSyncStatus === 'error' ? '#4a2020' : '#453818'}`,
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
          {cloudSyncStatus === 'synced' ? (
            <CloudCheck size={24} color="#4ade80" />
          ) : cloudSyncStatus === 'error' ? (
            <AlertTriangle size={24} color="#f87171" />
          ) : (
            <CloudUpload size={24} color="var(--color-gold)" />
          )}
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>
                {cloudSyncStatus === 'synced'
                  ? 'Cloud Synced · Live for All Visitors & Devices'
                  : cloudSyncStatus === 'error'
                  ? 'Supabase Database Policy Needed'
                  : 'Saved in Local Browser · Needs Cloud Publish'}
              </span>
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#BBB', maxWidth: '650px' }}>
              {cloudSyncStatus === 'synced'
                ? 'Your hero slides are saved in the Supabase database. Any visitor on any PC, phone, or browser will see these exact slides.'
                : cloudSyncStatus === 'error'
                ? 'Your slides are saved in this browser, but Supabase rejected the database write (Row Level Security). Run the SQL below to enable public sync.'
                : 'Your uploaded slides are currently in this browser. Click "Publish to All Devices" to push them to Supabase so other PCs and phones can see them.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {(cloudSyncStatus === 'error' || showSqlHelp) && (
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
            onClick={handleSyncToCloud}
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
      {(showSqlHelp || cloudSyncStatus === 'error') && (
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
              📋 1-Click SQL to Enable Cloud Database Sync in Supabase
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
            {SUPABASE_HERO_SQL}
          </pre>
        </div>
      )}

      {/* Target Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '12px',
        }}
      >
        <button
          onClick={() => setActiveFilter('all')}
          style={{
            background: activeFilter === 'all' ? 'var(--color-gold)' : 'transparent',
            color: activeFilter === 'all' ? '#000' : '#AAA',
            border: 'none',
            padding: '6px 14px',
            borderRadius: '4px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
        >
          All Slides ({heroSlides.length})
        </button>
        <button
          onClick={() => setActiveFilter('landscape')}
          style={{
            background: activeFilter === 'landscape' ? 'var(--color-gold)' : 'transparent',
            color: activeFilter === 'landscape' ? '#000' : '#AAA',
            border: 'none',
            padding: '6px 14px',
            borderRadius: '4px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 150ms ease',
          }}
        >
          <Monitor size={14} />
          <span>Desktop Slides ({desktopCount})</span>
        </button>
        <button
          onClick={() => setActiveFilter('portrait')}
          style={{
            background: activeFilter === 'portrait' ? 'var(--color-gold)' : 'transparent',
            color: activeFilter === 'portrait' ? '#000' : '#AAA',
            border: 'none',
            padding: '6px 14px',
            borderRadius: '4px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 150ms ease',
          }}
        >
          <Smartphone size={14} />
          <span>Phone Slides ({mobileCount})</span>
        </button>
      </div>

      {/* Reordering Instructions & Realtime Feedback Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '16px',
          padding: '10px 14px',
          backgroundColor: '#151515',
          border: '1px solid #262626',
          borderRadius: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#AAA' }}>
          <ArrowUpDown size={14} color="var(--color-gold)" />
          <span>
            <strong>Reorder Hero Slides:</strong> Drag any slide using the <GripVertical size={13} style={{ display: 'inline', verticalAlign: 'middle', color: 'var(--color-gold)' }} /> handle, click the <strong>↑ / ↓</strong> arrows, or pick from the <strong>Pos: #</strong> dropdown. Order saves & syncs automatically!
          </span>
        </div>

        {orderSaveFeedback && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.76rem',
              color: '#4ade80',
              fontWeight: 600,
              backgroundColor: 'rgba(74, 222, 128, 0.1)',
              padding: '3px 10px',
              borderRadius: '4px',
              border: '1px solid rgba(74, 222, 128, 0.25)',
            }}
          >
            <CheckCircle2 size={13} color="#4ade80" />
            <span>{orderSaveFeedback}</span>
          </div>
        )}
      </div>

      {/* Slides List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {sortedSlides.map((slide, idx) => {
          const isEditing = editingId === slide.id;
          const slideTarget: HeroSlideTarget = slide.target || (slide.portrait_url && !slide.landscape_url ? 'portrait' : 'landscape');
          const isPortrait = slideTarget === 'portrait';
          const slideImage = slide.image_url || slide.landscape_url || slide.portrait_url || '';
          const isBeingDragged = draggedId === slide.id;
          const isDropTarget = dragOverId === slide.id && draggedId !== slide.id;

          return (
            <div
              key={slide.id}
              className="admin-card"
              draggable={!isEditing}
              onDragStart={(e) => handleDragStart(e, slide.id)}
              onDragOver={(e) => handleDragOver(e, slide.id)}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, slide.id)}
              style={{
                padding: '20px',
                opacity: isBeingDragged ? 0.35 : 1,
                border: isDropTarget
                  ? '2px solid var(--color-gold)'
                  : isBeingDragged
                  ? '1px dashed #666'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: isDropTarget ? '0 0 16px rgba(200, 145, 74, 0.25)' : 'none',
                transform: isBeingDragged ? 'scale(0.99)' : 'none',
                transition: 'border 150ms ease, box-shadow 150ms ease, opacity 150ms ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Drag Handle & Ordering Arrows */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div
                      title="Drag to reorder slide"
                      style={{
                        cursor: isEditing ? 'default' : 'grab',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px 4px',
                        color: isEditing ? '#444' : '#888',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      <GripVertical size={18} />
                    </div>

                    {/* Prominent Serial Badge */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(200, 145, 74, 0.12)',
                        border: '1px solid rgba(200, 145, 74, 0.3)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        minWidth: '42px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '1.05rem',
                          fontWeight: 800,
                          color: 'var(--color-gold)',
                          lineHeight: 1,
                        }}
                      >
                        #{idx + 1}
                      </span>
                      <span style={{ fontSize: '0.58rem', color: '#999', marginTop: '2px', fontWeight: 600 }}>
                        ORDER
                      </span>
                    </div>

                    {/* Step Up / Step Down Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <button
                        type="button"
                        onClick={() => handleMoveUp(idx)}
                        disabled={idx === 0}
                        title="Move Slide Up (plays earlier)"
                        style={{
                          background: idx === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.07)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '3px',
                          padding: '2px 4px',
                          color: idx === 0 ? '#444' : '#DDD',
                          cursor: idx === 0 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <ChevronUp size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(idx)}
                        disabled={idx === sortedSlides.length - 1}
                        title="Move Slide Down (plays later)"
                        style={{
                          background: idx === sortedSlides.length - 1 ? 'transparent' : 'rgba(255, 255, 255, 0.07)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '3px',
                          padding: '2px 4px',
                          color: idx === sortedSlides.length - 1 ? '#444' : '#DDD',
                          cursor: idx === sortedSlides.length - 1 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <ChevronDown size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Thumbnail */}
                  <div
                    style={{
                      width: isPortrait ? '50px' : '90px',
                      height: '56px',
                      overflow: 'hidden',
                      borderRadius: '4px',
                      background: '#222',
                      flexShrink: 0,
                    }}
                  >
                    {slideImage ? (
                      <img src={slideImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#555' }}>
                        No Image
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '3px',
                          backgroundColor: isPortrait ? 'rgba(56, 189, 248, 0.15)' : 'rgba(200, 145, 74, 0.2)',
                          color: isPortrait ? '#38bdf8' : 'var(--color-gold)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {isPortrait ? <Smartphone size={11} /> : <Monitor size={11} />}
                        {isPortrait ? 'PHONE' : 'DESKTOP'}
                      </span>
                      <h3 style={{ fontSize: '0.95rem', color: '#FFF', fontWeight: 600 }}>{slide.title}</h3>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#888' }}>{slide.subtitle || 'No caption'}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Direct Position / Index Selector Dropdown */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '6px' }}>
                    <label style={{ fontSize: '0.72rem', color: '#777', margin: 0 }}>Pos:</label>
                    <select
                      value={idx + 1}
                      onChange={(e) => handleIndexChange(slide.id, parseInt(e.target.value, 10))}
                      title="Jump directly to sequence position"
                      style={{
                        backgroundColor: '#181818',
                        color: 'var(--color-gold)',
                        border: '1px solid #444',
                        borderRadius: '4px',
                        padding: '3px 8px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {sortedSlides.map((_, pIdx) => (
                        <option key={pIdx + 1} value={pIdx + 1}>
                          #{pIdx + 1} {pIdx === 0 ? '(1st)' : pIdx === sortedSlides.length - 1 ? '(Last)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => updateHeroSlide(slide.id, { active: !slide.active })}
                    style={{ background: 'none', border: 'none', color: slide.active ? 'var(--color-gold)' : '#666', cursor: 'pointer' }}
                    title={slide.active ? 'Slide is Active' : 'Slide is Inactive'}
                  >
                    {slide.active ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                  <button
                    onClick={() => (isEditing ? handleSave(slide.id) : handleEdit(slide))}
                    className="btn btn-sm"
                    style={{ borderColor: isEditing ? 'var(--color-gold)' : '#444' }}
                  >
                    {isEditing ? <Save size={14} /> : 'Edit'}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this slide?')) {
                        deleteHeroSlide(slide.id);
                      }
                    }}
                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                    title="Delete Slide"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Editing Form */}
              {isEditing && (
                <div style={{ marginTop: '20px', borderTop: '1px solid #333', paddingTop: '20px' }}>
                  {/* Sequence Position Selector in Edit Form */}
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.78rem', color: 'var(--color-gold)', display: 'block', marginBottom: '6px' }}>
                      Playback Sequence Position
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <select
                        className="form-input"
                        style={{ maxWidth: '160px', fontWeight: 600, padding: '6px 10px' }}
                        value={formState.order ?? (idx + 1)}
                        onChange={(e) => setFormState({ ...formState, order: parseInt(e.target.value, 10) })}
                      >
                        {sortedSlides.map((_, pIdx) => (
                          <option key={pIdx + 1} value={pIdx + 1}>
                            Position #{pIdx + 1} {pIdx === 0 ? '(First slide)' : pIdx === sortedSlides.length - 1 ? '(Last slide)' : ''}
                          </option>
                        ))}
                      </select>
                      <span style={{ fontSize: '0.74rem', color: '#888' }}>
                        Controls where this slide appears in the slideshow playback sequence
                      </span>
                    </div>
                  </div>

                  {/* Target Device Selector */}
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.78rem', color: 'var(--color-gold)', display: 'block', marginBottom: '8px' }}>
                      Slide Device Type
                    </label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        type="button"
                        onClick={() => setFormState({ ...formState, target: 'landscape' })}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '4px',
                          border: `1px solid ${formState.target === 'landscape' ? 'var(--color-gold)' : '#333'}`,
                          backgroundColor: formState.target === 'landscape' ? 'rgba(200, 145, 74, 0.15)' : '#181818',
                          color: formState.target === 'landscape' ? '#FFF' : '#888',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          fontWeight: 600,
                          fontSize: '0.82rem',
                        }}
                      >
                        <Monitor size={16} color={formState.target === 'landscape' ? 'var(--color-gold)' : '#888'} />
                        <span>🖥️ Desktop / Landscape (&gt;= 768px)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormState({ ...formState, target: 'portrait' })}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '4px',
                          border: `1px solid ${formState.target === 'portrait' ? '#38bdf8' : '#333'}`,
                          backgroundColor: formState.target === 'portrait' ? 'rgba(56, 189, 248, 0.12)' : '#181818',
                          color: formState.target === 'portrait' ? '#FFF' : '#888',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          fontWeight: 600,
                          fontSize: '0.82rem',
                        }}
                      >
                        <Smartphone size={16} color={formState.target === 'portrait' ? '#38bdf8' : '#888'} />
                        <span>📱 Phone / Portrait (&lt; 768px)</span>
                      </button>
                    </div>
                  </div>

                  {/* Title Input */}
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.78rem', color: 'var(--color-gold)', display: 'block', marginBottom: '6px' }}>
                      {formState.target === 'portrait' ? 'Phone Headline' : 'Desktop Headline'}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ textAlign: 'left' }}
                      value={formState.title || ''}
                      onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                      placeholder={formState.target === 'portrait' ? 'e.g. Intense Focus: Every Second Counts' : 'e.g. Shoulder to shoulder, carrying Bangladesh responsibility'}
                    />
                  </div>

                  {/* Caption / Subtitle Input */}
                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '0.78rem', color: 'var(--color-gold)', display: 'block', marginBottom: '6px' }}>
                      {formState.target === 'portrait' ? 'Phone Caption / Subtitle' : 'Desktop Subtitle'}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ textAlign: 'left' }}
                      value={formState.subtitle || ''}
                      onChange={(e) => setFormState({ ...formState, subtitle: e.target.value })}
                      placeholder={formState.target === 'portrait' ? 'e.g. AFC Player Profile Special' : 'e.g. FIFA & AFC International Matches'}
                    />
                  </div>

                  {/* Dedicated Image Uploader for this Slide Type */}
                  <div style={{ marginBottom: '20px' }}>
                    <SingleImageUploader
                      currentUrl={formState.image_url || ''}
                      target={formState.target || 'landscape'}
                      onUrlChange={(url) => setFormState((prev) => ({ ...prev, image_url: url }))}
                    />
                  </div>

                  <button
                    onClick={() => handleSave(slide.id)}
                    className="btn btn-gold btn-sm"
                    style={{ marginTop: '10px' }}
                  >
                    Save Slide Changes
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filteredSlides.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: '#141414', borderRadius: '6px', border: '1px dashed #333' }}>
            <p style={{ color: '#888', fontSize: '0.9rem' }}>
              No {activeFilter === 'portrait' ? 'phone/mobile' : activeFilter === 'landscape' ? 'desktop' : ''} slides found.
            </p>
            <button
              onClick={() => handleAddNew(activeFilter === 'portrait' ? 'portrait' : 'landscape')}
              className="btn btn-gold btn-sm"
              style={{ marginTop: '12px' }}
            >
              + Create First {activeFilter === 'portrait' ? 'Phone' : 'Desktop'} Slide
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
