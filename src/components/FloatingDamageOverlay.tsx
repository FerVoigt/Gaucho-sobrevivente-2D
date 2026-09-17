import React from 'react';
import { FloatingDamage } from '../types';

interface FloatingDamageOverlayProps {
  damages: FloatingDamage[];
}

export const FloatingDamageOverlay: React.FC<FloatingDamageOverlayProps> = ({ damages }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {damages.map((dmg) => (
        <div
          key={dmg.id}
          className={`absolute transform -translate-x-1/2 -translate-y-1/2 font-black transition-all duration-700 ease-out font-mono select-none ${
            dmg.isCrit ? 'text-2xl drop-shadow-[0_2px_8px_rgba(234,179,8,0.8)]' : 'text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'
          }`}
          style={{
            left: `${dmg.x}px`,
            top: `${dmg.y}px`,
            color: dmg.color,
            opacity: dmg.opacity,
          }}
        >
          {dmg.isCrit && <span className="text-xs text-yellow-300 block text-center font-serif">CRÍTICO!</span>}
          {dmg.text}
        </div>
      ))}
    </div>
  );
};
