'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { resolveLogoUrl } from '@/lib/brand-logo';

type BrandLogoProps = {
  src?: string | null;
  alt: string;
  width: number;
  height: number;
  className?: string;
  style?: React.CSSProperties;
};

export default function BrandLogo({ src, alt, width, height, className, style }: BrandLogoProps) {
  const fallbackSrc = resolveLogoUrl(null);
  const [currentSrc, setCurrentSrc] = useState(() => resolveLogoUrl(src));

  useEffect(() => {
    setCurrentSrc(resolveLogoUrl(src));
  }, [src]);

  return (
    <Image
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={style}
      unoptimized
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}
