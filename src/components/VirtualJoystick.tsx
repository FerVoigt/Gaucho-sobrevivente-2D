import React, { useRef, useState, useCallback, useEffect } from 'react';

interface VirtualJoystickProps {
  onMove: (x: number, y: number) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const radius = 50;

  const handleStart = (clientX: number, clientY: number) => {
    setActive(true);
    updateKnob(clientX, clientY);
  };

  const updateKnob = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);

      if (dist === 0) {
        setKnobPos({ x: 0, y: 0 });
        onMove(0, 0);
        return;
      }

      const clampedDist = Math.min(dist, radius);
      const nx = (dx / dist) * (clampedDist / radius);
      const ny = (dy / dist) * (clampedDist / radius);

      setKnobPos({
        x: (dx / dist) * clampedDist,
        y: (dy / dist) * clampedDist,
      });

      onMove(nx, ny);
    },
    [onMove]
  );

  const handleEnd = useCallback(() => {
    setActive(false);
    setKnobPos({ x: 0, y: 0 });
    onMove(0, 0);
  }, [onMove]);

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (!active) return;
      const touch = e.touches[0];
      if (touch) updateKnob(touch.clientX, touch.clientY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!active) return;
      updateKnob(e.clientX, e.clientY);
    };

    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleEnd);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);

    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
    };
  }, [active, updateKnob, handleEnd]);

  return (
    <div
      ref={containerRef}
      onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      className="absolute bottom-6 left-6 w-28 h-28 rounded-full bg-slate-950/60 border-2 border-slate-700/60 backdrop-blur-sm flex items-center justify-center pointer-events-auto touch-none shadow-2xl z-20 select-none"
      title="Controle Virtual (Arraste para mover)"
    >
      {/* Inner guide ring */}
      <div className="w-14 h-14 rounded-full border border-slate-700/40 pointer-events-none" />

      {/* Thumb Knob */}
      <div
        className="absolute w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 border-2 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.6)] pointer-events-none transition-transform duration-75"
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
        }}
      />
    </div>
  );
};
