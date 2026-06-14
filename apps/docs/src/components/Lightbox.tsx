import { useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import styles from './Lightbox.module.css';

export interface LightboxImage {
  src: string;
  alt: string;
  caption?: string;
}

interface LightboxProps {
  images: readonly LightboxImage[];
  /** Index of the open image, or null when closed. */
  index: number | null;
  onClose(): void;
  onNavigate(next: number): void;
}

/**
 * Accessible image lightbox with carousel navigation. Esc / backdrop close it,
 * arrow keys (and prev/next controls) cycle. Restores focus to the trigger on
 * close and locks body scroll while open.
 */
export default function Lightbox({ images, index, onClose, onNavigate }: LightboxProps): ReactNode {
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = index !== null;

  const go = useCallback(
    (delta: number) => {
      if (index === null) return;
      onNavigate((index + delta + images.length) % images.length);
    },
    [index, images.length, onNavigate],
  );

  useEffect(() => {
    if (!open) return;
    const restoreTo = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      restoreTo?.focus?.();
    };
  }, [open, go, onClose]);

  if (index === null) return null;
  const img = images[index]!;
  const many = images.length > 1;
  return (
    <div
      className={styles.backdrop}
      onClick={onClose}
      role="presentation"
      aria-label="Screenshot viewer"
    >
      <button ref={closeRef} className={styles.close} onClick={onClose} aria-label="Close">
        ×
      </button>
      {many && (
        <button
          className={`${styles.nav} ${styles.prev}`}
          onClick={(e) => {
            e.stopPropagation();
            go(-1);
          }}
          aria-label="Previous image"
        >
          ‹
        </button>
      )}
      <figure className={styles.figure} onClick={(e) => e.stopPropagation()}>
        <img className={styles.image} src={img.src} alt={img.alt} />
        <figcaption className={styles.caption}>
          {img.caption}
          {many && (
            <span className={styles.counter}>
              {index + 1} / {images.length}
            </span>
          )}
        </figcaption>
      </figure>
      {many && (
        <button
          className={`${styles.nav} ${styles.next}`}
          onClick={(e) => {
            e.stopPropagation();
            go(1);
          }}
          aria-label="Next image"
        >
          ›
        </button>
      )}
    </div>
  );
}
