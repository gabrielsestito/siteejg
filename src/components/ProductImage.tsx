'use client';

import { useState } from 'react';
import { getImageUrl } from '@/lib/image-utils';

interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fallback?: string;
}

export function ProductImage({
  src,
  alt,
  className = '',
  width,
  height,
  fallback = '/image.jpg',
}: ProductImageProps) {
  const [imageSrc, setImageSrc] = useState(getImageUrl(src, fallback));
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    // Se a imagem falhar e não for o fallback, tenta usar o fallback
    if (!hasError && imageSrc !== fallback && src && src.trim() !== '') {
      setHasError(true);
      setImageSrc(fallback);
    }
  };

  // Se não houver src e não houver fallback, mostra placeholder
  if (!src || src.trim() === '') {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <svg
          className="w-12 h-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading="lazy"
      onError={handleError}
    />
  );
}

