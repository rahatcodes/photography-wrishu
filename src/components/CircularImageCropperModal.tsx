import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  UploadCloud,
  Check,
  Loader2,
  Move,
  Camera,
} from 'lucide-react';
import { uploadProfilePortraitImage } from '../lib/imageEngine.ts';

interface CircularImageCropperModalProps {
  isOpen: boolean;
  imageFile: File | null;
  onClose: () => void;
  onCropComplete: (url: string) => void;
}

const VIEWPORT_SIZE = 340; // Size of the interactive preview square
const CIRCLE_DIAMETER = 260; // Diameter of circular crop window
const OUTPUT_CANVAS_SIZE = 800; // Crisp high-res avatar output

export const CircularImageCropperModal: React.FC<CircularImageCropperModalProps> = ({
  isOpen,
  imageFile,
  onClose,
  onCropComplete,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [naturalWidth, setNaturalWidth] = useState(0);
  const [naturalHeight, setNaturalHeight] = useState(0);

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, initialOffsetX: 0, initialOffsetY: 0 });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState('');
  const [uploadPercent, setUploadPercent] = useState(0);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  // Load the selected File into a blob object URL
  useEffect(() => {
    if (!imageFile) {
      setImageSrc(null);
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    const img = new Image();
    img.onload = () => {
      setNaturalWidth(img.naturalWidth);
      setNaturalHeight(img.naturalHeight);
      setImageSrc(objectUrl);
      // Reset transform when new image loads
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
    };
    img.src = objectUrl;

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);

  // Handle Drag / Pan (MouseDown & TouchStart)
  const handlePointerDown = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      initialOffsetX: offset.x,
      initialOffsetY: offset.y,
    };
  };

  const handlePointerMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging) return;
      const deltaX = clientX - dragStartRef.current.x;
      const deltaY = clientY - dragStartRef.current.y;
      setOffset({
        x: dragStartRef.current.initialOffsetX + deltaX,
        y: dragStartRef.current.initialOffsetY + deltaY,
      });
    },
    [isDragging]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Global mouseup listener to catch release outside the viewport
  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY);
    const onMouseUp = () => handlePointerUp();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((prev) => {
      const step = e.deltaY < 0 ? 0.08 : -0.08;
      const next = prev + step;
      return Math.max(1, Math.min(3, parseFloat(next.toFixed(2))));
    });
  };

  const handleReset = () => {
    setOffset({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  // Perform Canvas crop & upload
  const handleApplyAndUpload = async () => {
    if (!imageSrc || !imgRef.current) return;

    setIsUploading(true);
    setUploadStage('Cropping high-res circular portrait...');
    setUploadPercent(20);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_CANVAS_SIZE;
      canvas.height = OUTPUT_CANVAS_SIZE;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas 2D context unavailable');
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Base scaling to fit circle at zoom=1
      const baseScale = Math.max(
        CIRCLE_DIAMETER / naturalWidth,
        CIRCLE_DIAMETER / naturalHeight
      );

      const scaleRatio = OUTPUT_CANVAS_SIZE / CIRCLE_DIAMETER;

      ctx.save();
      // Center canvas
      ctx.translate(OUTPUT_CANVAS_SIZE / 2, OUTPUT_CANVAS_SIZE / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(offset.x * scaleRatio, offset.y * scaleRatio);
      ctx.scale(zoom, zoom);

      const drawWidth = naturalWidth * baseScale * scaleRatio;
      const drawHeight = naturalHeight * baseScale * scaleRatio;

      ctx.drawImage(
        imgRef.current,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight
      );
      ctx.restore();

      // Convert canvas to WebP Blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Canvas export failed'));
          },
          'image/webp',
          0.88
        );
      });

      setUploadStage('Uploading profile photo to storage...');
      setUploadPercent(60);

      // Upload to Cloudflare R2 / Supabase Bucket
      const result = await uploadProfilePortraitImage(
        blob,
        `profile-portrait-${Date.now()}.webp`,
        (pct, stage) => {
          setUploadPercent(pct);
          setUploadStage(stage);
        }
      );

      onCropComplete(result.url);
      onClose();
    } catch (err) {
      console.error('Profile photo crop & upload error:', err);
      const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      alert(`Upload note: ${msg}`);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen || !imageFile) return null;

  // Base display scale so image at 1x zoom completely covers the circular viewport
  const baseScale =
    naturalWidth && naturalHeight
      ? Math.max(CIRCLE_DIAMETER / naturalWidth, CIRCLE_DIAMETER / naturalHeight)
      : 1;

  const displayWidth = naturalWidth * baseScale;
  const displayHeight = naturalHeight * baseScale;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: '#161616',
          border: '1px solid #333',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #282828',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Camera size={18} color="var(--color-gold)" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#FFF' }}>
              Crop & Reposition Profile Photo
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Crop Viewport Area */}
        <div
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            backgroundColor: '#0d0d0d',
          }}
        >
          {/* Interactive Crop Box */}
          <div
            ref={viewportRef}
            onWheel={handleWheel}
            onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
            onTouchStart={(e) => {
              if (e.touches[0]) {
                handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
              }
            }}
            onTouchMove={(e) => {
              if (e.touches[0]) {
                handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
              }
            }}
            onTouchEnd={handlePointerUp}
            style={{
              width: `${VIEWPORT_SIZE}px`,
              height: `${VIEWPORT_SIZE}px`,
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: '#050505',
              borderRadius: '8px',
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
              touchAction: 'none',
            }}
          >
            {/* The Image being transformed */}
            {imageSrc && (
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop preview"
                draggable={false}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: `${displayWidth}px`,
                  height: `${displayHeight}px`,
                  maxWidth: 'none',
                  maxHeight: 'none',
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) rotate(${rotation}deg) scale(${zoom})`,
                  transformOrigin: 'center center',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  transition: isDragging ? 'none' : 'transform 80ms ease-out',
                }}
              />
            )}

            {/* Circular Cutout Mask & Overlay */}
            <div
              style={{
                position: 'absolute',
                top: `${(VIEWPORT_SIZE - CIRCLE_DIAMETER) / 2}px`,
                left: `${(VIEWPORT_SIZE - CIRCLE_DIAMETER) / 2}px`,
                width: `${CIRCLE_DIAMETER}px`,
                height: `${CIRCLE_DIAMETER}px`,
                borderRadius: '50%',
                border: '2px solid var(--color-gold)',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.72)',
                pointerEvents: 'none',
              }}
            >
              {/* Subtle 3x3 Grid Overlay inside circle for precise framing */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  pointerEvents: 'none',
                  opacity: 0.25,
                }}
              >
                <div style={{ position: 'absolute', left: '33.33%', top: 0, bottom: 0, width: '1px', backgroundColor: '#FFF' }} />
                <div style={{ position: 'absolute', left: '66.66%', top: 0, bottom: 0, width: '1px', backgroundColor: '#FFF' }} />
                <div style={{ position: 'absolute', top: '33.33%', left: 0, right: 0, height: '1px', backgroundColor: '#FFF' }} />
                <div style={{ position: 'absolute', top: '66.66%', left: 0, right: 0, height: '1px', backgroundColor: '#FFF' }} />
              </div>
            </div>

            {/* Drag helper hint */}
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                color: '#BBB',
                fontSize: '0.68rem',
                padding: '3px 10px',
                borderRadius: '12px',
                pointerEvents: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Move size={11} /> Drag to Reposition
            </div>
          </div>

          {/* Controls Bar: Zoom, Rotate, Reset */}
          <div
            style={{
              width: '100%',
              maxWidth: `${VIEWPORT_SIZE}px`,
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {/* Zoom Slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.max(1, parseFloat((prev - 0.1).toFixed(2))))}
                title="Zoom Out"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#999',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <ZoomOut size={16} />
              </button>

              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                style={{
                  flex: 1,
                  accentColor: 'var(--color-gold)',
                  cursor: 'pointer',
                  height: '4px',
                }}
              />

              <button
                type="button"
                onClick={() => setZoom((prev) => Math.min(3, parseFloat((prev + 0.1).toFixed(2))))}
                title="Zoom In"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#999',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <ZoomIn size={16} />
              </button>

              <span style={{ fontSize: '0.75rem', color: 'var(--color-gold)', fontWeight: 600, minWidth: '35px', textAlign: 'right' }}>
                {zoom.toFixed(1)}x
              </span>
            </div>

            {/* Sub-tools: Rotate 90 & Reset Center */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className="btn btn-sm"
                style={{
                  fontSize: '0.74rem',
                  padding: '4px 10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderColor: '#383838',
                }}
              >
                <RotateCw size={13} /> Rotate 90°
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="btn btn-sm"
                style={{
                  fontSize: '0.74rem',
                  padding: '4px 10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderColor: '#383838',
                }}
              >
                <RefreshCw size={12} /> Reset Center
              </button>
            </div>
          </div>

          {/* Progress bar when uploading */}
          {isUploading && (
            <div style={{ width: '100%', maxWidth: `${VIEWPORT_SIZE}px` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#AAA', marginBottom: '4px' }}>
                <span>{uploadStage}</span>
                <span>{uploadPercent}%</span>
              </div>
              <div style={{ width: '100%', height: '4px', backgroundColor: '#333', borderRadius: '2px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${uploadPercent}%`,
                    height: '100%',
                    backgroundColor: 'var(--color-gold)',
                    transition: 'width 150ms ease',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid #282828',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="btn btn-sm"
            style={{ borderColor: '#444' }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApplyAndUpload}
            disabled={isUploading}
            className="btn btn-gold btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              fontWeight: 700,
            }}
          >
            {isUploading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Saving Photo...</span>
              </>
            ) : (
              <>
                <Check size={15} />
                <span>Apply & Upload Photo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
