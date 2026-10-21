import React, { useState } from 'react';
import { useData } from '../../lib/dataContext.tsx';
import { UploaderDropzone } from './UploaderDropzone.tsx';
import { Trash2, Check, ArrowUp, ArrowDown } from 'lucide-react';
import type { Photo, Orientation } from '../../types/index.ts';

interface PhotosManagerProps {
  onNotify: (msg: string) => void;
}

export const PhotosManager: React.FC<PhotosManagerProps> = ({ onNotify }) => {
  const { categories, photos, addPhoto, updatePhoto, deletePhoto } = useData();
  const [selectedCategory, setSelectedCategory] = useState<string>('sports');
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [altText, setAltText] = useState('');
  const [titleText, setTitleText] = useState('');

  const filteredPhotos = photos.filter((p) => p.category_id === selectedCategory);

  const handleStartEdit = (photo: Photo) => {
    setEditingPhotoId(photo.id);
    setAltText(photo.alt);
    setTitleText(photo.title || '');
  };

  const handleSavePhotoMetadata = (id: string) => {
    updatePhoto(id, { alt: altText, title: titleText });
    setEditingPhotoId(null);
    onNotify('Photo metadata updated.');
  };

  const handleToggleOrientation = (photo: Photo) => {
    const nextOrient: Orientation = photo.orientation === 'landscape' ? 'portrait' : 'landscape';
    updatePhoto(photo.id, { orientation: nextOrient });
    onNotify(`Photo orientation changed to ${nextOrient}.`);
  };

  const handleToggleHomeGallery = (photo: Photo) => {
    updatePhoto(photo.id, { home_gallery: !photo.home_gallery });
    onNotify(photo.home_gallery ? 'Removed from Home Gallery' : 'Added to Home Gallery');
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this photo?')) {
      deletePhoto(id);
      onNotify('Photo removed.');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FFF' }}>Photo Catalog & Upload</h2>
        <p style={{ color: '#888', fontSize: '0.85rem' }}>
          Select category, drag and drop photos for automatic AVIF/WebP variant generation, and configure the 1L + 3P Home Gallery pattern.
        </p>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => setSelectedCategory(cat.slug)}
            className={`btn btn-sm ${selectedCategory === cat.slug ? 'btn-gold' : ''}`}
            style={{
              borderColor: selectedCategory === cat.slug ? 'var(--color-gold)' : '#333',
              backgroundColor: selectedCategory === cat.slug ? 'rgba(200, 145, 74, 0.15)' : 'transparent',
            }}
          >
            {cat.title} ({photos.filter((p) => p.category_id === cat.slug).length})
          </button>
        ))}
      </div>

      {/* Multi-file drag and drop uploader with client compression pipeline */}
      <div className="admin-card">
        <h3 className="admin-card-title">Upload New Photos ({categories.find(c => c.slug === selectedCategory)?.title})</h3>
        <UploaderDropzone
          categoryId={selectedCategory}
          onUploadComplete={(newPhoto) => {
            addPhoto(newPhoto);
            onNotify(`Successfully uploaded and compressed: ${newPhoto.title}`);
          }}
        />
      </div>

      {/* Photo List */}
      <div className="admin-card">
        <h3 className="admin-card-title">
          Manage Photos ({filteredPhotos.length})
        </h3>

        {filteredPhotos.length === 0 ? (
          <p style={{ color: '#777', padding: '20px 0' }}>No photos in this category yet. Upload above!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredPhotos.map((photo, idx) => (
              <div
                key={photo.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#1b1b1b',
                  padding: '14px 18px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  gap: '16px',
                }}
              >
                {/* Thumb + Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                  <span style={{ color: '#666', fontSize: '0.85rem', width: '24px' }}>#{idx + 1}</span>
                  <div
                    style={{
                      width: '70px',
                      height: '50px',
                      overflow: 'hidden',
                      borderRadius: '2px',
                      background: '#111',
                    }}
                  >
                    <img src={photo.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>

                  {editingPhotoId === photo.id ? (
                    <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Title"
                        style={{ textAlign: 'left', padding: '6px' }}
                        value={titleText}
                        onChange={(e) => setTitleText(e.target.value)}
                      />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Alt text"
                        style={{ textAlign: 'left', padding: '6px' }}
                        value={altText}
                        onChange={(e) => setAltText(e.target.value)}
                      />
                      <button
                        onClick={() => handleSavePhotoMetadata(photo.id)}
                        className="btn btn-sm btn-gold"
                        style={{ padding: '6px 10px' }}
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h4 style={{ fontSize: '0.92rem', color: '#FFF', fontWeight: 600 }}>{photo.title || 'Untitled Photo'}</h4>
                      <p style={{ fontSize: '0.78rem', color: '#888' }}>{photo.alt || 'No alt text'}</p>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Orientation Override */}
                  <button
                    onClick={() => handleToggleOrientation(photo)}
                    className="btn btn-sm"
                    style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                    title="Toggle Orientation"
                  >
                    {photo.orientation.toUpperCase()}
                  </button>

                  {/* Home Gallery Toggle */}
                  <button
                    onClick={() => handleToggleHomeGallery(photo)}
                    className="btn btn-sm"
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.7rem',
                      borderColor: photo.home_gallery ? 'var(--color-gold)' : '#444',
                      color: photo.home_gallery ? 'var(--color-gold)' : '#888',
                    }}
                  >
                    {photo.home_gallery ? '★ Home Gallery' : '+ Add to Home'}
                  </button>

                  {/* Edit Metadata */}
                  {editingPhotoId !== photo.id && (
                    <button
                      onClick={() => handleStartEdit(photo)}
                      className="btn btn-sm"
                      style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                    >
                      Edit
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(photo.id)}
                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '6px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
