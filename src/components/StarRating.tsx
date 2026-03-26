interface StarRatingProps {
  rating: number;
  size?: number;
}

const StarRating = ({ rating, size = 12 }: StarRatingProps) => {
  return (
    <span className="inline-flex gap-px">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 20 20"
          fill={i < rating ? 'hsl(var(--gold-bright))' : 'hsl(var(--muted))'}
          className="transition-colors duration-150"
        >
          <path d="M10 1.5l2.47 5.01L18 7.27l-4 3.9.94 5.5L10 14.14l-4.94 2.53.94-5.5-4-3.9 5.53-.76L10 1.5z" />
        </svg>
      ))}
    </span>
  );
};

export default StarRating;
