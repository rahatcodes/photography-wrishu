import React, { useState } from 'react';
import { useData } from '../../lib/dataContext.tsx';
import { Save, Plus, Trash2 } from 'lucide-react';
import type { StatItem } from '../../types/index.ts';

interface AboutStatsEditorProps {
  onNotify: (msg: string) => void;
}

export const AboutStatsEditor: React.FC<AboutStatsEditorProps> = ({ onNotify }) => {
  const { settings, updateSettings, stats, updateStats } = useData();

  const [aboutLabel, setAboutLabel] = useState(settings.about_label);
  const [aboutName, setAboutName] = useState(settings.about_name);
  const [aboutNameGold, setAboutNameGold] = useState(settings.about_name_gold);
  const [aboutRoles, setAboutRoles] = useState(settings.about_roles);
  const [paragraphs, setParagraphs] = useState<string[]>([...settings.about_paragraphs]);
  const [portraitUrl, setPortraitUrl] = useState(settings.about_portrait_url);

  const [statsList, setStatsList] = useState<StatItem[]>([...stats]);

  const handleParagraphChange = (index: number, val: string) => {
    const updated = [...paragraphs];
    updated[index] = val;
    setParagraphs(updated);
  };

  const handleAddParagraph = () => {
    setParagraphs([...paragraphs, '']);
  };

  const handleRemoveParagraph = (index: number) => {
    setParagraphs(paragraphs.filter((_, i) => i !== index));
  };

  const handleStatChange = (index: number, field: keyof StatItem, val: unknown) => {
    const updated = [...statsList];
    updated[index] = { ...updated[index], [field]: val };
    setStatsList(updated);
  };

  const handleSaveAll = () => {
    updateSettings({
      about_label: aboutLabel,
      about_name: aboutName,
      about_name_gold: aboutNameGold,
      about_roles: aboutRoles,
      about_paragraphs: paragraphs.filter((p) => p.trim().length > 0),
      about_portrait_url: portraitUrl,
    });
    updateStats(statsList);
    onNotify('About section and stats saved successfully!');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FFF' }}>About Section & Stats</h2>
          <p style={{ color: '#888', fontSize: '0.85rem' }}>
            Modify biographical details, highlighted headline, and match count statistics.
          </p>
        </div>
        <button onClick={handleSaveAll} className="btn btn-gold btn-sm">
          <Save size={15} />
          <span>Save Changes</span>
        </button>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">Headline & Roles</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '20px' }}>
          <div className="form-group">
            <label style={{ fontSize: '0.78rem', color: '#AAA', display: 'block', marginBottom: '6px' }}>
              Gold Kicker Label
            </label>
            <input
              type="text"
              className="form-input"
              style={{ textAlign: 'left' }}
              value={aboutLabel}
              onChange={(e) => setAboutLabel(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.78rem', color: '#AAA', display: 'block', marginBottom: '6px' }}>
              Primary Headline Text
            </label>
            <input
              type="text"
              className="form-input"
              style={{ textAlign: 'left' }}
              value={aboutName}
              onChange={(e) => setAboutName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.78rem', color: 'var(--color-gold)', display: 'block', marginBottom: '6px' }}>
              Gold Accent Text (Last Name)
            </label>
            <input
              type="text"
              className="form-input"
              style={{ textAlign: 'left', color: 'var(--color-gold)' }}
              value={aboutNameGold}
              onChange={(e) => setAboutNameGold(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label style={{ fontSize: '0.78rem', color: '#AAA', display: 'block', marginBottom: '6px' }}>
            Professional Roles Subtitle
          </label>
          <input
            type="text"
            className="form-input"
            style={{ textAlign: 'left' }}
            value={aboutRoles}
            onChange={(e) => setAboutRoles(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label style={{ fontSize: '0.78rem', color: '#AAA', display: 'block', marginBottom: '6px' }}>
            Circular Monochrome Portrait URL
          </label>
          <input
            type="text"
            className="form-input"
            style={{ textAlign: 'left', fontSize: '0.82rem' }}
            value={portraitUrl}
            onChange={(e) => setPortraitUrl(e.target.value)}
          />
        </div>
      </div>

      {/* Paragraphs Editor */}
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="admin-card-title" style={{ margin: 0 }}>Bio Paragraphs</h3>
          <button onClick={handleAddParagraph} className="btn btn-sm" style={{ padding: '4px 10px' }}>
            <Plus size={14} /> Add Paragraph
          </button>
        </div>

        {paragraphs.map((p, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--color-gold)', fontWeight: 700, paddingTop: '10px' }}>
              #{idx + 1}
            </span>
            <textarea
              className="form-input"
              rows={3}
              style={{ textAlign: 'left', minHeight: '80px', flex: 1 }}
              value={p}
              onChange={(e) => handleParagraphChange(idx, e.target.value)}
            />
            <button
              onClick={() => handleRemoveParagraph(idx)}
              style={{ background: 'none', border: 'none', color: '#f87171', padding: '10px', cursor: 'pointer' }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Animated Match Stats */}
      <div className="admin-card">
        <h3 className="admin-card-title">Animated Match Statistics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          {statsList.map((stat, idx) => (
            <div key={stat.id} style={{ background: '#202020', padding: '16px', borderRadius: '4px' }}>
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '0.75rem', color: '#AAA' }}>Stat Label</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ textAlign: 'left' }}
                  value={stat.label}
                  onChange={(e) => handleStatChange(idx, 'label', e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label style={{ fontSize: '0.75rem', color: '#AAA' }}>Target Number</label>
                  <input
                    type="number"
                    className="form-input"
                    style={{ textAlign: 'left' }}
                    value={stat.value}
                    onChange={(e) => handleStatChange(idx, 'value', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="form-group" style={{ width: '80px', marginBottom: 0 }}>
                  <label style={{ fontSize: '0.75rem', color: '#AAA' }}>Suffix</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ textAlign: 'left' }}
                    value={stat.suffix || ''}
                    onChange={(e) => handleStatChange(idx, 'suffix', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
