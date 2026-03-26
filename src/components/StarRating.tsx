import { useState } from 'react';

interface StarRatingProps {
  rating: number;
  size?: number;
}

const StarRating = ({ rating, size = 14 }: StarRatingProps) => {
  const [hovered, setHovered] = useState(false);

  return (
    <span
      className="inline-flex gap-0.5 cursor-default"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 20 20"
          className={`transition-all duration-200 ${
            i < rating
              ? hovered && rating === 5
                ? 'animate-star-pulse text-secondary'
                : 'text-secondary'
              : 'text-muted'
          }`}
          style={
            hovered && rating === 5
              ? { animationDelay: `${i * 80}ms` }
              : undefined
          }
          fill="currentColor"
        >
          <path d="M10 1.5l2.47 5.01L18 7.27l-4 3.9.94 5.5L10 14.14l-4.94 2.53.94-5.5-4-3.9 5.53-.76L10 1.5z" />
        </svg>
      ))}
    </span>
  );
};

export default StarRating;
