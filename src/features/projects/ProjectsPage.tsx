import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../lib/dataContext.tsx';
import { ResponsiveImage } from '../../components/ResponsiveImage.tsx';
import { Lightbox } from '../../components/Lightbox.tsx';
import { SeoHead } from '../../components/SeoHead.tsx';
import { X, Images } from 'lucide-react';
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
  const projectPhotos = activeProject
    ? photos.filter((photo) => photo.project_id === activeProject.id || photo.category_id === 'sports')
    : [];

  const handleCardClick = (projectSlug: string) => {
    navigate(`/projects/${projectSlug}`);
  };

  const handleCloseModal = () => {
    navigate('/projects');
  };

  const currentLightboxPhoto: Photo | null =
    lightboxPhotoIdx !== null ? projectPhotos[lightboxPhotoIdx] : null;

  return (
    <div style={{ padding: '60px 0 100px', backgroundColor: '#000000', minHeight: '80vh' }}>
      <SeoHead
        title="Projects & Series"
        description="Curated photo essays, match assignments, and documentary series by Navid Mustasim Wrishu."
      />

      <div className="site-container-wide">
        <div className="section-heading-wrap">
          <h1 className="section-title">Projects & Series</h1>
          <div className="gold-divider-dash" />
        </div>

        {/* 3-column responsive grid */}
        <div className="projects-grid">
          {projects.map((project) => (
            <div
              key={project.id}
              className="project-card"
              onClick={() => handleCardClick(project.slug)}
            >
              <img
                src={project.featured_image_url}
                alt={project.title}
                className="project-card-image"
                loading="lazy"
                decoding="async"
              />
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
                  <span>View Project Gallery ({project.photos_count || 12} photos)</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Project Modal Gallery */}
      {activeProject && (
        <div
          className="lightbox-backdrop"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{
              backgroundColor: '#111111',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              maxWidth: '1200px',
              width: '94vw',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '36px',
              position: 'relative',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCloseModal}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'transparent',
                border: 'none',
                color: '#FFFFFF',
                cursor: 'pointer',
              }}
              aria-label="Close Project"
            >
              <X size={26} />
            </button>

            <div style={{ marginBottom: '28px' }}>
              <span style={{ color: 'var(--color-gold)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                Featured Series
              </span>
              <h2 style={{ fontSize: '1.8rem', color: '#FFF', margin: '6px 0 12px' }}>
                {activeProject.title}
              </h2>
              <p style={{ color: '#AAA', maxWidth: '750px', fontSize: '0.92rem' }}>
                {activeProject.description}
              </p>
            </div>

            {/* Grid of photos for this project */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px',
              }}
            >
              {projectPhotos.map((photo, pIdx) => (
                <div
                  key={photo.id}
                  style={{
                    cursor: 'pointer',
                    overflow: 'hidden',
                    borderRadius: '2px',
                    aspectRatio: photo.orientation === 'landscape' ? '16/10' : '3/4',
                    backgroundColor: '#181818',
                  }}
                  onClick={() => setLightboxPhotoIdx(pIdx)}
                >
                  <ResponsiveImage
                    src={photo.url}
                    variants={photo.variants}
                    alt={photo.alt}
                    width={photo.width}
                    height={photo.height}
                  />
                </div>
              ))}
            </div>
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
