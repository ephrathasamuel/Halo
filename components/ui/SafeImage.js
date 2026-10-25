'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Building2, Camera, Clapperboard, ImageOff, Store, User } from 'lucide-react';

const FALLBACK_ICONS = {
  studio: Building2,
  equipment: Camera,
  service: Clapperboard,
  avatar: User,
  provider: Store,
  default: ImageOff,
};

/**
 * Image component with a quiet fallback when a local or remote image fails to load.
 * @param {{
 *   src: string,
 *   alt: string,
 *   fallbackType?: 'studio' | 'equipment' | 'service' | 'avatar' | 'provider' | 'default',
 *   className?: string,
 *   fill?: boolean,
 *   width?: number,
 *   height?: number,
 *   priority?: boolean,
 *   sizes?: string
 * }} props
 */
export function SafeImage({
  src,
  alt,
  fallbackType = 'default',
  className = '',
  fill,
  width,
  height,
  priority = false,
  sizes,
  ...rest
}) {
  const [error, setError] = useState(!src);

  if (error || !src) {
    const Icon = FALLBACK_ICONS[fallbackType] || FALLBACK_ICONS.default;

    return (
      <div
        className={`bg-halo-placeholder text-halo-text-muted flex items-center justify-center select-none ${
          fill ? 'absolute inset-0 w-full h-full' : ''
        } ${className}`}
        style={!fill && width && height ? { width, height } : undefined}
        role="img"
        aria-label={alt || 'Image not available'}
      >
        <Icon className="w-8 h-8" strokeWidth={1.5} aria-hidden="true" />
      </div>
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
        priority={priority}
        className={className}
        onError={() => setError(true)}
        unoptimized
        {...rest}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width || 400}
      height={height || 300}
      priority={priority}
      className={className}
      onError={() => setError(true)}
      unoptimized
      {...rest}
    />
  );
}
