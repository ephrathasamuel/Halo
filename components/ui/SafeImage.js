'use client';

import { useState } from 'react';
import Image from 'next/image';

/**
 * Image component with automatic fallback when local or remote image fails to load.
 * Supports both Next.js Image optimization and inline SVG fallback.
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
    const icons = {
      studio: '🏢',
      equipment: '📹',
      service: '🎬',
      avatar: '👤',
      provider: '⭐',
      default: '🖼️',
    };
    const icon = icons[fallbackType] || icons.default;

    return (
      <div
        className={`bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 flex flex-col items-center justify-center p-3 select-none ${
          fill ? 'absolute inset-0 w-full h-full' : ''
        } ${className}`}
        style={!fill && width && height ? { width, height } : undefined}
        role="img"
        aria-label={alt || 'Image placeholder'}
      >
        <span className="text-3xl mb-1 filter drop-shadow-sm" aria-hidden="true">
          {icon}
        </span>
        <span className="text-xs font-medium text-slate-500 text-center line-clamp-1 max-w-[90%]">
          {alt || 'Halo Media'}
        </span>
      </div>
    );
  }

  // If using fill mode
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
