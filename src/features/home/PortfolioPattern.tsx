import React from 'react';
import { useData } from '../../lib/dataContext.tsx';
import { buildOneLandscapeThreePortraitsRows } from '../../lib/galleryLayout.ts';
import { ResponsiveImage } from '../../components/ResponsiveImage.tsx';
import type { Photo } from '../../types/index.ts';

interface PortfolioPatternProps {
  onPhotoClick: (photo: Photo) => void;
}

export const PortfolioPattern: React.FC<PortfolioPatternProps> = ({ onPhotoClick }) => {
  const { photos } = useData();

  // Filter photos configured for home gallery
  const homePhotos = photos.filter((p) => p.home_gallery);
  const rows = buildOneLandscapeThreePortraitsRows(homePhotos);

  return (
    <section className="gallery-pattern-section" id="portfolio">
      <div className="gallery-container">
        {/* Section Heading matching screenshot: Latest Works with small gold dash */}
        <div className="section-heading-wrap">
          <h2 className="section-title">
            Latest <span className="section-title-gold">Works</span>
          </h2>
          <div className="gold-divider-dash" />
        </div>

        {/* 1L + 3P Repeating Pattern */}
        <div>
          {rows.map((row, rowIdx) => {
            if (row.type === 'landscape') {
              const photo = row.items[0];
              if (!photo) return null;
              return (
                <div key={`row-${rowIdx}`} className="gallery-row-landscape">
                  <div
                    className="gallery-landscape-item"
                    onClick={() => onPhotoClick(photo)}
                  >
                    <ResponsiveImage
                      src={photo.url}
                      variants={photo.variants}
                      alt={photo.alt}
                      width={photo.width}
                      height={photo.height}
                      lqip={photo.lqip}
                      sizes="(max-width: 768px) 100vw, 1380px"
                    />
                  </div>
                </div>
              );
            }

            // Portraits row (up to 3 items)
            return (
              <div key={`row-${rowIdx}`} className="gallery-row-portraits">
                {row.items.map((photo) => (
                  <div
                    key={photo.id}
                    className="gallery-portrait-item"
                    onClick={() => onPhotoClick(photo)}
                  >
                    <ResponsiveImage
                      src={photo.url}
                      variants={photo.variants}
                      alt={photo.alt}
                      width={photo.width}
                      height={photo.height}
                      lqip={photo.lqip}
                      sizes="(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 440px"
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
