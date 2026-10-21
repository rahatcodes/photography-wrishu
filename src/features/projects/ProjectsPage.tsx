import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../lib/dataContext.tsx';
import { Lightbox } from '../../components/Lightbox.tsx';
import { SeoHead } from '../../components/SeoHead.tsx';
import { ArrowLeft, Images } from 'lucide-react';
import type { Photo } from '../../types/index.ts';

export const ProjectsPage: React.FC = () => {
  const { projects, photos } = useData();
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();

  const [activeProjectSlug, setActiveProjectSlug] = useState<string | null>(slug || null);
  const [lightboxPhotoIdx, setLightboxPhotoIdx] = useState<number | null>(null);

  // Sync route param with active project
  useEffect(() => {
    if (slug) {
      setActiveProjectSlug(slug);
    } else {
      setActiveProjectSlug(null);
    }
  }, [slug]);

  const activeProject = projects.find((p) => p.slug === activeProjectSlug);

  // Gallery photos for the active project
  let projectPhotos: Photo[] = [];
  if (activeProject) {
    projectPhotos = photos.filter((photo) => photo.project_id === activeProject.id);

    // Fallback for initial demo projects if no photos have been assigned project_id yet
    if (projectPhotos.length === 0) {
      if (activeProject.id === 'proj-1' || activeProject.slug === 'fifa-afc-matches') {
        projectPhotos = photos.filter((p) => p.category_id === 'sports').slice(0, 8);
      } else if (activeProject.id === 'proj-4' || activeProject.slug === 'dhaka-after-dark') {
        projectPhotos = photos.filter((p) => p.category_id === 'street').slice(0, 8);
      } else if (activeProject.id === 'proj-5' || activeProject.slug === 'wings-of-bengal') {
        projectPhotos = photos.filter((p) => p.category_id === 'wildlife' || p.category_id === 'nature').slice(0, 8);
      } else {
        projectPhotos = photos.slice(0, 6);
      }
    }
  }

  const handleCardClick = (projectSlug: string) => {
    navigate(`/projects/${projectSlug}`);
  };

  const currentLightboxPhoto: Photo | null =
    lightboxPhotoIdx !== null ? projectPhotos[lightboxPhotoIdx] : null;

  return (
    <div style={{ padding: '60px 0 100px', backgroundColor: '#000000', minHeight: '80vh' }}>
      <SeoHead
        title={activeProject ? `${activeProject.title} — Projects & Series` : 'Projects & Series'}
        description={
          activeProject
            ? activeProject.description
            : 'Curated photo essays, match assignments, and documentary series by Navid Mustasim Wrishu.'
        }
      />

      {/* VIEW A: Single Project Gallery Masonry View */}
      {activeProject ? (
        <div className="site-container-wide">
          {/* Back Navigation Button */}
          <button
            onClick={() => navigate('/projects')}
            className="btn btn-sm"
            style={{
              marginBottom: '32px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#161616',
              border: '1px solid #282828',
              color: '#CCC',
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to All Projects & Series</span>
          </button>

          {/* Project Details Header */}
          <div style={{ maxWidth: '900px', marginBottom: '40px' }}>
            <span
              style={{
                color: 'var(--color-gold)',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-display)',
              }}
            >
              Featured Series
            </span>

            <h1
              className="section-title"
              style={{
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                color: '#FFFFFF',
                margin: '10px 0 16px',
                textAlign: 'left',
              }}
            >
              {activeProject.title}
            </h1>

            <div className="gold-divider-dash" style={{ margin: '0 0 20px 0' }} />

            <p
              style={{
                color: '#BBB',
                fontSize: '1rem',
                lineHeight: 1.7,
                maxWidth: '820px',
                marginBottom: '20px',
              }}
            >
              {activeProject.description}
            </p>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--color-gold)',
                fontSize: '0.82rem',
                fontWeight: 600,
                backgroundColor: '#141414',
                padding: '6px 14px',
                borderRadius: '20px',
                border: '1px solid rgba(200, 145, 74, 0.25)',
              }}
            >
              <Images size={15} />
              <span>{projectPhotos.length} Curated Photographs</span>
            </div>
          </div>

          {/* Gallery Images Masonry */}
          {projectPhotos.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '80px 20px',
                backgroundColor: '#111',
                borderRadius: '6px',
                border: '1px solid #222',
                color: '#888',
              }}
            >
              <Images size={36} style={{ color: 'var(--color-gold)', marginBottom: '12px' }} />
              <p style={{ fontSize: '1rem', color: '#DDD' }}>No gallery photos added to this series yet.</p>
              <p style={{ fontSize: '0.82rem', marginTop: '6px' }}>
                Photos uploaded for this project in Admin Dashboard will appear here in the masonry grid.
              </p>
            </div>
          ) : (
            <div className="project-gallery-masonry">
              {projectPhotos.map((photo, pIdx) => (
                <article
                  key={photo.id}
                  className="project-masonry-item"
                  onClick={() => setLightboxPhotoIdx(pIdx)}
                  aria-label={photo.title || photo.alt}
                >
                  <img
                    src={photo.url}
                    alt={photo.alt || activeProject.title}
                    loading={pIdx < 6 ? 'eager' : 'lazy'}
                    decoding="async"
                  />
                  <div className="project-masonry-overlay">
                    <span className="project-masonry-caption">
                      {photo.title || activeProject.title}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Bottom Back Button */}
          <div style={{ marginTop: '60px', textAlign: 'center' }}>
            <button
              onClick={() => navigate('/projects')}
              className="btn btn-gold btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <ArrowLeft size={16} />
              <span>Back to All Projects & Series</span>
            </button>
          </div>
        </div>
      ) : (
        /* VIEW B: All Projects Overview Grid */
        <div className="site-container-wide">
          <div className="section-heading-wrap">
            <h1 className="section-title">Projects & Series</h1>
            <div className="gold-divider-dash" />
            <p style={{ color: '#888', fontSize: '0.95rem', marginTop: '14px', maxWidth: '600px', margin: '14px auto 0' }}>
              Curated photo essays, match assignments, and documentary series by Navid Mustasim Wrishu.
            </p>
          </div>

          {/* 3-column responsive grid */}
          <div className="projects-grid">
            {projects.map((project) => {
              const count = photos.filter((p) => p.project_id === project.id).length || project.photos_count || 12;

              return (
                <div
                  key={project.id}
                  className="project-card"
                  onClick={() => handleCardClick(project.slug)}
                >
                  <div style={{ position: 'relative', overflow: 'hidden' }}>
                    <img
                      src={project.featured_image_url}
                      alt={project.title}
                      className="project-card-image"
                      loading="lazy"
                      decoding="async"
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '12px',
                        right: '12px',
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(6px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.72rem',
                        color: 'var(--color-gold)',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <Images size={13} />
                      <span>{count} Photos</span>
                    </div>
                  </div>

                  <div className="project-card-content">
                    <h3 className="project-card-title">{project.title}</h3>
                    <p className="project-card-desc">{project.description}</p>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--color-gold)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        fontFamily: 'var(--font-display)',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        marginTop: '16px',
                      }}
                    >
                      <Images size={15} />
                      <span>View Gallery Masonry →</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lightbox when a specific photo in the project is clicked */}
      {currentLightboxPhoto && (
        <Lightbox
          isOpen={lightboxPhotoIdx !== null}
          onClose={() => setLightboxPhotoIdx(null)}
          imageUrl={currentLightboxPhoto.url}
          altText={currentLightboxPhoto.alt}
          title={currentLightboxPhoto.title}
          hasPrev={lightboxPhotoIdx! > 0}
          hasNext={lightboxPhotoIdx! < projectPhotos.length - 1}
          onPrev={() => setLightboxPhotoIdx((prev) => (prev !== null && prev > 0 ? prev - 1 : prev))}
          onNext={() =>
            setLightboxPhotoIdx((prev) =>
              prev !== null && prev < projectPhotos.length - 1 ? prev + 1 : prev
            )
          }
        />
      )}
    </div>
  );
};
