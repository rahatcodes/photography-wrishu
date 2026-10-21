import React, { useState } from 'react';
import { useData } from '../../lib/dataContext.tsx';
import { StatCounter } from '../../components/StatCounter.tsx';

export const AboutSection: React.FC = () => {
  const { settings, stats } = useData();
  const [expanded, setExpanded] = useState(false);

  const paragraphs = settings.about_paragraphs || [];
  const initialParagraphs = paragraphs.slice(0, 2);
  const remainingParagraphs = paragraphs.slice(2);

  return (
    <section className="about-section" id="about">
      <div className="site-container">
        <div className="about-grid">
          {/* Circular B&W Portrait */}
          <div className="about-portrait-wrap">
            <div className="about-portrait-circle">
              <img
                src={settings.about_portrait_url}
                alt="Navid Mustasim Wrishu - Portrait"
                className="about-portrait-img"
                loading="lazy"
                decoding="async"
                width={340}
                height={340}
              />
            </div>
          </div>

          {/* Bio Text & Details */}
          <div>
            <div className="about-kicker">{settings.about_label || 'ABOUT ME'}</div>
            <h2 className="about-headline">
              {settings.about_name || 'My name is Navid Mustasim'}{' '}
              <span className="gold-text">{settings.about_name_gold || 'Wrishu'}</span>
            </h2>
            <div className="about-subtitle">{settings.about_roles}</div>

            {initialParagraphs.map((p, idx) => (
              <p key={idx} className="about-bio-text">
                {p}
              </p>
            ))}

            {expanded &&
              remainingParagraphs.map((p, idx) => (
                <p key={`rem-${idx}`} className="about-bio-text">
                  {p}
                </p>
              ))}

            {remainingParagraphs.length > 0 && (
              <button
                className="about-readmore"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? 'SHOW LESS <' : 'READ MORE >'}
              </button>
            )}

            {/* Stat Counters Row */}
            <div className="about-stats-row">
              {stats.map((s) => (
                <StatCounter
                  key={s.id}
                  value={s.value}
                  suffix={s.suffix}
                  label={s.label}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
