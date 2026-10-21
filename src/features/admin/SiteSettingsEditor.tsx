import React, { useState } from 'react';
import { useData } from '../../lib/dataContext.tsx';
import { Save } from 'lucide-react';
import type { SiteSettings } from '../../types/index.ts';

interface SiteSettingsEditorProps {
  onNotify: (msg: string) => void;
}

export const SiteSettingsEditor: React.FC<SiteSettingsEditorProps> = ({ onNotify }) => {
  const { settings, updateSettings } = useData();

  const [form, setForm] = useState<SiteSettings>({ ...settings });

  const handleChange = (field: keyof SiteSettings, val: unknown) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = () => {
    updateSettings(form);
    onNotify('Site settings saved and applied across the portfolio.');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FFF' }}>Site Branding & Contact Settings</h2>
          <p style={{ color: '#888', fontSize: '0.85rem' }}>
            Customize camera lockup text, contact info, footer quote, map query, and social channels.
          </p>
        </div>
        <button onClick={handleSave} className="btn btn-gold btn-sm">
          <Save size={15} />
          <span>Save Settings</span>
        </button>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">Logo Branding</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="form-group">
            <label style={{ fontSize: '0.78rem', color: '#AAA', display: 'block', marginBottom: '6px' }}>
              Logo Top Text (Small caps)
            </label>
            <input
              type="text"
              className="form-input"
              style={{ textAlign: 'left' }}
              value={form.logo_top}
              onChange={(e) => handleChange('logo_top', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.78rem', color: '#AAA', display: 'block', marginBottom: '6px' }}>
              Logo Bottom Text (Bold)
            </label>
            <input
              type="text"
              className="form-input"
              style={{ textAlign: 'left' }}
              value={form.logo_bottom}
              onChange={(e) => handleChange('logo_bottom', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">Contacts Page Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div className="form-group">
            <label style={{ fontSize: '0.78rem', color: '#AAA', display: 'block', marginBottom: '6px' }}>
              Phone Number
            </label>
            <input
              type="text"
              className="form-input"
              style={{ textAlign: 'left' }}
              value={form.contact_phone}
              onChange={(e) => handleChange('contact_phone', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.78rem', color: '#AAA', display: 'block', marginBottom: '6px' }}>
              Email Address
            </label>
            <input
              type="email"
              className="form-input"
              style={{ textAlign: 'left' }}
              value={form.contact_email}
              onChange={(e) => handleChange('contact_email', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.78rem', color: '#AAA', display: 'block', marginBottom: '6px' }}>
              Studio Location
            </label>
            <input
              type="text"
              className="form-input"
              style={{ textAlign: 'left' }}
              value={form.contact_location}
              onChange={(e) => handleChange('contact_location', e.target.value)}
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '0.78rem', color: '#AAA', display: 'block', marginBottom: '6px' }}>
            Contacts Headline Quote
          </label>
          <input
            type="text"
            className="form-input"
            style={{ textAlign: 'left' }}
            value={form.contact_quote}
            onChange={(e) => handleChange('contact_quote', e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '0.78rem', color: '#AAA', display: 'block', marginBottom: '6px' }}>
            Contacts Philosophy & Bio
          </label>
          <textarea
            className="form-input"
            rows={3}
            style={{ textAlign: 'left' }}
            value={form.contact_bio}
            onChange={(e) => handleChange('contact_bio', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label style={{ fontSize: '0.78rem', color: '#AAA', display: 'block', marginBottom: '6px' }}>
            Google Maps Search Query
          </label>
          <input
            type="text"
            className="form-input"
            style={{ textAlign: 'left' }}
            value={form.map_query}
            onChange={(e) => handleChange('map_query', e.target.value)}
          />
        </div>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">Footer & Copyright</h3>
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '0.78rem', color: '#AAA', display: 'block', marginBottom: '6px' }}>
            Footer Quote
          </label>
          <textarea
            className="form-input"
            rows={2}
            style={{ textAlign: 'left' }}
            value={form.footer_quote}
            onChange={(e) => handleChange('footer_quote', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label style={{ fontSize: '0.78rem', color: '#AAA', display: 'block', marginBottom: '6px' }}>
            Copyright Notice
          </label>
          <input
            type="text"
            className="form-input"
            style={{ textAlign: 'left' }}
            value={form.copyright}
            onChange={(e) => handleChange('copyright', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};
