import React from 'react';
import { Camera, ChevronUp, Phone, Mail, MapPin } from 'lucide-react';
import { useData } from '../lib/dataContext.tsx';
import { Link } from 'react-router-dom';

interface FooterProps {
  onPhotoClick?: (photoUrl: string, alt: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onPhotoClick }) => {
  const { settings, photos } = useData();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 6 latest thumbnails for the footer mini grid
  const latestPhotos = photos.slice(0, 6);

  return (
    <footer className="site-footer">
      <div className="site-container-wide">
        <div className="footer-grid">
          {/* Column 1: Brand & Quote */}
          <div>
            <Link to="/" className="site-logo" style={{ marginBottom: '16px', display: 'inline-block' }}>
              <img
                src="/wrishu-logo.png"
                alt={settings.logo_top ? `${settings.logo_top} ${settings.logo_bottom}` : 'Wrishu Photography'}
                className="site-logo-img footer-logo-img"
              />
            </Link>
            <p className="footer-quote">{settings.footer_quote}</p>
          </div>

          {/* Column 2: Latest Photos Grid */}
          <div>
            <h4 className="footer-col-title">Latest Photos</h4>
            <div className="footer-gold-dash" />
            <div className="footer-photos-mini-grid">
              {latestPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="footer-mini-thumb"
                  onClick={() => onPhotoClick?.(photo.url, photo.alt)}
                  title={photo.title || photo.alt}
                >
                  <img
                    src={photo.variants?.[480] || photo.url}
                    alt={photo.alt}
                    loading="lazy"
                    decoding="async"
                    width={90}
                    height={90}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Contacts */}
          <div>
            <h4 className="footer-col-title">Contacts</h4>
            <div className="footer-gold-dash" />
            <div className="footer-contacts-list">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={15} color="var(--color-gold)" />
                <span>Phone:</span> {settings.contact_phone}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={15} color="var(--color-gold)" />
                <span>Email:</span> {settings.contact_email}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={15} color="var(--color-gold)" />
                <span>Location:</span> {settings.contact_location}
              </div>
              <div style={{ marginTop: '16px', fontSize: '0.78rem', color: '#666' }}>
                {settings.copyright}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="footer-bottom-row">
          <div>
            <span>Navid Mustasim Wrishu — Visual Storyteller & Educator</span>
            {' · '}
            <Link to="/admin" style={{ color: '#555', textDecoration: 'none' }}>Admin Portal</Link>
          </div>
          <button
            onClick={scrollToTop}
            className="back-to-top-btn"
            aria-label="Back to Top"
          >
            <span>Back to top</span>
            <ChevronUp size={16} />
          </button>
        </div>
      </div>
    </footer>
  );
};
