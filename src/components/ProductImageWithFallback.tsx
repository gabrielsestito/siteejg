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
  // Normalizar o caminho da imagem - suporta base64, URLs relativas e absolutas
  const normalizeImagePath = (path: string | null | undefined): string => {
    if (!path || path.trim() === '') {
      return fallback;
    }
    
    const normalized = path.trim();
    
    // Se for base64 (data:image/...), usar como está - PRIORIDADE MÁXIMA
    if (normalized.startsWith('data:image/')) {
      return normalized;
    }
    
    // Se já começar com /, usar como está
    if (normalized.startsWith('/')) {
      return normalized;
    }
    
    // Se for um caminho de produtos sem /, adicionar /
    if (normalized.startsWith('products/')) {
      return `/${normalized}`;
    }
    
    // Se for URL completa (http/https), usar como está
    if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
      return normalized;
    }
    
    // Caso contrário, adicionar / no início
    return `/${normalized}`;
  };

  const normalizedSrc = normalizeImagePath(src);
  const [imageSrc, setImageSrc] = useState(normalizedSrc);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Atualizar a imagem quando a prop src mudar
  useEffect(() => {
    const newNormalizedSrc = normalizeImagePath(src);
    setImageSrc(newNormalizedSrc);
    setHasError(false);
    setRetryCount(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    const currentSrc = target.src;
    
    // Não usar fallback para base64 (se falhar, é problema de dados inválidos)
    if (currentSrc.startsWith('data:image/') || src.startsWith('data:image/')) {
      // Se for base64 e falhar, não fazer nada (deixa a imagem quebrada)
      return;
    }

    // Se for uma imagem de produto (/products/), tentar novamente uma vez antes de usar fallback
    if (currentSrc.includes('/products/') && retryCount < 1) {
      setRetryCount(prev => prev + 1);
      // Tentar novamente após um pequeno delay
      setTimeout(() => {
        setImageSrc(currentSrc);
        setHasError(false);
      }, 500);
      return;
    }

    // Se não for o fallback e já tentou, usar fallback
    if (!hasError && imageSrc !== fallback && !src.startsWith('data:image/')) {
      setHasError(true);
      setImageSrc(fallback);
    }
  };

  const handleLoad = () => {
    if (hasError) {
      setHasError(false);
    }
  };

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      loading={loading}
      onError={handleError}
      onLoad={handleLoad}
    />
  );
}

