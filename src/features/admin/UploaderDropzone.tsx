import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, Server, Globe, Loader2 } from 'lucide-react';
import { uploadCatalogImageToR2, UploadR2Result } from '../../lib/storageService.ts';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WebP, AVIF).');
      return;
    }

    setIsProcessing(true);
    setProgressStage('Initializing crisp compression...');
    setProgressPercent(10);
    setRecentUpload(null);

    try {
      // Compresses strictly below 100 KB and uploads to Cloudflare R2
      const result = await uploadCatalogImageToR2(file, categoryId, (stage, pct) => {
        setProgressStage(stage);
        setProgressPercent(pct);
      });

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
          marginBottom: '14px',
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
          <span>Target Size: <strong>&lt; 100 KB</strong> · Crisp Retina Precision</span>
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
        <UploadCloud size={40} color="var(--color-gold)" style={{ margin: '0 auto 12px' }} />
        <p style={{ color: '#FFFFFF', fontWeight: 600, fontSize: '0.95rem' }}>
          Drag & drop photos here, or click to browse
        </p>
        <p style={{ color: '#888888', fontSize: '0.82rem', marginTop: '6px' }}>
          Photos are automatically optimized <strong>under 100 KB</strong> with native resolution preserved, EXIF stripped,
          and uploaded directly to <strong>Cloudflare R2</strong>.
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
