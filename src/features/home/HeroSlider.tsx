import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useData } from '../../lib/dataContext.tsx';

export const HeroSlider: React.FC = () => {
  const { heroSlides } = useData();
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  const [currentIdx, setCurrentIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);

  // Monitor screen width changes to dynamically swap between PC/Landscape and Phone/Portrait slides
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const onChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      setCurrentIdx(0); // reset slider to first slide on orientation/device change
    };

    setIsMobile(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  // Filter slides tailored specifically to the active device screen:
  // - On Mobile (< 768px): Show Phone/Portrait slides with their dedicated mobile title & caption
  // - On Desktop (>= 768px): Show PC/Landscape slides with their dedicated desktop title & caption
  const targetType = isMobile ? 'portrait' : 'landscape';
  let activeSlides = heroSlides.filter(
    (s) =>
      s.active &&
      (s.target === targetType ||
        (!s.target && (isMobile ? Boolean(s.portrait_url) : Boolean(s.landscape_url))))
  );

  // Graceful fallback: If no slides match the specific target type, use all active slides
  if (activeSlides.length === 0) {
    activeSlides = heroSlides.filter((s) => s.active);
  }

  // Sort strictly by sequential order so the slider displays and cycles in the admin-specified sequence
  activeSlides.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

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

        // Obtain the dedicated image for this slide
        const imageUrl =
          slide.image_url ||
          (isMobile ? slide.portrait_url : slide.landscape_url) ||
          slide.landscape_url ||
          slide.portrait_url ||
          '';

        return (
          <div
            key={slide.id}
            className={`hero-slide ${isCurrent ? 'active' : ''}`}
            aria-hidden={!isCurrent}
          >
            <div className="hero-image-wrap">
              <img
                src={imageUrl}
                alt={slide.title}
                loading={isFirst ? 'eager' : 'lazy'}
                fetchPriority={isFirst ? 'high' : 'auto'}
                decoding="async"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: isMobile ? 'center 35%' : 'center 25%',
                  imageRendering: 'auto',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'translateZ(0)',
                }}
              />
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
