import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ExternalLink } from 'lucide-react';

interface LazyMapProps {
  locationQuery?: string;
}

export const LazyMap: React.FC<LazyMapProps> = ({
  locationQuery = 'Kallyanpur, Dhaka, Bangladesh',
}) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const encodedQuery = encodeURIComponent(locationQuery);
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodedQuery}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
  const directMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '420px',
        backgroundColor: '#161616',
        borderRadius: '2px',
        overflow: 'hidden',
        position: 'relative',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {shouldLoad ? (
        <iframe
          title="Studio Location Map"
          src={mapEmbedUrl}
          width="100%"
          height="100%"
          style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) contrast(90%)' }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            color: '#888',
          }}
        >
          <MapPin size={36} color="var(--color-gold)" />
          <span style={{ fontSize: '0.95rem' }}>{locationQuery}</span>
          <button
            onClick={() => setShouldLoad(true)}
            className="btn btn-gold btn-sm"
          >
            Load Interactive Map
          </button>
        </div>
      )}

      {/* Direct link badge overlay */}
      <a
        href={directMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          background: 'rgba(0, 0, 0, 0.85)',
          padding: '8px 14px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          color: '#FFFFFF',
          fontSize: '0.78rem',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontFamily: 'var(--font-display)',
          textDecoration: 'none',
          zIndex: 10,
        }}
      >
        <span>Open in Google Maps</span>
        <ExternalLink size={13} />
      </a>
    </div>
  );
};
