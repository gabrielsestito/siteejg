'use client';

import { useState, useEffect } from 'react';

interface ProductImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  fallback?: string;
}

export function ProductImageWithFallback({
  src,
  alt,
  className = '',
  loading = 'lazy',
  fallback = '/image.jpg',
}: ProductImageWithFallbackProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  // Atualizar a imagem quando a prop src mudar
  useEffect(() => {
    setImageSrc(src);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    if (!hasError && imageSrc !== fallback) {
      setHasError(true);
      setImageSrc(fallback);
    }
  };

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      loading={loading}
      onError={handleError}
    />
  );
}

