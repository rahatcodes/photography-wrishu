import React, { useState } from 'react';
import { useData } from '../../lib/dataContext.tsx';
import { Plus, Trash2, Edit3, Save } from 'lucide-react';
import type { Project } from '../../types/index.ts';

interface ProjectsManagerProps {
  onNotify: (msg: string) => void;
}

export const ProjectsManager: React.FC<ProjectsManagerProps> = ({ onNotify }) => {
  const { projects, addProject, updateProject, deleteProject } = useData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<Partial<Project>>({});

  const handleAddNew = () => {
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      title: 'New Photography Essay',
      slug: `essay-${Date.now()}`,
      featured_image_url: projects[0]?.featured_image_url || '',
      description: 'A curated visual series capturing momentous human expressions.',
      order: projects.length + 1,
      photos_count: 10,
    };
    addProject(newProj);
    setEditingId(newProj.id);
    setFormState(newProj);
    onNotify('New project draft created.');
  };

  const handleSave = (id: string) => {
    updateProject(id, formState);
    setEditingId(null);
    onNotify('Project changes saved.');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FFF' }}>Projects & Series Manager</h2>
          <p style={{ color: '#888', fontSize: '0.85rem' }}>
            Create and edit featured project cards displayed on /projects.
          </p>
        </div>
        <button onClick={handleAddNew} className="btn btn-gold btn-sm">
          <Plus size={16} />
          <span>Add Project</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {projects.map((proj) => {
          const isEditing = editingId === proj.id;

          return (
            <div key={proj.id} className="admin-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '120px', height: '80px', borderRadius: '4px', overflow: 'hidden', background: '#222' }}>
                    <img src={proj.featured_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', color: '#FFF', fontWeight: 700 }}>{proj.title}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-gold)' }}>/projects/{proj.slug}</p>
                    <p style={{ fontSize: '0.85rem', color: '#AAA', marginTop: '4px', maxWidth: '500px' }}>
                      {proj.description}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => {
                      if (isEditing) {
                        handleSave(proj.id);
                      } else {
                        setEditingId(proj.id);
                        setFormState({ ...proj });
                      }
                    }}
                    className="btn btn-sm"
                  >
                    {isEditing ? <Save size={14} /> : <Edit3 size={14} />}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this project?')) {
                        deleteProject(proj.id);
                        onNotify('Project deleted.');
                      }
                    }}
                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '6px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {isEditing && (
                <div style={{ marginTop: '20px', borderTop: '1px solid #333', paddingTop: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.78rem', color: '#AAA' }}>Project Title</label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ textAlign: 'left' }}
                        value={formState.title || ''}
                        onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.78rem', color: '#AAA' }}>URL Slug</label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ textAlign: 'left' }}
                        value={formState.slug || ''}
                        onChange={(e) => setFormState({ ...formState, slug: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.78rem', color: '#AAA' }}>Featured Cover Image URL</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ textAlign: 'left', fontSize: '0.82rem' }}
                      value={formState.featured_image_url || ''}
                      onChange={(e) => setFormState({ ...formState, featured_image_url: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.78rem', color: '#AAA' }}>Description</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      style={{ textAlign: 'left' }}
                      value={formState.description || ''}
                      onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                    />
                  </div>

                  <button onClick={() => handleSave(proj.id)} className="btn btn-gold btn-sm">
                    Save Project
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
