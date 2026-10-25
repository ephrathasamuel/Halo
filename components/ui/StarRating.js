import { Star } from 'lucide-react';

/**
 * Read-only star rating.
 * @param {{ rating: number, size?: string }} props
 */
export function StarRating({ rating, size = 'h-4 w-4' }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${size} ${n <= rating ? 'fill-halo-gold text-halo-gold' : 'text-halo-border-strong'}`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

/**
 * Star rating input: five buttons, the chosen one is pressed.
 * @param {{ value: number, onChange: (rating: number) => void }} props
 */
export function StarRatingInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-pressed={n === value}
          aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`}
          className="flex items-center justify-center rounded-lg hover:bg-halo-ink/[0.04]"
        >
          <Star
            className={`h-7 w-7 ${n <= value ? 'fill-halo-gold text-halo-gold' : 'text-halo-border-strong'}`}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
}
