import React, { useState, useEffect } from 'react';
import { ChestReward } from '../types/survivors';
import { Sparkles, Coins, Check } from 'lucide-react';

interface ChestModalProps {
  reward: ChestReward;
  onClose: () => void;
}

export const ChestModal: React.FC<ChestModalProps> = ({ reward, onClose }) => {
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOpened(true);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-lg p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-lg flex flex-col items-center gap-5 text-center">
        {/* Glowing chest icon */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-44 h-44 rounded-full bg-amber-500/25 blur-3xl animate-pulse" />
          <div
            className={`w-28 h-28 rounded-3xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-950 border-4 border-amber-300 flex items-center justify-center text-6xl shadow-[0_0_40px_rgba(245,158,11,0.8)] transition-all duration-500 ${
              opened ? 'scale-110 rotate-3' : 'scale-95 animate-bounce'
            }`}
          >
            {opened ? '🎁' : '📦'}
          </div>
        </div>

        {/* Title */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
            <h2 className="font-serif font-black text-2xl md:text-3xl text-amber-300 tracking-wider">
              {reward.tier === 5
                ? 'JACKPOT SUPREMO (5 ITENS)!'
                : reward.tier === 3
                ? 'BAÚ DOURADO (3 ITENS)!'
                : 'BAÚ DO TESOURO!'}
            </h2>
            <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
          </div>

          <div className="flex items-center gap-1.5 text-amber-200 mt-1 font-mono font-bold text-sm bg-amber-950/80 px-3 py-1 rounded-full border border-amber-500/50">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span>+{reward.gold} MOEDAS DE OURO</span>
          </div>
        </div>

        {/* Upgrades Received */}
        <div className="flex flex-col gap-2.5 w-full">
          {reward.upgrades.map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-2xl border-2 flex items-center justify-between gap-3 shadow-xl transition-all duration-300 ${
                opened ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              } ${
                item.isEvolution
                  ? 'bg-gradient-to-r from-red-950 to-purple-950 border-amber-400'
                  : item.type === 'consumable'
                  ? item.id === 'max_level_heal'
                    ? 'bg-gradient-to-r from-emerald-950/80 to-slate-900 border-emerald-500'
                    : 'bg-gradient-to-r from-amber-950/80 to-slate-900 border-amber-500'
                  : 'bg-slate-900/90 border-amber-600/70'
              }`}
              style={{ transitionDelay: `${idx * 150}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center text-2xl">
                  {item.icon}
                </div>
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-slate-100">{item.name}</span>
                    <span className="text-[10px] bg-amber-500/30 text-amber-300 border border-amber-500/60 px-2 py-0.5 rounded-full font-bold">
                      {item.isEvolution
                        ? 'SUPREMO'
                        : item.type === 'consumable'
                        ? item.id === 'max_level_heal'
                          ? '+25% VIDA'
                          : '+50 OURO'
                        : `Nv. ${item.nextLevel}`}
                    </span>
                  </div>
                  <span className="text-xs text-slate-300 mt-0.5">{item.description}</span>
                </div>
              </div>
              <Check className="w-5 h-5 text-emerald-400 shrink-0" />
            </div>
          ))}
        </div>

        {/* Continue button */}
        <button
          onClick={onClose}
          className="mt-2 w-full max-w-xs py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-serif font-bold text-base tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.5)] transition hover:scale-105 active:scale-95 cursor-pointer"
        >
          CONTINUAR BATALHA
        </button>
      </div>
    </div>
  );
};
