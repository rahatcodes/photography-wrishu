import React, { useState } from 'react';
import { useData } from '../../lib/dataContext.tsx';
import { ResponsiveImage } from '../../components/ResponsiveImage.tsx';
import { Lightbox } from '../../components/Lightbox.tsx';
import { SeoHead } from '../../components/SeoHead.tsx';
import type { Photo } from '../../types/index.ts';

interface CategoryPageProps {
  categorySlug: string;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({ categorySlug }) => {
  const { categories, photos } = useData();
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const category = categories.find((c) => c.slug === categorySlug);
  const categoryTitle = category?.title || categorySlug.replace(/-/g, ' ').toUpperCase();

  // Filter photos matching this category (strictly excluding photos that belong to project galleries)
  const categoryPhotos = photos.filter((p) => p.category_id === categorySlug && !p.project_id);

  const selectedPhoto: Photo | null =
    selectedPhotoIndex !== null ? categoryPhotos[selectedPhotoIndex] : null;

  return (
    <div className="category-page-container">
      <SeoHead
        title={categoryTitle}
        description={`Portfolio gallery of ${categoryTitle} by Navid Mustasim Wrishu.`}
      />

      <div className="site-container">
        {/* Section Title with gold dash underneath */}
        <div className="section-heading-wrap">
          <h1 className="section-title">{categoryTitle}</h1>
          <div className="gold-divider-dash" />
          {category?.description && (
            <p style={{ marginTop: '14px', color: '#888', fontSize: '0.95rem' }}>
              {category.description}
            </p>
          )}
        </div>

        {/* Single Column, centered, one image at a time */}
        <div className="category-stream">
          {categoryPhotos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#777' }}>
              <p>No photos uploaded to this category yet.</p>
            </div>
          ) : (
            categoryPhotos.map((photo, index) => {
              const isLandscape = photo.orientation === 'landscape';

              return (
                <article
                  key={photo.id}
                  className="category-stream-item"
                  onClick={() => setSelectedPhotoIndex(index)}
                  aria-label={photo.title || photo.alt}
                >
                  <div
                    className={`category-image-frame ${
                      isLandscape ? 'landscape' : 'portrait'
                    }`}
                  >
                    <ResponsiveImage
                      src={photo.url}
                      variants={photo.variants}
                      alt={photo.alt}
                      width={photo.width}
                      height={photo.height}
                      lqip={photo.lqip}
                      priority={index === 0}
                      sizes={isLandscape ? '(max-width: 768px) 100vw, 1100px' : '(max-width: 768px) 100vw, 700px'}
                    />
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      {/* Lightbox - clean presentation without titles/captions on catalog pages */}
      {selectedPhoto && (
        <Lightbox
          isOpen={selectedPhotoIndex !== null}
          onClose={() => setSelectedPhotoIndex(null)}
          imageUrl={selectedPhoto.url}
          altText={selectedPhoto.alt}
          showCaption={false}
          hasPrev={selectedPhotoIndex! > 0}
          hasNext={selectedPhotoIndex! < categoryPhotos.length - 1}
          onPrev={() => setSelectedPhotoIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev))}
          onNext={() =>
            setSelectedPhotoIndex((prev) =>
              prev !== null && prev < categoryPhotos.length - 1 ? prev + 1 : prev
            )
          }
        />
      )}
    </div>
  );
};
