import React from 'react';

interface PinGlyphProps {
  type: 'vote_plus' | 'vote_minus' | 'pin';
}

export const PinGlyph: React.FC<PinGlyphProps> = ({ type }) => {
  const glyphs = {
    vote_plus: '+',
    vote_minus: '-',
    pin: '📌',
  };

  return <span>{glyphs[type] || '?'}</span>;
};