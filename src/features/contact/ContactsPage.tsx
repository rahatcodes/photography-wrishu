import React from 'react';
import { useData } from '../../lib/dataContext.tsx';
import { ContactForm } from '../../components/ContactForm.tsx';
import { LazyMap } from '../../components/LazyMap.tsx';
import { SeoHead } from '../../components/SeoHead.tsx';
import { AboutSection } from '../home/AboutSection.tsx';
import { Phone, Mail, MapPin } from 'lucide-react';

export const ContactsPage: React.FC = () => {
  const { settings } = useData();

  return (
    <div style={{ backgroundColor: '#000000' }}>
      <SeoHead
        title="Contacts & Bookings"
        description="Get in touch with Navid Mustasim Wrishu for FIFA/AFC matches, documentary assignments, sports tournaments, and photography workshops."
      />

      {/* About Section displayed on Contacts page exactly as shown in screenshot */}
      <AboutSection />

      {/* Main Contacts Section */}
      <section className="contacts-section">
        <div className="site-container">
          <div className="section-heading-wrap" style={{ textAlign: 'left', marginBottom: '40px' }}>
            <h1 className="section-title">Contacts</h1>
          </div>

          <div className="contacts-grid">
            {/* Left Column: Quote & 3 Gold Circular Icons */}
            <div>
              <p className="contacts-quote">{settings.contact_quote}</p>
              <p className="contacts-bio-p">{settings.contact_bio}</p>

              {/* Icon 1: Phone */}
              <div className="contact-info-row">
                <a
                  href={`tel:${settings.contact_phone.replace(/[^+\d]/g, '')}`}
                  className="icon-circle-gold"
                  aria-label="Call phone number"
                >
                  <Phone size={22} strokeWidth={1.8} />
                </a>
                <div className="contact-info-text">
                  <a href={`tel:${settings.contact_phone.replace(/[^+\d]/g, '')}`}>
                    {settings.contact_phone}
                  </a>
                </div>
              </div>

              {/* Icon 2: Email */}
              <div className="contact-info-row">
                <a
                  href={`mailto:${settings.contact_email}`}
                  className="icon-circle-gold"
                  aria-label="Send email"
                >
                  <Mail size={22} strokeWidth={1.8} />
                </a>
                <div className="contact-info-text">
                  <a href={`mailto:${settings.contact_email}`}>
                    {settings.contact_email}
                  </a>
                </div>
              </div>

              {/* Icon 3: Location */}
              <div className="contact-info-row">
                <div className="icon-circle-gold" aria-label="Studio location">
                  <MapPin size={22} strokeWidth={1.8} />
                </div>
                <div className="contact-info-text">
                  <span>{settings.contact_location}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Contact Form */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <ContactForm />
            </div>
          </div>

          {/* Lazy Embedded Google Map */}
          <div style={{ marginTop: '50px' }}>
            <LazyMap locationQuery={settings.map_query || 'Kallyanpur, Dhaka, Bangladesh'} />
          </div>
        </div>
      </section>
    </div>
  );
};
