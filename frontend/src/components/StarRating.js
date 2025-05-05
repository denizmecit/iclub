import React from 'react';
import './StarRating.css';

const StarRating = ({ value, onChange, readOnly, size = 'medium' }) => {
  const stars = [1, 2, 3, 4, 5];

  const handleClick = (rating) => {
    if (!readOnly && onChange) {
      onChange(rating);
    }
  };

  return (
    <div className={`star-rating ${size} ${readOnly ? 'readonly' : ''}`}>
      {stars.map((star) => (
        <span
          key={star}
          className={`star ${star <= value ? 'filled' : ''}`}
          onClick={() => handleClick(star)}
          role={readOnly ? 'presentation' : 'button'}
          aria-label={readOnly ? `${value} out of 5 stars` : `Rate ${star} out of 5 stars`}
        >
          ★
        </span>
      ))}
    </div>
  );
};

export default StarRating; 