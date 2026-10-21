import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SeoHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  noIndex?: boolean;
}

export const SeoHead: React.FC<SeoHeadProps> = ({
  title = 'Wrishu Photography - Navid Mustasim Wrishu',
  description = 'Official photography portfolio of Navid Mustasim Wrishu — Sports, Street, Nature & Wildlife Photographer, Educator, and Entrepreneur.',
  image = '/og-image.jpg',
  url = 'https://wrishu.com',
  noIndex = false,
}) => {
  const fullTitle = title.includes('Wrishu') ? title : `${title} | Navid Mustasim Wrishu`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noIndex ? <meta name="robots" content="noindex, nofollow" /> : <meta name="robots" content="index, follow" />}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};
