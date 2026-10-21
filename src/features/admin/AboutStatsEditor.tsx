import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../../lib/dataContext.tsx';
import { Save, Plus, Trash2, Camera, UploadCloud, CheckCircle2, Loader2, CloudUpload } from 'lucide-react';
import type { StatItem, SiteSettings } from '../../types/index.ts';
import { CircularImageCropperModal } from '../../components/CircularImageCropperModal.tsx';

interface AboutStatsEditorProps {
  onNotify: (msg: string) => void;
}

export const AboutStatsEditor: React.FC<AboutStatsEditorProps> = ({ onNotify }) => {
  const { settings, updateSettings, stats, updateStats, syncSettingsToCloud } = useData();

  const [aboutLabel, setAboutLabel] = useState(settings.about_label);
  const [aboutName, setAboutName] = useState(settings.about_name);
  const [aboutNameGold, setAboutNameGold] = useState(settings.about_name_gold);
  const [aboutRoles, setAboutRoles] = useState(settings.about_roles);
  const [paragraphs, setParagraphs] = useState<string[]>([...settings.about_paragraphs]);
  const [portraitUrl, setPortraitUrl] = useState(settings.about_portrait_url);
  const [isSaving, setIsSaving] = useState(false);

  // Synchronize when settings are fetched from Supabase cloud database
  useEffect(() => {
    if (settings.about_portrait_url) {
      setPortraitUrl(settings.about_portrait_url);
    }
    if (settings.about_name) setAboutName(settings.about_name);
    if (settings.about_name_gold) setAboutNameGold(settings.about_name_gold);
    if (settings.about_roles) setAboutRoles(settings.about_roles);
    if (settings.about_label) setAboutLabel(settings.about_label);
    if (Array.isArray(settings.about_paragraphs) && settings.about_paragraphs.length > 0) {
      setParagraphs([...settings.about_paragraphs]);
    }
  }, [settings]);

  const [statsList, setStatsList] = useState<StatItem[]>([...stats]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropperModalOpen, setCropperModalOpen] = useState(false);
  const [selectedCropFile, setSelectedCropFile] = useState<File | null>(null);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (PNG, JPG, WebP).');
        return;
      }
      setSelectedCropFile(file);
      setCropperModalOpen(true);
      e.target.value = '';
    }
  };

  const handleCropComplete = async (newUrl: string) => {
    setPortraitUrl(newUrl);
    updateSettings({
      about_portrait_url: newUrl,
    });
    const res = await syncSettingsToCloud({
      about_portrait_url: newUrl,
    });
    if (res.success) {
      onNotify('Profile portrait cropped, uploaded, and published to all devices!');
    } else {
      onNotify('Profile portrait saved locally.');
    }
  };

  const handleParagraphChange = (index: number, val: string) => {
    const updated = [...paragraphs];
    updated[index] = val;
    setParagraphs(updated);
  };

  const handleAddParagraph = () => {
    setParagraphs([...paragraphs, '']);
  };

  const handleRemoveParagraph = (index: number) => {
    setParagraphs(paragraphs.filter((_, i) => i !== index));
  };

  const handleStatChange = (index: number, field: keyof StatItem, val: unknown) => {
    const updated = [...statsList];
    updated[index] = { ...updated[index], [field]: val };
    setStatsList(updated);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    const updatedSettings: Partial<SiteSettings> = {
      about_label: aboutLabel,
      about_name: aboutName,
      about_name_gold: aboutNameGold,
      about_roles: aboutRoles,
      about_paragraphs: paragraphs.filter((p) => p.trim().length > 0),
      about_portrait_url: portraitUrl,
    };
    updateSettings(updatedSettings);
    const res = await syncSettingsToCloud(updatedSettings);
    updateStats(statsList);
    setIsSaving(false);
    if (res.success) {
      onNotify('About section, profile portrait, and stats published to all devices!');
    } else {
      onNotify('Saved locally. Note: Check Supabase database policy.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FFF' }}>About Section & Stats</h2>
          <p style={{ color: '#888', fontSize: '0.85rem' }}>
            Modify biographical details, highlighted headline, circular portrait photo, and match count statistics.
          </p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="btn btn-gold btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 18px', fontWeight: 700 }}
        >
          {isSaving ? <Loader2 size={15} className="spin" /> : <CloudUpload size={15} />}
          <span>{isSaving ? 'Publishing...' : 'Save & Publish to All Devices'}</span>
        </button>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">Headline & Roles</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '20px' }}>
          <div className="form-group">
            <label style={{ fontSize: '0.78rem', color: '#AAA', display: 'block', marginBottom: '6px' }}>
              Gold Kicker Label
            </label>
            <input
              type="text"
              className="form-input"
              style={{ textAlign: 'left' }}
              value={aboutLabel}
              onChange={(e) => setAboutLabel(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.78rem', color: '#AAA', display: 'block', marginBottom: '6px' }}>
              Primary Headline Text
            </label>
            <input
              type="text"
              className="form-input"
              style={{ textAlign: 'left' }}
              value={aboutName}
              onChange={(e) => setAboutName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.78rem', color: 'var(--color-gold)', display: 'block', marginBottom: '6px' }}>
              Gold Accent Text (Last Name)
            </label>
            <input
              type="text"
              className="form-input"
              style={{ textAlign: 'left', color: 'var(--color-gold)' }}
              value={aboutNameGold}
              onChange={(e) => setAboutNameGold(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label style={{ fontSize: '0.78rem', color: '#AAA', display: 'block', marginBottom: '6px' }}>
            Professional Roles Subtitle
          </label>
          <input
            type="text"
            className="form-input"
            style={{ textAlign: 'left' }}
            value={aboutRoles}
            onChange={(e) => setAboutRoles(e.target.value)}
          />
        </div>

        {/* Circular Profile Portrait Section */}
        <div
          style={{
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FFF', margin: 0 }}>
              Circular Monochrome Portrait (About Section)
            </label>
            <span
              style={{
                fontSize: '0.68rem',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(200, 145, 74, 0.15)',
                color: 'var(--color-gold)',
                fontWeight: 600,
              }}
            >
              Homepage Round Avatar
            </span>
          </div>

          <p style={{ fontSize: '0.78rem', color: '#888', margin: '0 0 16px 0' }}>
            Upload a profile photo and use the <strong>LinkedIn-style circular cropper</strong> to pan, reposition, and zoom in/out for the perfect framing.
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              flexWrap: 'wrap',
              backgroundColor: '#141414',
              padding: '18px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            {/* Circular Avatar Preview with interactive hover overlay */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: 'relative',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '3px solid var(--color-gold)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
                backgroundColor: '#1c1c1c',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              title="Click to upload & reposition photo"
            >
              {portraitUrl ? (
                <img
                  src={portraitUrl}
                  alt="Profile Portrait"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: 'grayscale(100%) contrast(1.1)',
                  }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '0.75rem' }}>
                  No Photo
                </div>
              )}

              {/* Hover Camera Overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.55)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  opacity: 0,
                  transition: 'opacity 150ms ease',
                  color: '#FFF',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
              >
                <Camera size={22} color="var(--color-gold)" />
                <span style={{ fontSize: '0.68rem', fontWeight: 600 }}>Change</span>
              </div>
            </div>

            {/* Actions & URL Input */}
            <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileSelected}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-gold btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontWeight: 700 }}
                >
                  <Camera size={15} />
                  <span>Upload & Reposition Photo</span>
                </button>
              </div>

              {/* Direct URL input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.7rem', color: '#777', margin: 0 }}>
                  Image CDN URL (Cloudflare / Storage):
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ textAlign: 'left', fontSize: '0.78rem', height: '32px' }}
                  value={portraitUrl}
                  onChange={(e) => setPortraitUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Paragraphs Editor */}
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="admin-card-title" style={{ margin: 0 }}>Bio Paragraphs</h3>
          <button onClick={handleAddParagraph} className="btn btn-sm" style={{ padding: '4px 10px' }}>
            <Plus size={14} /> Add Paragraph
          </button>
        </div>

        {paragraphs.map((p, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--color-gold)', fontWeight: 700, paddingTop: '10px' }}>
              #{idx + 1}
            </span>
            <textarea
              className="form-input"
              rows={3}
              style={{ textAlign: 'left', minHeight: '80px', flex: 1 }}
              value={p}
              onChange={(e) => handleParagraphChange(idx, e.target.value)}
            />
            <button
              onClick={() => handleRemoveParagraph(idx)}
              style={{ background: 'none', border: 'none', color: '#f87171', padding: '10px', cursor: 'pointer' }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Animated Match Stats */}
      <div className="admin-card">
        <h3 className="admin-card-title">Animated Match Statistics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          {statsList.map((stat, idx) => (
            <div key={stat.id} style={{ background: '#202020', padding: '16px', borderRadius: '4px' }}>
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '0.75rem', color: '#AAA' }}>Stat Label</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ textAlign: 'left' }}
                  value={stat.label}
                  onChange={(e) => handleStatChange(idx, 'label', e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label style={{ fontSize: '0.75rem', color: '#AAA' }}>Target Number</label>
                  <input
                    type="number"
                    className="form-input"
                    style={{ textAlign: 'left' }}
                    value={stat.value}
                    onChange={(e) => handleStatChange(idx, 'value', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="form-group" style={{ width: '80px', marginBottom: 0 }}>
                  <label style={{ fontSize: '0.75rem', color: '#AAA' }}>Suffix</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ textAlign: 'left' }}
                    value={stat.suffix || ''}
                    onChange={(e) => handleStatChange(idx, 'suffix', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LinkedIn-Style Circular Crop & Reposition Modal */}
      <CircularImageCropperModal
        isOpen={cropperModalOpen}
        imageFile={selectedCropFile}
        onClose={() => {
          setCropperModalOpen(false);
          setSelectedCropFile(null);
        }}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};
