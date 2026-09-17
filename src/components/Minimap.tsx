import React from 'react';
import { MonsterData } from '../types';

interface MinimapProps {
  playerPos: [number, number, number];
  playerAngle: number;
  summonPos?: [number, number, number];
  monsters: { data: MonsterData; meshPos: [number, number, number] }[];
}

export const Minimap: React.FC<MinimapProps> = ({
  playerPos,
  playerAngle,
  summonPos,
  monsters,
}) => {
  // Minimap range in world units
  const mapRadius = 80;
  const mapSize = 130; // pixels

  const worldToMap = (wx: number, wz: number) => {
    const dx = wx - playerPos[0];
    const dz = wz - playerPos[2];

    const mx = (dx / mapRadius) * (mapSize / 2) + mapSize / 2;
    const my = (dz / mapRadius) * (mapSize / 2) + mapSize / 2;

    return { mx, my, inRange: Math.hypot(dx, dz) <= mapRadius };
  };

  return (
    <div
      id="oriental-minimap"
      className="relative w-[130px] h-[130px] rounded-full bg-slate-950/90 border-2 border-amber-500/70 shadow-2xl overflow-hidden backdrop-blur-md"
    >
      {/* Compass / Radar Rings */}
      <div className="absolute inset-0 rounded-full border border-amber-500/20" />
      <div className="absolute inset-4 rounded-full border border-cyan-500/15" />
      <div className="absolute inset-8 rounded-full border border-slate-700/30" />

      {/* Crosshair lines */}
      <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-amber-500/20 transform -translate-y-1/2" />
      <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-amber-500/20 transform -translate-x-1/2" />

      {/* Cardinal direction indicators */}
      <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-bold text-amber-300 font-serif">N</span>
      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] font-bold text-slate-500 font-serif">S</span>
      <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-500 font-serif">O</span>
      <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-500 font-serif">L</span>

      {/* Monsters dots */}
      {monsters.map((m) => {
        if (m.data.currentHp <= 0) return null;
        const { mx, my, inRange } = worldToMap(m.meshPos[0], m.meshPos[2]);
        if (!inRange) return null;

        const isBoss = m.data.type === 'boss';
        return (
          <div
            key={m.data.id}
            title={`${m.data.name} (Nv. ${m.data.level})`}
            className={`absolute rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow ${
              isBoss
                ? 'w-3.5 h-3.5 bg-yellow-400 border border-red-600 animate-pulse z-10 flex items-center justify-center text-[8px]'
                : 'w-2 h-2 bg-red-500 border border-red-300'
            }`}
            style={{ left: `${mx}px`, top: `${my}px` }}
          >
            {isBoss && '☠'}
          </div>
        );
      })}

      {/* Active Summon dot */}
      {summonPos && (
        (() => {
          const { mx, my, inRange } = worldToMap(summonPos[0], summonPos[2]);
          if (!inRange) return null;
          return (
            <div
              title="Sua Invocação Ativa"
              className="absolute w-2.5 h-2.5 bg-cyan-400 rounded-full border border-cyan-200 transform -translate-x-1/2 -translate-y-1/2 shadow-cyan-500/50 shadow-sm"
              style={{ left: `${mx}px`, top: `${my}px` }}
            />
          );
        })()
      )}

      {/* Player marker in center with orientation pointer */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
        <div
          className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[9px] border-b-amber-300 drop-shadow"
          style={{ transform: `rotate(${playerAngle + Math.PI}rad)` }}
        />
        <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mx-auto -mt-1 shadow" />
      </div>
    </div>
  );
};
