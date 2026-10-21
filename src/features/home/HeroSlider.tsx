import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useData } from '../../lib/dataContext.tsx';

export const HeroSlider: React.FC = () => {
  const { heroSlides } = useData();
  const activeSlides = heroSlides.filter((s) => s.active);
  const [currentIdx, setCurrentIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const total = activeSlides.length;

  const nextSlide = useCallback(() => {
    if (total === 0) return;
    setCurrentIdx((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total === 0) return;
    setCurrentIdx((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Autoplay timer
  useEffect(() => {
    if (total <= 1) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 6000);
    return () => clearInterval(interval);
  }, [total, nextSlide]);

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (deltaX > 50) {
      prevSlide();
    } else if (deltaX < -50) {
      nextSlide();
    }
    touchStartX.current = null;
  };

  if (total === 0) return null;

  return (
    <section
      className="hero-slider-container"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Featured Photography Slider"
    >
      {activeSlides.map((slide, idx) => {
        const isCurrent = idx === currentIdx;
        const isFirst = idx === 0;

        return (
          <div
            key={slide.id}
            className={`hero-slide ${isCurrent ? 'active' : ''}`}
            aria-hidden={!isCurrent}
          >
            <div className="hero-image-wrap">
              {/* Picture tag with media queries: portrait on mobile (<768px), landscape on tablet/desktop (>=768px) */}
              <picture>
                <source
                  media="(max-width: 767px)"
                  srcSet={slide.portrait_url}
                />
                <source
                  media="(min-width: 768px)"
                  srcSet={slide.landscape_url}
                />
                <img
                  src={slide.landscape_url}
                  alt={slide.title}
                  loading={isFirst ? 'eager' : 'lazy'}
                  fetchPriority={isFirst ? 'high' : 'auto'}
                  decoding="async"
                />
              </picture>
            </div>

            <div className="hero-overlay">
              <div className="hero-content">
                <h1 className="hero-title">{slide.title}</h1>
                {slide.subtitle && (
                  <p style={{ color: '#DDD', fontSize: '1rem', letterSpacing: '0.05em', marginBottom: '20px' }}>
                    {slide.subtitle}
                  </p>
                )}

                {/* Slide Indicators: 01 02 03 ... */}
                <div className="hero-indicators">
                  {activeSlides.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      className={`indicator-number-btn ${dotIdx === currentIdx ? 'active' : ''}`}
                      onClick={() => setCurrentIdx(dotIdx)}
                      aria-label={`Go to slide ${dotIdx + 1}`}
                    >
                      {String(dotIdx + 1).padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Nav Arrows */}
      {total > 1 && (
        <>
          <button
            className="hero-nav-arrow prev"
            onClick={prevSlide}
            aria-label="Previous Slide"
          >
            <ChevronLeft size={28} />
          </button>
          <button
            className="hero-nav-arrow next"
            onClick={nextSlide}
            aria-label="Next Slide"
          >
            <ChevronRight size={28} />
          </button>
        </>
      )}
    </section>
  );
};
