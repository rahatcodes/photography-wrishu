import React, { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  altText: string;
  title?: string;
  showCaption?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export const Lightbox: React.FC<LightboxProps> = ({
  isOpen,
  onClose,
  imageUrl,
  altText,
  title,
  showCaption = true,
  onPrev,
  onNext,
  hasPrev = true,
  hasNext = true,
}) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
      if (e.key === 'ArrowRight' && onNext) onNext();
    },
    [isOpen, onClose, onPrev, onNext]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="lightbox-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image Lightbox"
    >
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button
          className="lightbox-close-btn"
          onClick={onClose}
          aria-label="Close Lightbox"
        >
          <X size={28} />
        </button>

        {hasPrev && onPrev && (
          <button
            className="lightbox-arrow prev"
            onClick={onPrev}
            aria-label="Previous Image"
          >
            <ChevronLeft size={28} />
          </button>
        )}

        <div className="lightbox-image-wrap">
          <img
            src={imageUrl}
            alt={altText}
            className="lightbox-image"
          />
        </div>

        {hasNext && onNext && (
          <button
            className="lightbox-arrow next"
            onClick={onNext}
            aria-label="Next Image"
          >
            <ChevronRight size={28} />
          </button>
        )}

        {showCaption && (title || altText) && (
          <div className="lightbox-caption">
            {title ? <strong>{title} — </strong> : null}
            <span>{altText}</span>
          </div>
        )}
      </div>
    </div>
  );
};
