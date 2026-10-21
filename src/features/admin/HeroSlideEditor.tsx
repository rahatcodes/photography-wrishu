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
} from 'lucide-react';
import type { HeroSlide, HeroSlideTarget } from '../../types/index.ts';
import { uploadHeroImageToSupabase, UploadHeroResult } from '../../lib/storageService.ts';
import { CompressionProfile, COMPRESSION_PROFILES } from '../../lib/imageCompression.ts';

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
  const [lastResult, setLastResult] = useState<UploadHeroResult | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<CompressionProfile>('ultra');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPortrait = target === 'portrait';
  const activeCfg = COMPRESSION_PROFILES[selectedProfile];

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WebP, etc.).');
      return;
    }

    setIsUploading(true);
    setProgressStage(`Compressing with ${activeCfg.label}...`);
    setProgressPercent(15);
    setLastResult(null);

    try {
      const result = await uploadHeroImageToSupabase(
        file,
        target,
        (stage, pct) => {
          setProgressStage(stage);
          setProgressPercent(pct);
        },
        selectedProfile
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

      {/* Quality Mode Selector */}
      <div style={{ backgroundColor: '#111', padding: '10px 12px', borderRadius: '6px', border: '1px solid #282828' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.73rem', fontWeight: 600, color: '#BBB', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Sparkles size={12} color="var(--color-gold)" />
            Compression Quality Mode:
          </span>
          <span style={{ fontSize: '0.68rem', color: 'var(--color-gold)', fontWeight: 600 }}>
            {activeCfg.badge}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {(['ultra', 'balanced', 'compact'] as CompressionProfile[]).map((pKey) => {
            const p = COMPRESSION_PROFILES[pKey];
            const isSelected = selectedProfile === pKey;
            return (
              <button
                key={pKey}
                type="button"
                onClick={() => setSelectedProfile(pKey)}
                style={{
                  padding: '6px 8px',
                  borderRadius: '4px',
                  border: isSelected ? '1px solid var(--color-gold)' : '1px solid #333',
                  backgroundColor: isSelected ? 'rgba(200, 145, 74, 0.15)' : '#181818',
                  color: isSelected ? '#FFF' : '#888',
                  fontSize: '0.72rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 120ms ease',
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <p style={{ margin: '6px 0 0 0', fontSize: '0.68rem', color: '#777' }}>
          {activeCfg.description}
        </p>
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
                Upload {isPortrait ? 'Mobile' : 'Desktop'} Image ({activeCfg.badge})
              </span>
              <span style={{ fontSize: '0.7rem', color: '#777' }}>
                {activeCfg.description}
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
              {(lastResult.originalSize / 1024).toFixed(0)} KB →{' '}
              <strong>{(lastResult.compressedSize / 1024).toFixed(1)} KB</strong> ({lastResult.width}x{lastResult.height})
            </span>
          </div>
          <span style={{ color: '#4ade80', fontWeight: 600 }}>
            {COMPRESSION_PROFILES[lastResult.profile || selectedProfile].badge} · -{lastResult.savingsPercent}% Saved
          </span>
        </div>
      )}

      {/* Direct Image URL input */}
      <div>
        <label style={{ fontSize: '0.7rem', color: '#777', display: 'block', marginBottom: '4px' }}>
          Direct Image URL:
        </label>
        <input
          type="text"
          className="form-input"
          style={{ textAlign: 'left', fontSize: '0.75rem', padding: '6px 10px', height: '32px' }}
          value={currentUrl || ''}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://..."
        />
      </div>
    </div>
  );
};

export const HeroSlideEditor: React.FC = () => {
  const { heroSlides, updateHeroSlide, addHeroSlide, deleteHeroSlide } = useData();
  const [activeFilter, setActiveFilter] = useState<'all' | 'landscape' | 'portrait'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<Partial<HeroSlide>>({});

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
      order: heroSlides.length + 1,
      active: true,
    };
    addHeroSlide(newSlide);
    handleEdit(newSlide);
  };

  // Filter slides according to selected tab filter
  const filteredSlides = heroSlides.filter((slide) => {
    const slideTarget = slide.target || (slide.portrait_url && !slide.landscape_url ? 'portrait' : 'landscape');
    if (activeFilter === 'all') return true;
    return slideTarget === activeFilter;
  });

  const desktopCount = heroSlides.filter((s) => (s.target || 'landscape') === 'landscape').length;
  const mobileCount = heroSlides.filter((s) => s.target === 'portrait' || (s.portrait_url && !s.landscape_url)).length;

  return (
    <div>
      {/* Top Header & Action Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FFF' }}>Hero Slider Slides</h2>
          <p style={{ color: '#888', fontSize: '0.85rem', maxWidth: '750px', marginTop: '4px' }}>
            Manage separate slides for <strong>PC / Desktop</strong> and <strong>Phone / Mobile</strong>.
            Each visual has its own independent title, caption, and image uploaded directly to the <strong>Supabase Public Storage (`hero`) bucket</strong>.
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

      {/* Slides List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {filteredSlides.map((slide, idx) => {
          const isEditing = editingId === slide.id;
          const slideTarget: HeroSlideTarget = slide.target || (slide.portrait_url && !slide.landscape_url ? 'portrait' : 'landscape');
          const isPortrait = slideTarget === 'portrait';
          const slideImage = slide.image_url || slide.landscape_url || slide.portrait_url || '';

          return (
            <div key={slide.id} className="admin-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-gold)' }}>
                    #{idx + 1}
                  </span>

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
