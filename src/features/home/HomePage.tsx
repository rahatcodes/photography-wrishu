import React, { useState } from 'react';
import { HeroSlider } from './HeroSlider.tsx';
import { AboutSection } from './AboutSection.tsx';
import { PortfolioPattern } from './PortfolioPattern.tsx';
import { InstagramStrip } from './InstagramStrip.tsx';
import { Lightbox } from '../../components/Lightbox.tsx';
import { SeoHead } from '../../components/SeoHead.tsx';
import type { Photo } from '../../types/index.ts';

export const HomePage: React.FC = () => {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  return (
    <div style={{ backgroundColor: '#000000' }}>
      <SeoHead
        title="Wrishu Photography - Navid Mustasim Wrishu"
        description="Official portfolio of Navid Mustasim Wrishu — Sports, Street, Nature & Wildlife Photographer, Educator, and Entrepreneur."
      />

      {/* 1. Hero Slider */}
      <HeroSlider />

      {/* 2. About Section */}
      <AboutSection />

      {/* 3. Portfolio Pattern: 1 Landscape + 3 Portraits */}
      <PortfolioPattern onPhotoClick={(photo) => setSelectedPhoto(photo)} />

      {/* 4. Instagram / Social Preview Strip */}
      <InstagramStrip onPhotoClick={(url, alt) => setSelectedPhoto({
        id: 'strip-p',
        category_id: 'sports',
        url,
        variants: {},
        width: 800,
        height: 800,
        orientation: 'portrait',
        alt,
        order: 99,
        featured: false,
        home_gallery: false,
      })} />

      {/* Lightbox for clicked photos */}
      {selectedPhoto && (
        <Lightbox
          isOpen={Boolean(selectedPhoto)}
          onClose={() => setSelectedPhoto(null)}
          imageUrl={selectedPhoto.url}
          altText={selectedPhoto.alt}
          title={selectedPhoto.title}
        />
      )}
    </div>
  );
};
