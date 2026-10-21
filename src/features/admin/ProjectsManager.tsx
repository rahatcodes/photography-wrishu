import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../../lib/dataContext.tsx';
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  ExternalLink,
  X,
  RefreshCw,
  Star,
  Layers,
} from 'lucide-react';
import { uploadImageToCloudflareR2 } from '../../lib/imageEngine.ts';
import type { Project, Photo } from '../../types/index.ts';

interface ProjectsManagerProps {
  onNotify: (msg: string) => void;
}

export const ProjectsManager: React.FC<ProjectsManagerProps> = ({ onNotify }) => {
  const {
    projects,
    addProject,
    updateProject,
    deleteProject,
    photos,
    addPhoto,
    deletePhoto,
    checkSlugAvailability,
    projectSyncStatus,
  } = useData();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<Partial<Project>>({});
  const [isManualSlug, setIsManualSlug] = useState<boolean>(false);
  const [isCheckingSlug, setIsCheckingSlug] = useState<boolean>(false);
  const [slugStatus, setSlugStatus] = useState<{
    available: boolean;
    suggestedSlug: string;
    checked: boolean;
  }>({ available: true, suggestedSlug: '', checked: false });

  // Upload states for Cover Photo
  const [isUploadingCover, setIsUploadingCover] = useState<boolean>(false);
  const [coverProgress, setCoverProgress] = useState<number>(0);
  const [coverProgressMsg, setCoverProgressMsg] = useState<string>('');
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // Upload states for Project Gallery Photos
  const [isUploadingGallery, setIsUploadingGallery] = useState<boolean>(false);
  const [galleryProgress, setGalleryProgress] = useState<number>(0);
  const [galleryProgressMsg, setGalleryProgressMsg] = useState<string>('');
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  // Debounced Slug Uniqueness Checker
  useEffect(() => {
    if (!formState.slug || !editingId) return;

    let isMounted = true;
    setIsCheckingSlug(true);

    const timer = setTimeout(async () => {
      try {
        const result = await checkSlugAvailability(formState.slug || '', editingId);
        if (isMounted) {
          setSlugStatus({
            available: result.available,
            suggestedSlug: result.suggestedSlug,
            checked: true,
          });
          setIsCheckingSlug(false);
        }
      } catch {
        if (isMounted) {
          setIsCheckingSlug(false);
        }
      }
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [formState.slug, editingId, checkSlugAvailability]);

  // Auto-generate slug from Title if user hasn't manually overridden it
  const handleTitleChange = async (title: string) => {
    setFormState((prev) => ({ ...prev, title }));

    if (!isManualSlug) {
      const candidate = title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '') || 'project';

      setIsCheckingSlug(true);
      const res = await checkSlugAvailability(candidate, editingId || undefined);
      setIsCheckingSlug(false);
      setFormState((prev) => ({ ...prev, slug: res.suggestedSlug }));
      setSlugStatus({
        available: res.available,
        suggestedSlug: res.suggestedSlug,
        checked: true,
      });
    }
  };

  const handleManualSlugChange = (rawSlug: string) => {
    setIsManualSlug(true);
    const clean = rawSlug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-');
    setFormState((prev) => ({ ...prev, slug: clean }));
  };

  const handleRegenerateSlug = async () => {
    setIsManualSlug(false);
    const candidate = (formState.title || 'project')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    setIsCheckingSlug(true);
    const res = await checkSlugAvailability(candidate, editingId || undefined);
    setIsCheckingSlug(false);
    setFormState((prev) => ({ ...prev, slug: res.suggestedSlug }));
    setSlugStatus({
      available: res.available,
      suggestedSlug: res.suggestedSlug,
      checked: true,
    });
    onNotify(`Generated unique slug: ${res.suggestedSlug}`);
  };

  const handleAddNew = async () => {
    const tempId = `proj-${Date.now()}`;
    const baseSlug = 'new-photography-series';
    const res = await checkSlugAvailability(baseSlug);

    const newProj: Project = {
      id: tempId,
      title: 'New Photography Series',
      slug: res.suggestedSlug,
      featured_image_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1400&q=80',
      description: 'A dedicated photographic essay capturing momentary light, human expression, and authentic stories.',
      order: projects.length + 1,
      photos_count: 0,
      gallery_images: [],
    };

    addProject(newProj);
    setEditingId(newProj.id);
    setFormState(newProj);
    setIsManualSlug(false);
    onNotify('New project created and opened for editing.');
  };

  const handleSave = (id: string) => {
    const finalSlug = formState.slug || `project-${Date.now()}`;
    const currentPhotosCount = photos.filter((p) => p.project_id === id).length;

    updateProject(id, {
      ...formState,
      slug: finalSlug,
      photos_count: currentPhotosCount,
    });
    setEditingId(null);
    onNotify('Project details saved and synced to database.');
  };

  // Upload Featured Cover Photo to Cloudflare R2
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingCover(true);
      setCoverProgress(10);
      setCoverProgressMsg('Compressing cover photo to WebP...');

      const result = await uploadImageToCloudflareR2(file, 'projects', (pct, msg) => {
        setCoverProgress(pct);
        setCoverProgressMsg(msg);
      });

      setFormState((prev) => ({
        ...prev,
        featured_image_url: result.url,
      }));

      // If already created, update immediately
      if (editingId) {
        updateProject(editingId, { featured_image_url: result.url });
      }

      onNotify('Featured cover photo uploaded successfully!');
    } catch (err) {
      console.error('Featured cover upload error:', err);
      onNotify('Failed to upload cover photo. Please try again.');
    } finally {
      setIsUploadingCover(false);
      setCoverProgress(0);
      setCoverProgressMsg('');
      if (coverFileInputRef.current) coverFileInputRef.current.value = '';
    }
  };

  // Upload Project Gallery Images to Cloudflare R2
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingId) return;

    const fileList = Array.from(files);
    setIsUploadingGallery(true);

    try {
      let successCount = 0;
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const pctBase = Math.round((i / fileList.length) * 100);

        setGalleryProgress(pctBase);
        setGalleryProgressMsg(`Uploading ${i + 1} of ${fileList.length}: ${file.name}...`);

        const result = await uploadImageToCloudflareR2(file, 'projects', (_, msg) => {
          setGalleryProgressMsg(`[${i + 1}/${fileList.length}] ${msg}`);
        });

        // Add as a photo with project_id
        const newPhoto: Photo = {
          id: `proj-photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          project_id: editingId,
          category_id: 'sports', // Valid category for foreign key integrity
          url: result.url,
          variants: {},
          width: result.width,
          height: result.height,
          orientation: result.width >= result.height ? 'landscape' : 'portrait',
          alt: formState.title || 'Project Gallery Photo',
          title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
          order: photos.length + i + 1,
          featured: false,
          home_gallery: false,
          created_at: new Date().toISOString(),
        };

        addPhoto(newPhoto);
        successCount++;
      }

      // Update project photos count
      const updatedCount = photos.filter((p) => p.project_id === editingId).length + successCount;
      updateProject(editingId, { photos_count: updatedCount });
      setFormState((prev) => ({ ...prev, photos_count: updatedCount }));

      onNotify(`Added ${successCount} gallery photo${successCount > 1 ? 's' : ''} to this project.`);
    } catch (err) {
      console.error('Gallery upload error:', err);
      onNotify('Upload interrupted. Some photos could not be uploaded.');
    } finally {
      setIsUploadingGallery(false);
      setGalleryProgress(0);
      setGalleryProgressMsg('');
      if (galleryFileInputRef.current) galleryFileInputRef.current.value = '';
    }
  };

  const handleDeleteGalleryPhoto = (photoId: string) => {
    if (!confirm('Remove this photo from the project gallery?')) return;
    deletePhoto(photoId);

    if (editingId) {
      const remainingCount = photos.filter((p) => p.project_id === editingId && p.id !== photoId).length;
      updateProject(editingId, { photos_count: remainingCount });
      setFormState((prev) => ({ ...prev, photos_count: remainingCount }));
    }
    onNotify('Photo removed from project gallery.');
  };

  const handleSetCoverFromGallery = (photoUrl: string) => {
    setFormState((prev) => ({ ...prev, featured_image_url: photoUrl }));
    if (editingId) {
      updateProject(editingId, { featured_image_url: photoUrl });
    }
    onNotify('Set as featured cover photo.');
  };

  return (
    <div>
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FFF' }}>
            Projects & Series Manager
          </h2>
          <p style={{ color: '#888', fontSize: '0.85rem' }}>
            Manage editorial series, auto-generate unique slugs, upload cover photos, and curate gallery images.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {projectSyncStatus === 'syncing' && (
            <span style={{ fontSize: '0.8rem', color: 'var(--color-gold)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Loader2 size={14} className="spin" /> Syncing database...
            </span>
          )}
          {projectSyncStatus === 'synced' && (
            <span style={{ fontSize: '0.8rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} /> Cloud Synced
            </span>
          )}

          <button onClick={handleAddNew} className="btn btn-gold btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} />
            <span>Add New Project</span>
          </button>
        </div>
      </div>

      {/* Projects List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {projects.length === 0 ? (
          <div className="admin-card" style={{ textAlign: 'center', padding: '48px', color: '#888' }}>
            <Layers size={36} style={{ color: 'var(--color-gold)', marginBottom: '12px' }} />
            <p style={{ fontSize: '1rem', color: '#DDD', marginBottom: '8px' }}>No projects created yet</p>
            <p style={{ fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto 20px' }}>
              Click the "Add New Project" button above to publish your first photo essay series.
            </p>
            <button onClick={handleAddNew} className="btn btn-gold btn-sm">
              <Plus size={15} /> Add First Project
            </button>
          </div>
        ) : (
          projects.map((proj) => {
            const isEditing = editingId === proj.id;
            const projectPhotos = photos.filter((p) => p.project_id === proj.id);

            return (
              <div
                key={proj.id}
                className="admin-card"
                style={{
                  padding: '24px',
                  border: isEditing ? '1px solid var(--color-gold)' : '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                {/* Project Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '130px',
                        height: '84px',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        background: '#1a1a1a',
                        flexShrink: 0,
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      {proj.featured_image_url ? (
                        <img
                          src={proj.featured_image_url}
                          alt={proj.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
                          <ImageIcon size={24} />
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 style={{ fontSize: '1.15rem', color: '#FFF', fontWeight: 700, margin: '0 0 4px' }}>
                        {proj.title}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <a
                          href={`/projects/${proj.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--color-gold)',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          /projects/{proj.slug} <ExternalLink size={12} />
                        </a>
                        <span
                          style={{
                            fontSize: '0.74rem',
                            padding: '2px 8px',
                            backgroundColor: '#222',
                            color: '#AAA',
                            borderRadius: '12px',
                          }}
                        >
                          {projectPhotos.length > 0 ? projectPhotos.length : (proj.photos_count || 0)} Gallery Photos
                        </span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#AAA', marginTop: '6px', maxWidth: '650px', lineHeight: 1.5 }}>
                        {proj.description}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        if (isEditing) {
                          handleSave(proj.id);
                        } else {
                          setEditingId(proj.id);
                          setFormState({ ...proj });
                          setIsManualSlug(false);
                        }
                      }}
                      className={isEditing ? 'btn btn-gold btn-sm' : 'btn btn-sm'}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      {isEditing ? (
                        <>
                          <Save size={14} /> <span>Save Changes</span>
                        </>
                      ) : (
                        <>
                          <Edit3 size={14} /> <span>Edit Series</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Delete project "${proj.title}"? This will not delete the photos permanently.`)) {
                          deleteProject(proj.id);
                          if (editingId === proj.id) setEditingId(null);
                          onNotify('Project deleted.');
                        }
                      }}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171',
                        cursor: 'pointer',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title="Delete Project"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Expanded Project Editor */}
                {isEditing && (
                  <div style={{ marginTop: '24px', borderTop: '1px solid #282828', paddingTop: '24px' }}>
                    {/* 1. Title & Auto-Generated Slug */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                      <div className="form-group">
                        <label style={{ fontSize: '0.8rem', color: '#DDD', fontWeight: 600 }}>
                          Project Name / Title <span style={{ color: 'var(--color-gold)' }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          style={{ textAlign: 'left', marginTop: '6px' }}
                          placeholder="e.g. AFC Champions Cup Final"
                          value={formState.title || ''}
                          onChange={(e) => handleTitleChange(e.target.value)}
                        />
                        <span style={{ fontSize: '0.72rem', color: '#777', marginTop: '4px', display: 'block' }}>
                          Give your project an authentic title. The URL slug will auto-generate from this.
                        </span>
                      </div>

                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label style={{ fontSize: '0.8rem', color: '#DDD', fontWeight: 600 }}>
                            URL Slug (Auto-Checked Against DB)
                          </label>
                          <button
                            type="button"
                            onClick={handleRegenerateSlug}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--color-gold)',
                              fontSize: '0.72rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <RefreshCw size={11} /> Auto-Generate
                          </button>
                        </div>

                        <div style={{ position: 'relative', marginTop: '6px' }}>
                          <span
                            style={{
                              position: 'absolute',
                              left: '12px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: '#666',
                              fontSize: '0.82rem',
                              pointerEvents: 'none',
                            }}
                          >
                            /projects/
                          </span>
                          <input
                            type="text"
                            className="form-input"
                            style={{ textAlign: 'left', paddingLeft: '80px', paddingRight: '36px' }}
                            value={formState.slug || ''}
                            onChange={(e) => handleManualSlugChange(e.target.value)}
                          />

                          <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                            {isCheckingSlug ? (
                              <Loader2 size={15} className="spin" style={{ color: 'var(--color-gold)' }} />
                            ) : slugStatus.checked && slugStatus.available ? (
                              <CheckCircle2 size={16} style={{ color: '#4ade80' }} title="Slug is unique and available" />
                            ) : slugStatus.checked && !slugStatus.available ? (
                              <AlertCircle size={16} style={{ color: '#f59e0b' }} title="Slug was duplicate; unique suffix auto-applied" />
                            ) : null}
                          </div>
                        </div>

                        <div style={{ marginTop: '5px', fontSize: '0.74rem' }}>
                          {isCheckingSlug ? (
                            <span style={{ color: '#888' }}>Checking database for duplicate slugs...</span>
                          ) : slugStatus.checked && slugStatus.available ? (
                            <span style={{ color: '#4ade80' }}>✓ Slug is unique & available for visitors</span>
                          ) : slugStatus.checked && !slugStatus.available ? (
                            <span style={{ color: '#f59e0b' }}>
                              Notice: Slug was taken in database. Unique candidate suggested: <strong>{slugStatus.suggestedSlug}</strong>
                            </span>
                          ) : (
                            <span style={{ color: '#777' }}>Visitor destination: /projects/{formState.slug || ''}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 2. Featured Cover Photo Upload */}
                    <div className="form-group" style={{ marginBottom: '24px' }}>
                      <label style={{ fontSize: '0.8rem', color: '#DDD', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                        Featured Cover Photo <span style={{ color: 'var(--color-gold)' }}>*</span>
                      </label>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                          gap: '20px',
                          alignItems: 'center',
                          backgroundColor: '#121212',
                          padding: '16px',
                          borderRadius: '6px',
                          border: '1px solid #242424',
                        }}
                      >
                        {/* Cover Preview */}
                        <div
                          style={{
                            width: '100%',
                            height: '170px',
                            backgroundColor: '#1e1e1e',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            position: 'relative',
                            border: '1px solid #333',
                          }}
                        >
                          {formState.featured_image_url ? (
                            <img
                              src={formState.featured_image_url}
                              alt="Featured Cover"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                              <ImageIcon size={32} />
                              <span style={{ fontSize: '0.78rem', marginTop: '6px' }}>No cover photo selected</span>
                            </div>
                          )}

                          {isUploadingCover && (
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                backgroundColor: 'rgba(0,0,0,0.85)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '16px',
                              }}
                            >
                              <Loader2 size={24} className="spin" style={{ color: 'var(--color-gold)', marginBottom: '8px' }} />
                              <span style={{ color: '#FFF', fontSize: '0.8rem' }}>{coverProgressMsg}</span>
                              <div style={{ width: '80%', height: '4px', backgroundColor: '#333', borderRadius: '2px', marginTop: '8px' }}>
                                <div style={{ width: `${coverProgress}%`, height: '100%', backgroundColor: 'var(--color-gold)', borderRadius: '2px', transition: 'width 0.2s' }} />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Upload Controls */}
                        <div>
                          <p style={{ color: '#AAA', fontSize: '0.82rem', marginBottom: '12px' }}>
                            This photo is displayed as the primary thumbnail on <strong>/projects</strong>. Clicking it reveals the project gallery masonry.
                          </p>

                          <input
                            ref={coverFileInputRef}
                            type="file"
                            accept="image/*,.webp,.jpg,.jpeg,.png"
                            style={{ display: 'none' }}
                            onChange={handleCoverUpload}
                          />

                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => coverFileInputRef.current?.click()}
                              disabled={isUploadingCover}
                              className="btn btn-gold btn-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                            >
                              <UploadCloud size={16} />
                              <span>{formState.featured_image_url ? 'Replace Cover Photo' : 'Upload Cover Photo'}</span>
                            </button>
                          </div>

                          <div style={{ marginTop: '12px' }}>
                            <label style={{ fontSize: '0.72rem', color: '#777' }}>Direct Image URL (or paste external link):</label>
                            <input
                              type="text"
                              className="form-input"
                              style={{ textAlign: 'left', fontSize: '0.78rem', marginTop: '4px' }}
                              value={formState.featured_image_url || ''}
                              onChange={(e) => setFormState({ ...formState, featured_image_url: e.target.value })}
                              placeholder="https://cdn.wrishu.com/..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3. Description Essay */}
                    <div className="form-group" style={{ marginBottom: '24px' }}>
                      <label style={{ fontSize: '0.8rem', color: '#DDD', fontWeight: 600 }}>
                        Project Narrative / Description
                      </label>
                      <textarea
                        className="form-input"
                        rows={3}
                        style={{ textAlign: 'left', marginTop: '6px' }}
                        placeholder="Write a brief story or background about this assignment, tournament, or monograph..."
                        value={formState.description || ''}
                        onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                      />
                    </div>

                    {/* 4. Gallery Images Section */}
                    <div
                      style={{
                        backgroundColor: '#121212',
                        borderRadius: '6px',
                        border: '1px solid #282828',
                        padding: '20px',
                        marginBottom: '24px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <h4 style={{ fontSize: '1rem', color: '#FFF', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>Project Gallery Images</span>
                            <span style={{ fontSize: '0.75rem', backgroundColor: '#222', color: 'var(--color-gold)', padding: '2px 8px', borderRadius: '10px' }}>
                              {projectPhotos.length} Photos
                            </span>
                          </h4>
                          <p style={{ color: '#888', fontSize: '0.78rem', marginTop: '4px' }}>
                            Photos uploaded here form the masonry gallery when visitors click into this project.
                          </p>
                        </div>

                        <div>
                          <input
                            ref={galleryFileInputRef}
                            type="file"
                            multiple
                            accept="image/*,.webp,.jpg,.jpeg,.png"
                            style={{ display: 'none' }}
                            onChange={handleGalleryUpload}
                          />
                          <button
                            type="button"
                            onClick={() => galleryFileInputRef.current?.click()}
                            disabled={isUploadingGallery}
                            className="btn btn-sm"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              backgroundColor: '#222',
                              borderColor: 'var(--color-gold)',
                              color: 'var(--color-gold)',
                            }}
                          >
                            <UploadCloud size={15} />
                            <span>Add Gallery Images (Multi-select)</span>
                          </button>
                        </div>
                      </div>

                      {/* Gallery Upload Progress */}
                      {isUploadingGallery && (
                        <div
                          style={{
                            padding: '12px 16px',
                            backgroundColor: '#1a1a1a',
                            borderRadius: '4px',
                            marginBottom: '16px',
                            border: '1px solid rgba(200, 145, 74, 0.3)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FFF', fontSize: '0.8rem', marginBottom: '6px' }}>
                            <Loader2 size={16} className="spin" style={{ color: 'var(--color-gold)' }} />
                            <span>{galleryProgressMsg}</span>
                          </div>
                          <div style={{ width: '100%', height: '4px', backgroundColor: '#333', borderRadius: '2px' }}>
                            <div style={{ width: `${galleryProgress}%`, height: '100%', backgroundColor: 'var(--color-gold)', borderRadius: '2px', transition: 'width 0.2s' }} />
                          </div>
                        </div>
                      )}

                      {/* Gallery Photos Grid */}
                      {projectPhotos.length === 0 ? (
                        <div
                          style={{
                            textAlign: 'center',
                            padding: '36px 20px',
                            border: '1px dashed #333',
                            borderRadius: '4px',
                            color: '#777',
                          }}
                        >
                          <ImageIcon size={32} style={{ color: '#555', marginBottom: '8px' }} />
                          <p style={{ fontSize: '0.88rem', color: '#AAA' }}>No gallery photos added yet</p>
                          <p style={{ fontSize: '0.78rem', color: '#666', marginTop: '4px' }}>
                            Click "Add Gallery Images" above to upload photos to this project's masonry grid.
                          </p>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                            gap: '12px',
                          }}
                        >
                          {projectPhotos.map((photo) => (
                            <div
                              key={photo.id}
                              style={{
                                position: 'relative',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                aspectRatio: photo.orientation === 'landscape' ? '16/10' : '3/4',
                                backgroundColor: '#181818',
                                border: formState.featured_image_url === photo.url ? '2px solid var(--color-gold)' : '1px solid #333',
                                group: 'photo-thumb',
                              }}
                            >
                              <img
                                src={photo.url}
                                alt={photo.title || 'Project photo'}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                loading="lazy"
                              />

                              {/* Hover controls overlay */}
                              <div
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'space-between',
                                  padding: '6px',
                                  opacity: 0,
                                  transition: 'opacity 0.2s ease',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span
                                    style={{
                                      fontSize: '0.62rem',
                                      padding: '2px 4px',
                                      backgroundColor: 'rgba(0,0,0,0.8)',
                                      color: '#AAA',
                                      borderRadius: '2px',
                                      textTransform: 'uppercase',
                                    }}
                                  >
                                    {photo.orientation === 'landscape' ? 'Land' : 'Port'}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteGalleryPhoto(photo.id)}
                                    style={{
                                      background: 'rgba(239, 68, 68, 0.8)',
                                      border: 'none',
                                      color: '#FFF',
                                      borderRadius: '2px',
                                      padding: '3px',
                                      cursor: 'pointer',
                                    }}
                                    title="Delete from project"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleSetCoverFromGallery(photo.url)}
                                  style={{
                                    background: formState.featured_image_url === photo.url ? 'var(--color-gold)' : 'rgba(0,0,0,0.85)',
                                    border: '1px solid var(--color-gold)',
                                    color: formState.featured_image_url === photo.url ? '#000' : 'var(--color-gold)',
                                    fontSize: '0.68rem',
                                    padding: '4px',
                                    borderRadius: '2px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px',
                                    fontWeight: 600,
                                  }}
                                  title="Make this photo the project cover"
                                >
                                  <Star size={10} fill={formState.featured_image_url === photo.url ? '#000' : 'none'} />
                                  <span>{formState.featured_image_url === photo.url ? 'Current Cover' : 'Set as Cover'}</span>
                                </button>
                              </div>

                              {formState.featured_image_url === photo.url && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: '4px',
                                    left: '4px',
                                    backgroundColor: 'var(--color-gold)',
                                    color: '#000',
                                    borderRadius: '50%',
                                    width: '18px',
                                    height: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                  title="Current Featured Cover"
                                >
                                  <Star size={10} fill="#000" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom Save Bar */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="btn btn-sm"
                        style={{ backgroundColor: '#222', color: '#BBB' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSave(proj.id)}
                        className="btn btn-gold btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <Save size={15} />
                        <span>Save & Publish Series</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
