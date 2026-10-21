import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { DataProvider } from '../lib/dataContext.tsx';
import { Header } from '../components/Header.tsx';
import { Footer } from '../components/Footer.tsx';

// Lazy loaded page components for maximum performance and minimum initial JS bundle (<150KB)
const HomePage = lazy(() =>
  import('../features/home/HomePage.tsx').then((m) => ({ default: m.HomePage }))
);
const CategoryPage = lazy(() =>
  import('../features/category/CategoryPage.tsx').then((m) => ({ default: m.CategoryPage }))
);
const ProjectsPage = lazy(() =>
  import('../features/projects/ProjectsPage.tsx').then((m) => ({ default: m.ProjectsPage }))
);
const ContactsPage = lazy(() =>
  import('../features/contact/ContactsPage.tsx').then((m) => ({ default: m.ContactsPage }))
);
const AdminDashboard = lazy(() =>
  import('../features/admin/AdminDashboard.tsx').then((m) => ({ default: m.AdminDashboard }))
);

const PageLoader: React.FC = () => (
  <div
    style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#000000',
    }}
  >
    <div
      style={{
        width: '32px',
        height: '32px',
        border: '2px solid rgba(200, 145, 74, 0.2)',
        borderTopColor: 'var(--color-gold)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  </div>
);

const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="site-wrapper">
      <Header />
      <main className="main-content">{children}</main>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <HelmetProvider>
      <DataProvider>
        <BrowserRouter>
          <PublicLayout>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Home */}
                <Route path="/" element={<HomePage />} />

                {/* 4 Dedicated Category Pages as requested */}
                <Route
                  path="/sports-photography"
                  element={<CategoryPage categorySlug="sports" />}
                />
                <Route
                  path="/street-photography"
                  element={<CategoryPage categorySlug="street" />}
                />
                <Route
                  path="/nature-photography"
                  element={<CategoryPage categorySlug="nature" />}
                />
                <Route
                  path="/wildlife"
                  element={<CategoryPage categorySlug="wildlife" />}
                />

                {/* Projects & Modal Gallery URL-synced */}
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/:slug" element={<ProjectsPage />} />

                {/* Contacts */}
                <Route path="/contacts" element={<ContactsPage />} />

                {/* Lazy-loaded Admin Dashboard (Visitors never download this chunk) */}
                <Route path="/admin" element={<AdminDashboard />} />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </PublicLayout>
        </BrowserRouter>
      </DataProvider>
    </HelmetProvider>
  );
}
