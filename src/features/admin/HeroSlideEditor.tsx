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
  ExternalLink,
  Sliders,
} from 'lucide-react';
import type { HeroSlide } from '../../types/index.ts';
import { uploadHeroImageToSupabase, UploadHeroResult } from '../../lib/storageService.ts';

interface HeroImageUploaderProps {
  label: string;
  sublabel: string;
  currentUrl: string;
  orientation: 'landscape' | 'portrait';
  aspectHint: string;
  onUrlChange: (newUrl: string) => void;
}

const HeroImageUploader: React.FC<HeroImageUploaderProps> = ({
  label,
  sublabel,
  currentUrl,
  orientation,
  aspectHint,
  onUrlChange,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [lastResult, setLastResult] = useState<UploadHeroResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WebP, etc.).');
      return;
    }

    setIsUploading(true);
    setProgressStage('Starting compression...');
    setProgressPercent(10);
    setLastResult(null);

    try {
      const result = await uploadHeroImageToSupabase(file, orientation, (stage, pct) => {
        setProgressStage(stage);
        setProgressPercent(pct);
      });

      setLastResult(result);
      onUrlChange(result.url);
    } catch (err) {
      console.error('Hero upload error:', err);
      alert('Upload failed. Please check the console or try another image.');
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
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FFF' }}>{label}</div>
          <div style={{ fontSize: '0.74rem', color: '#888' }}>
            {sublabel} · <span style={{ color: 'var(--color-gold)' }}>{aspectHint}</span>
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
      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '14px', alignItems: 'center' }}>
        <div
          style={{
            width: '100%',
            height: orientation === 'landscape' ? '85px' : '110px',
            backgroundColor: '#0f0f0f',
            border: '1px solid #333',
            borderRadius: '4px',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {currentUrl ? (
            <img
              src={currentUrl}
              alt={label}
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
            padding: '14px',
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
              <UploadCloud size={20} color="var(--color-gold)" />
              <span style={{ fontSize: '0.78rem', color: '#EEE', fontWeight: 600 }}>
                Drop image here or click to upload
              </span>
              <span style={{ fontSize: '0.7rem', color: '#777' }}>
                Auto-compressed strictly below 100 KB for zero-lag hero delivery
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
            -{lastResult.savingsPercent}% Saved · {lastResult.storage === 'supabase' ? 'Supabase CDN' : 'Local'}
          </span>
        </div>
      )}

      {/* Direct URL input fallback */}
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<Partial<HeroSlide>>({});

  const handleEdit = (slide: HeroSlide) => {
    setEditingId(slide.id);
    setFormState({ ...slide });
  };

  const handleSave = (id: string) => {
    updateHeroSlide(id, formState);
    setEditingId(null);
  };

  const handleAddNew = () => {
    const newSlide: HeroSlide = {
      id: `hero-${Date.now()}`,
      title: 'Cinematic Match Coverage',
      subtitle: 'International Sports Storytelling',
      landscape_url: heroSlides[0]?.landscape_url || '',
      portrait_url: heroSlides[0]?.portrait_url || '',
      order: heroSlides.length + 1,
      active: true,
    };
    addHeroSlide(newSlide);
    handleEdit(newSlide);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FFF' }}>Hero Slider Slides</h2>
          <p style={{ color: '#888', fontSize: '0.85rem' }}>
            High-impact visual slider powered by <strong>Supabase Public Storage bucket (hero)</strong> for instant load speeds,
            with responsive dual delivery: landscape for desktops/tablets, portrait for mobile devices.
          </p>
        </div>
        <button onClick={handleAddNew} className="btn btn-gold btn-sm">
          <Plus size={16} />
          <span>Add Slide</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {heroSlides.map((slide, idx) => {
          const isEditing = editingId === slide.id;

          return (
            <div key={slide.id} className="admin-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-gold)' }}>
                    #{idx + 1}
                  </span>
                  <div style={{ width: '100px', height: '60px', overflow: 'hidden', borderRadius: '4px', background: '#222' }}>
                    <img src={slide.landscape_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', color: '#FFF', fontWeight: 600 }}>{slide.title}</h3>
                    <p style={{ fontSize: '0.82rem', color: '#888' }}>{slide.subtitle || 'No subtitle'}</p>
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

              {/* Editing Drawer Form with Direct Supabase Image Uploads */}
              {isEditing && (
                <div style={{ marginTop: '20px', borderTop: '1px solid #333', paddingTop: '20px' }}>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.78rem', color: 'var(--color-gold)', display: 'block', marginBottom: '6px' }}>
                      Slide Title / Headline
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ textAlign: 'left' }}
                      value={formState.title || ''}
                      onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '0.78rem', color: 'var(--color-gold)', display: 'block', marginBottom: '6px' }}>
                      Subtitle
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ textAlign: 'left' }}
                      value={formState.subtitle || ''}
                      onChange={(e) => setFormState({ ...formState, subtitle: e.target.value })}
                    />
                  </div>

                  {/* Dual Image Uploaders: Supabase Bucket "hero" */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                    <HeroImageUploader
                      label="Landscape Visual"
                      sublabel="Desktop & Tablet screens (>= 768px)"
                      aspectHint="16:9 / 3:2"
                      currentUrl={formState.landscape_url || ''}
                      orientation="landscape"
                      onUrlChange={(url) => setFormState((prev) => ({ ...prev, landscape_url: url }))}
                    />
                    <HeroImageUploader
                      label="Portrait Visual"
                      sublabel="Mobile screens (< 768px)"
                      aspectHint="9:16 / 4:5"
                      currentUrl={formState.portrait_url || ''}
                      orientation="portrait"
                      onUrlChange={(url) => setFormState((prev) => ({ ...prev, portrait_url: url }))}
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
      </div>
    </div>
  );
};
