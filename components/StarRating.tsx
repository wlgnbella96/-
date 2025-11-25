import React from 'react';
import { ICONS } from '../constants';

interface StarRatingProps {
  rating: number;
  setRating?: (rating: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const StarRating: React.FC<StarRatingProps> = ({ rating, setRating, readOnly = false, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => setRating && setRating(star)}
          className={`transition-colors duration-200 ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
        >
          <ICONS.Star
            className={`${sizeClasses[size]} ${
              star <= rating
                ? 'fill-amber-400 text-amber-400'
                : 'fill-gray-200 text-gray-300 dark:fill-zinc-800 dark:text-zinc-600'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating;