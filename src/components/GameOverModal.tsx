import React from 'react';
import { Skull, Coins, Clock, Trophy, RotateCcw, Home, Swords } from 'lucide-react';
import { WeaponState } from '../types/survivors';
import { WEAPON_DEFS } from '../game2d/constants';

interface GameOverModalProps {
  victory: boolean;
  timeAlive: number;
  levelReached: number;
  killsCount: number;
  coinsEarned: number;
  characterName: string;
  weapons: WeaponState[];
  onRetry: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  victory,
  timeAlive,
  levelReached,
  killsCount,
  coinsEarned,
  characterName,
  weapons,
  onRetry,
  onHome,
}) => {
  const minutes = Math.floor(timeAlive / 60).toString().padStart(2, '0');
  const seconds = Math.floor(timeAlive % 60).toString().padStart(2, '0');
  const totalDamage = weapons.reduce((acc, w) => acc + w.totalDamageDealt, 0) || 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-slate-950/95 border-2 border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col items-center gap-6 text-slate-200">
        {/* Title */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-2 shadow-xl border border-slate-700 bg-slate-900">
            {victory ? '🏆' : '💀'}
          </div>

          <h1
            className={`font-serif font-black text-3xl md:text-4xl tracking-wider ${
              victory
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500'
                : 'text-rose-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]'
            }`}
          >
            {victory ? 'VITÓRIA GLORIOSA NOS PAMPAS!' : 'O HERÓI CAIU NAS CAMPINAS...'}
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            {victory
              ? `O gaúcho ${characterName} honrou as tradições, derrotou as lendas da noite e fez ecoar o grito de liberdade!`
              : `O gaúcho ${characterName} lutou com bravura até o último suspiro na escuridão.`}
          </p>
        </div>

        {/* Stats Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
          <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
            <Clock className="w-4 h-4 text-cyan-400 mb-1" />
            <span className="text-[10px] uppercase text-slate-400 font-bold">Tempo</span>
            <strong className="text-base font-serif text-cyan-300">
              {minutes}:{seconds}
            </strong>
          </div>

          <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
            <Trophy className="w-4 h-4 text-amber-400 mb-1" />
            <span className="text-[10px] uppercase text-slate-400 font-bold">Nível</span>
            <strong className="text-base font-serif text-amber-300">{levelReached}</strong>
          </div>

          <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
            <Skull className="w-4 h-4 text-rose-400 mb-1" />
            <span className="text-[10px] uppercase text-slate-400 font-bold">Inimigos</span>
            <strong className="text-base font-serif text-rose-300">{killsCount}</strong>
          </div>

          <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
            <Coins className="w-4 h-4 text-yellow-400 mb-1" />
            <span className="text-[10px] uppercase text-slate-400 font-bold">Ouro</span>
            <strong className="text-base font-serif text-yellow-300">{coinsEarned}</strong>
          </div>
        </div>

        {/* Damage Leaderboard */}
        <div className="w-full flex flex-col gap-2">
          <span className="text-xs uppercase font-bold text-slate-400 flex items-center gap-1.5">
            <Swords className="w-3.5 h-3.5 text-amber-400" />
            <span>Dano por Arma</span>
          </span>

          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-3 flex flex-col gap-2 max-h-40 overflow-y-auto">
            {weapons.map((w) => {
              const def = WEAPON_DEFS[w.id];
              const pct = Math.round((w.totalDamageDealt / totalDamage) * 100);

              return (
                <div key={w.id} className="flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{def?.icon || '🗡️'}</span>
                    <span className="font-serif font-bold text-slate-200">{def?.name || w.id}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-amber-300 font-bold">{w.totalDamageDealt.toLocaleString()}</span>
                    <span className="font-mono text-slate-400 w-9 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 w-full pt-2">
          <button
            onClick={onHome}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Menu Principal</span>
          </button>

          <button
            onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-serif font-bold text-sm tracking-wide shadow-lg shadow-amber-500/30 transition hover:scale-105 active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Jogar Novamente</span>
          </button>
        </div>
      </div>
    </div>
  );
};
