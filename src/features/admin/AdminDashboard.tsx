import React, { useState } from 'react';
import '../../styles/admin.css';
import { useData } from '../../lib/dataContext.tsx';
import { AdminLogin } from './AdminLogin.tsx';
import { HeroSlideEditor } from './HeroSlideEditor.tsx';
import { AboutStatsEditor } from './AboutStatsEditor.tsx';
import { PhotosManager } from './PhotosManager.tsx';
import { ProjectsManager } from './ProjectsManager.tsx';
import { MessagesInbox } from './MessagesInbox.tsx';
import { SiteSettingsEditor } from './SiteSettingsEditor.tsx';
import { SeoHead } from '../../components/SeoHead.tsx';
import {
  LayoutDashboard,
  Sliders,
  User,
  Image,
  FolderKanban,
  Mail,
  Settings,
  ExternalLink,
  LogOut,
  Camera,
  HardDrive,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

type AdminTab = 'dashboard' | 'hero' | 'about' | 'photos' | 'projects' | 'messages' | 'settings';

export const AdminDashboard: React.FC = () => {
  const { isAdmin, logoutAdmin, photos, heroSlides, projects, messages, stats } = useData();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  if (!isAdmin) {
    return <AdminLogin />;
  }

  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <div className="admin-layout">
      <SeoHead title="Admin Dashboard - Wrishu Photography" noIndex={true} />

      {/* Left Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
          <img
            src="/wrishu-logo.png"
            alt="Wrishu Photography"
            style={{ height: '30px', objectFit: 'contain' }}
          />
          <div style={{ fontSize: '0.7rem', color: 'var(--color-gold)', letterSpacing: '0.05em' }}>
            PORTFOLIO ADMIN · DUAL BUCKET
          </div>
        </div>

        <nav className="admin-nav">
          <button
            className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={17} />
            <span>Dashboard</span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'hero' ? 'active' : ''}`}
            onClick={() => setActiveTab('hero')}
          >
            <Sliders size={17} />
            <span>Hero Slider</span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            <User size={17} />
            <span>About & Stats</span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'photos' ? 'active' : ''}`}
            onClick={() => setActiveTab('photos')}
          >
            <Image size={17} />
            <span>Photo Catalog</span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            <FolderKanban size={17} />
            <span>Projects</span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            <Mail size={17} />
            <span style={{ flex: 1 }}>Messages</span>
            {unreadCount > 0 && (
              <span className="admin-badge admin-badge-gold">{unreadCount}</span>
            )}
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={17} />
            <span>Site Settings</span>
          </button>

          <div style={{ margin: '16px 0', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }} />

          <Link
            to="/"
            target="_blank"
            className="admin-nav-item"
            style={{ color: '#888' }}
          >
            <ExternalLink size={16} />
            <span>Live Site Preview</span>
          </Link>

          <button
            onClick={() => logoutAdmin()}
            className="admin-nav-item"
            style={{ color: '#f87171', marginTop: 'auto' }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Pane */}
      <main className="admin-main">
        {/* Toast */}
        {toastMessage && (
          <div className="admin-toast">
            <CheckCircle2 size={18} color="var(--color-gold)" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 1. Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#FFF' }}>Portfolio Overview</h1>
              <p style={{ color: '#888', fontSize: '0.88rem' }}>
                System health, storage metrics, and quick shortcuts for Navid Mustasim Wrishu.
              </p>
            </div>

            {/* Metrics Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '32px',
              }}
            >
              <div className="admin-card" style={{ padding: '20px', marginBottom: 0 }}>
                <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Photos
                </span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-gold)', marginTop: '4px' }}>
                  {photos.length}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#666' }}>
                  {photos.filter((p) => p.home_gallery).length} in Home Gallery
                </span>
              </div>

              <div className="admin-card" style={{ padding: '20px', marginBottom: 0 }}>
                <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Hero Slides
                </span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#FFF', marginTop: '4px' }}>
                  {heroSlides.length}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#4ade80' }}>
                  {heroSlides.filter((s) => s.active).length} active on homepage
                </span>
              </div>

              <div className="admin-card" style={{ padding: '20px', marginBottom: 0 }}>
                <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Projects & Series
                </span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#FFF', marginTop: '4px' }}>
                  {projects.length}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#666' }}>
                  FIFA, Premier League, Dhaka
                </span>
              </div>

              <div className="admin-card" style={{ padding: '20px', marginBottom: 0 }}>
                <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Client Inquiries
                </span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: unreadCount > 0 ? 'var(--color-gold)' : '#FFF', marginTop: '4px' }}>
                  {messages.length}
                </div>
                <span style={{ fontSize: '0.75rem', color: unreadCount > 0 ? 'var(--color-gold)' : '#666' }}>
                  {unreadCount} unread message{unreadCount === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            {/* Storage & Architecture Card */}
            <div className="admin-card">
              <h3 className="admin-card-title">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HardDrive size={18} color="var(--color-gold)" />
                  <span>Cloudflare R2 & Supabase Dual Storage Architecture</span>
                </div>
              </h3>
              <p style={{ color: '#AAA', fontSize: '0.88rem', lineHeight: 1.7 }}>
                Homepage hero slider images are streamed with zero delay via Supabase Public Storage bucket <code>hero</code>. All high-resolution sports, street, and nature images are compressed to responsive AVIF/WebP variants client-side and saved to Cloudflare R2 on a high-speed global CDN domain.
              </p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button onClick={() => setActiveTab('photos')} className="btn btn-gold btn-sm">
                  Upload Photos
                </button>
                <button onClick={() => setActiveTab('hero')} className="btn btn-sm">
                  Configure Hero Slider
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. Hero Tab */}
        {activeTab === 'hero' && <HeroSlideEditor />}

        {/* 3. About & Stats Tab */}
        {activeTab === 'about' && <AboutStatsEditor onNotify={showToast} />}

        {/* 4. Photos Catalog Tab */}
        {activeTab === 'photos' && <PhotosManager onNotify={showToast} />}

        {/* 5. Projects Tab */}
        {activeTab === 'projects' && <ProjectsManager onNotify={showToast} />}

        {/* 6. Messages Tab */}
        {activeTab === 'messages' && <MessagesInbox onNotify={showToast} />}

        {/* 7. Settings Tab */}
        {activeTab === 'settings' && <SiteSettingsEditor onNotify={showToast} />}
      </main>
    </div>
  );
};
