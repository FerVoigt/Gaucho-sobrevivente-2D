import React from 'react';
import { Sparkles, RefreshCw, FastForward, Trash2 } from 'lucide-react';
import { UpgradeOption } from '../types/survivors';

interface LevelUpModalProps {
  options: UpgradeOption[];
  onSelect: (option: UpgradeOption) => void;
  rerollsLeft: number;
  skipsLeft: number;
  onReroll: () => void;
  onSkip: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  options,
  onSelect,
  rerollsLeft,
  skipsLeft,
  onReroll,
  onSkip,
}) => {
  // Safety fallback if options were ever empty: ensure player is never blocked
  const effectiveOptions: UpgradeOption[] =
    options && options.length > 0
      ? options
      : [
          {
            type: 'consumable',
            id: 'max_level_heal',
            name: 'Costelão Campeiro (+25% Vida)',
            icon: '🍖',
            currentLevel: 0,
            nextLevel: 0,
            description: 'Recupera 25% da sua Vida Máxima imediatamente.',
            isNew: false,
            isEvolution: false,
            consumableType: 'heal',
          },
          {
            type: 'consumable',
            id: 'max_level_gold',
            name: 'Saco de Pilas (+50 Ouro)',
            icon: '💰',
            currentLevel: 0,
            nextLevel: 0,
            description: 'Adiciona 50 Pilas ao seu tesouro da partida.',
            isNew: false,
            isEvolution: false,
            consumableType: 'gold',
          },
        ];

  const isMaxLevelOnly = effectiveOptions.every((o) => o.type === 'consumable' || o.id === 'max_level_heal' || o.id === 'max_level_gold');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl flex flex-col items-center gap-4">
        {/* Title Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
            <h1 className="font-serif font-black text-3xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-yellow-600 drop-shadow-[0_2px_12px_rgba(245,158,11,0.8)] tracking-wider">
              {isMaxLevelOnly ? 'NÍVEL MÁXIMO!' : 'SUBIU DE NÍVEL!'}
            </h1>
            <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
          </div>
          <p className="text-xs md:text-sm text-amber-200/80 mt-0.5">
            {isMaxLevelOnly
              ? 'Todas as habilidades foram aprimoradas! Escolha uma dádiva de campo:'
              : 'Escolha uma dádiva divina para fortalecer seu sobrevivente'}
          </p>
        </div>

        {/* Upgrade Cards List */}
        <div className="flex flex-col gap-2.5 w-full">
          {effectiveOptions.map((option, idx) => {
            let cardBorder = 'border-slate-700 hover:border-cyan-400 bg-slate-900/90';
            let tagBadge = 'bg-blue-900/80 text-blue-200 border-blue-600';
            let tagText = 'NOVO';

            if (option.isEvolution) {
              cardBorder =
                'border-amber-400 hover:border-yellow-200 bg-gradient-to-r from-red-950 via-purple-950 to-slate-900 shadow-[0_0_20px_rgba(245,158,11,0.5)]';
              tagBadge = 'bg-gradient-to-r from-amber-500 to-red-600 text-white border-amber-300 font-bold animate-pulse';
              tagText = 'EVOLUÇÃO SUPREMA';
            } else if (option.type === 'consumable' || option.id === 'max_level_heal' || option.id === 'max_level_gold') {
              if (option.id === 'max_level_heal' || option.consumableType === 'heal') {
                cardBorder =
                  'border-emerald-500/80 hover:border-emerald-300 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 shadow-[0_0_15px_rgba(16,185,129,0.3)]';
                tagBadge = 'bg-emerald-900 text-emerald-200 border-emerald-400 font-bold';
                tagText = '+25% VIDA';
              } else {
                cardBorder =
                  'border-amber-500/80 hover:border-amber-300 bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-900 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
                tagBadge = 'bg-amber-900 text-amber-200 border-amber-400 font-bold';
                tagText = '+50 PILAS';
              }
            } else if (option.type === 'weapon' && !option.isNew) {
              cardBorder = 'border-amber-600/70 hover:border-amber-400 bg-slate-900/95';
              tagBadge = 'bg-amber-900/80 text-amber-200 border-amber-500';
              tagText = `NV. ${option.nextLevel}`;
            } else if (option.type === 'passive') {
              cardBorder = 'border-emerald-600/70 hover:border-emerald-400 bg-slate-900/95';
              tagBadge = 'bg-emerald-900/80 text-emerald-200 border-emerald-500';
              tagText = option.isNew ? 'PASSIVA' : `NV. ${option.nextLevel}`;
            }

            return (
              <button
                key={`${option.id}-${idx}`}
                onClick={() => onSelect(option)}
                className={`group w-full text-left p-3.5 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between gap-4 cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-xl ${cardBorder}`}
              >
                {/* Left: Icon & Details */}
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition shadow-inner">
                    {option.icon}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif font-bold text-base md:text-lg text-slate-100 group-hover:text-amber-300 transition">
                        {option.name}
                      </h3>
                      <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full border ${tagBadge}`}>
                        {tagText}
                      </span>
                    </div>

                    <p className="text-xs md:text-sm text-slate-300 mt-1 leading-relaxed">
                      {option.description}
                    </p>
                  </div>
                </div>

                {/* Right: Level Indicators or Consumable Label */}
                <div className="flex flex-col items-end shrink-0 pl-2">
                  {option.type === 'consumable' || option.id === 'max_level_heal' || option.id === 'max_level_gold' ? (
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-mono font-bold text-amber-300">
                        {option.id === 'max_level_heal' ? 'CURA' : 'TESOURO'}
                      </span>
                      <span className="text-[10px] text-slate-400">INSTANTÂNEO</span>
                    </div>
                  ) : (
                    <>
                      <span className="text-[11px] font-mono text-slate-400">
                        {option.isEvolution ? 'MAX' : `Nv. ${option.nextLevel}`}
                      </span>
                      <div className="flex gap-1 mt-1">
                        {Array.from({ length: Math.min(8, option.nextLevel) }).map((_, s) => (
                          <div
                            key={s}
                            className={`w-1.5 h-3 rounded-sm ${
                              option.isEvolution ? 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)]' : 'bg-cyan-400'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Options: Reroll & Skip */}
        <div className="flex items-center justify-center gap-3 mt-1 w-full">
          <button
            onClick={onReroll}
            disabled={rerollsLeft <= 0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition shadow-lg ${
              rerollsLeft > 0
                ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/40 hover:border-amber-400 cursor-pointer'
                : 'bg-slate-900/50 text-slate-600 border-slate-800 cursor-not-allowed'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Rerrolar ({rerollsLeft})</span>
          </button>

          <button
            onClick={onSkip}
            disabled={skipsLeft <= 0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition shadow-lg ${
              skipsLeft > 0
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-600 hover:border-slate-400 cursor-pointer'
                : 'bg-slate-900/50 text-slate-600 border-slate-800 cursor-not-allowed'
            }`}
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Pular ({skipsLeft})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
