import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Menu, X, Lock } from 'lucide-react';
import { useData } from '../lib/dataContext.tsx';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { settings, isAdmin } = useData();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'HOME', path: '/' },
    { label: 'SPORTS PHOTOGRAPHY', path: '/sports-photography' },
    { label: 'STREET PHOTOGRAPHY', path: '/street-photography' },
    { label: 'NATURE PHOTOGRAPHY', path: '/nature-photography' },
    { label: 'WILDLIFE', path: '/wildlife' },
    { label: 'PROJECTS', path: '/projects' },
    { label: 'CONTACTS', path: '/contacts' },
  ];

  const headerClass = `site-header ${
    scrolled ? 'scrolled' : isHomePage ? 'transparent' : 'scrolled'
  }`;

  return (
    <header className={headerClass}>
      <div className="header-inner">
        {/* Logo Lockup */}
        <Link to="/" className="site-logo" onClick={() => setMobileMenuOpen(false)}>
          <img
            src="/wrishu-logo.png"
            alt={settings.logo_top ? `${settings.logo_top} ${settings.logo_bottom}` : 'Wrishu Photography'}
            className="site-logo-img"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="desktop-nav" aria-label="Main Navigation">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              style={{ color: 'var(--color-gold)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <Lock size={12} />
              ADMIN
            </NavLink>
          )}
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          className="mobile-nav-toggle"
          aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      <div
        className={`mobile-drawer-overlay ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Drawer */}
      <div className={`mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        {navLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            {link.label}
          </NavLink>
        ))}
        {isAdmin ? (
          <NavLink
            to="/admin"
            className="nav-link"
            style={{ color: 'var(--color-gold)' }}
            onClick={() => setMobileMenuOpen(false)}
          >
            ADMIN DASHBOARD
          </NavLink>
        ) : (
          <NavLink
            to="/admin"
            className="nav-link"
            style={{ color: '#666', fontSize: '0.75rem' }}
            onClick={() => setMobileMenuOpen(false)}
          >
            ADMIN LOGIN
          </NavLink>
        )}
      </div>
    </header>
  );
};
