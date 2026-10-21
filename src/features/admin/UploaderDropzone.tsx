import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, Server, Globe, Loader2, Sparkles } from 'lucide-react';
import { uploadCatalogImageToR2, UploadR2Result } from '../../lib/storageService.ts';
import { CompressionProfile, COMPRESSION_PROFILES } from '../../lib/imageCompression.ts';
import type { Photo } from '../../types/index.ts';

interface UploaderDropzoneProps {
  categoryId: string;
  onUploadComplete: (photo: Photo) => void;
}

export const UploaderDropzone: React.FC<UploaderDropzoneProps> = ({
  categoryId,
  onUploadComplete,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [recentUpload, setRecentUpload] = useState<UploadR2Result | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<CompressionProfile>('compact');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeCfg = COMPRESSION_PROFILES[selectedProfile];

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WebP, AVIF).');
      return;
    }

    setIsProcessing(true);
    setProgressStage(`Initializing ${activeCfg.label}...`);
    setProgressPercent(10);
    setRecentUpload(null);

    try {
      // Compresses with selected profile and uploads to Cloudflare R2
      const result = await uploadCatalogImageToR2(
        file,
        categoryId,
        (stage, pct) => {
          setProgressStage(stage);
          setProgressPercent(pct);
        },
        selectedProfile
      );

      setRecentUpload(result);

      // Create Photo model pointing to Cloudflare R2 CDN URL
      const newPhoto: Photo = {
        id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        category_id: categoryId,
        url: result.url,
        variants: result.variants,
        width: result.width,
        height: result.height,
        orientation: result.orientation,
        lqip: result.lqip,
        alt: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        order: 1,
        featured: false,
        home_gallery: true,
        created_at: new Date().toISOString(),
      };

      onUploadComplete(newPhoto);
    } catch (err) {
      console.error('Upload / Compression error:', err);
      alert('Failed to process image. Please try another file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => processFile(file));
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      {/* Storage & Engine Info Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          fontSize: '0.82rem',
          color: '#AAA',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Server size={15} color="var(--color-gold)" />
          <span>Storage Target: <strong>Cloudflare R2 Bucket</strong> (High-speed global CDN)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-gold)' }}>
          <Globe size={14} />
          <span>Active Profile: <strong>{activeCfg.badge}</strong></span>
        </div>
      </div>

      {/* Quality Profile Selector */}
      <div
        style={{
          backgroundColor: '#161616',
          border: '1px solid #2a2a2a',
          borderRadius: '6px',
          padding: '12px 14px',
          marginBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#DDD', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} color="var(--color-gold)" />
            Catalog Photo Compression Profile:
          </span>
          <span style={{ fontSize: '0.72rem', color: '#888' }}>
            {activeCfg.description}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {(['compact', 'balanced', 'ultra'] as CompressionProfile[]).map((pKey) => {
            const p = COMPRESSION_PROFILES[pKey];
            const isSelected = selectedProfile === pKey;
            return (
              <button
                key={pKey}
                type="button"
                onClick={() => setSelectedProfile(pKey)}
                style={{
                  padding: '8px 10px',
                  borderRadius: '4px',
                  border: isSelected ? '1px solid var(--color-gold)' : '1px solid #333',
                  backgroundColor: isSelected ? 'rgba(200, 145, 74, 0.16)' : '#1a1a1a',
                  color: isSelected ? '#FFF' : '#888',
                  fontSize: '0.76rem',
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
      </div>

      {/* Drag & Drop Zone */}
      <div
        className={`dropzone-box ${dragOver ? 'dragover' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
        />
        <UploadCloud size={38} color="var(--color-gold)" style={{ margin: '0 auto 10px' }} />
        <p style={{ color: '#FFFFFF', fontWeight: 600, fontSize: '0.95rem' }}>
          Drag & drop photos here, or click to browse
        </p>
        <p style={{ color: '#888888', fontSize: '0.8rem', marginTop: '6px' }}>
          Mode: <strong style={{ color: 'var(--color-gold)' }}>{activeCfg.label}</strong> · {activeCfg.description}
        </p>
      </div>

      {/* Processing State */}
      {isProcessing && (
        <div style={{ marginTop: '14px', background: '#1c1c1c', padding: '14px', borderRadius: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#DDD', marginBottom: '6px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Loader2 size={14} className="animate-spin" color="var(--color-gold)" />
              {progressStage}
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div style={{ width: '100%', height: '4px', backgroundColor: '#333', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                backgroundColor: 'var(--color-gold)',
                transition: 'width 200ms ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Compression Savings Report */}
      {recentUpload && (
        <div className="compression-item">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={18} color="#4ade80" />
            <span>
              Original: <strong>{(recentUpload.originalSize / 1024).toFixed(0)} KB</strong>
              {' → '}
              Compressed: <strong>{(recentUpload.compressedSize / 1024).toFixed(1)} KB</strong>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '3px', backgroundColor: 'rgba(200, 145, 74, 0.2)', color: 'var(--color-gold)', fontWeight: 600 }}>
              {COMPRESSION_PROFILES[recentUpload.profile || selectedProfile].badge}
            </span>
            <span className="savings-tag">-{recentUpload.savingsPercent}% Saved</span>
            <span style={{ fontSize: '0.75rem', color: '#888' }}>
              ({recentUpload.width}x{recentUpload.height} {recentUpload.orientation}) ·{' '}
              <strong style={{ color: recentUpload.storage === 'r2' ? '#4ade80' : 'var(--color-gold)' }}>
                {recentUpload.storage === 'r2' ? 'Cloudflare R2' : 'Local Storage'}
              </strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
