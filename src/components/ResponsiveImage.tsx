import React, { useState, useRef, useEffect } from 'react';

interface ResponsiveImageProps {
  src: string;
  variants?: Record<number, string>;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  sizes?: string;
  lqip?: string;
  onClick?: () => void;
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  variants,
  alt,
  width,
  height,
  priority = false,
  className = '',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 50vw',
  lqip,
  onClick,
}) => {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // If already cached or complete, immediately mark loaded
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [src]);

  // Build srcset from variants
  let srcSetWebP = '';
  if (variants && Object.keys(variants).length > 0) {
    srcSetWebP = Object.entries(variants)
      .map(([w, url]) => `${url} ${w}w`)
      .join(', ');
  }

  return (
    <div
      className={`responsive-image-container ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        aspectRatio: width && height ? `${width} / ${height}` : undefined,
      }}
      onClick={onClick}
    >
      {/* LQIP blur-up layer only while primary image is loading */}
      {lqip && !loaded && (
        <img
          src={lqip}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(12px)',
            transform: 'scale(1.08)',
            opacity: 0.85,
            transition: 'opacity 300ms ease',
            pointerEvents: 'none',
          }}
        />
      )}

      <picture>
        {srcSetWebP && (
          <source
            type="image/webp"
            srcSet={srcSetWebP}
            sizes={sizes}
          />
        )}
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: loaded || priority || !lqip ? 1 : 0,
            transition: 'opacity 300ms ease-in-out',
          }}
        />
      </picture>
    </div>
  );
};
