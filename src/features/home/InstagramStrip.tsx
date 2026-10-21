import React from 'react';
import { Instagram } from 'lucide-react';
import { useData } from '../../lib/dataContext.tsx';

interface InstagramStripProps {
  onPhotoClick?: (url: string, alt: string) => void;
}

export const InstagramStrip: React.FC<InstagramStripProps> = ({ onPhotoClick }) => {
  const { photos, settings } = useData();

  // 6 preview items
  const stripPhotos = photos.slice(0, 6);

  return (
    <div className="instagram-strip" aria-label="Social media feed preview">
      {stripPhotos.map((photo, idx) => (
        <div
          key={`strip-${photo.id}-${idx}`}
          className="instagram-strip-item"
          onClick={() => onPhotoClick?.(photo.url, photo.alt)}
          style={{ cursor: 'pointer' }}
        >
          <img
            src={photo.variants?.[480] || photo.url}
            alt={photo.alt}
            loading="lazy"
            decoding="async"
            width={300}
            height={300}
          />
        </div>
      ))}

      {/* Floating Center Gold Badge */}
      <a
        href={settings.social_links?.instagram || 'https://instagram.com'}
        target="_blank"
        rel="noopener noreferrer"
        className="instagram-follow-badge"
        onClick={(e) => e.stopPropagation()}
      >
        <Instagram size={16} />
        <span>FOLLOW ME</span>
      </a>
    </div>
  );
};
