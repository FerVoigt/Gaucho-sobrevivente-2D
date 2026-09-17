import React from 'react';
import { Calendar, CheckCircle2, Gift, Sparkles, X, Coins, Flame } from 'lucide-react';

export interface DailyReward {
  day: number;
  title: string;
  coins: number;
  itemBonusDesc?: string;
  startingItem?: 'chicken' | 'magnet' | 'rosary';
}

export const DAILY_REWARDS: DailyReward[] = [
  { day: 1, title: 'Bênção do Noviço', coins: 150 },
  { day: 2, title: 'Provisões de Batalha', coins: 300, itemBonusDesc: '🍗 Inicia com Frango Assado (+30 HP)', startingItem: 'chicken' },
  { day: 3, title: 'Oferenda Oculta', coins: 500 },
  { day: 4, title: 'Ímã Sagrado', coins: 750, itemBonusDesc: '🧲 Inicia com Vácuo Total (Atrai todas as gemas)', startingItem: 'magnet' },
  { day: 5, title: 'Tesouro da Cripta', coins: 1000 },
  { day: 6, title: 'Relíquia da Luz', coins: 1500, itemBonusDesc: '✝️ Inicia com Rosário Sagrado (Nuke inicial)', startingItem: 'rosary' },
  { day: 7, title: 'Graça do Arquivampiro', coins: 2500, itemBonusDesc: '👑 +500 XP Inicial + Baú de Ouro Supremo' },
];

interface DailyLoginModalProps {
  currentStreak: number;
  canClaim: boolean;
  onClaim: (reward: DailyReward) => void;
  onClose: () => void;
}

export const DailyLoginModal: React.FC<DailyLoginModalProps> = ({
  currentStreak,
  canClaim,
  onClaim,
  onClose,
}) => {
  const currentDayIndex = (currentStreak % 7);
  const activeReward = DAILY_REWARDS[currentDayIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 border-amber-500/50 rounded-3xl p-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col gap-5 text-slate-100 font-sans">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl text-amber-400 shadow-inner">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-black text-2xl text-amber-300 tracking-wider">
                RECOMPENSA DIÁRIA
              </h2>
              <span className="flex items-center gap-1 text-xs font-bold bg-amber-950/80 border border-amber-500/40 text-amber-300 px-2.5 py-0.5 rounded-full">
                <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                <span>Sequência: {currentStreak} {currentStreak === 1 ? 'Dia' : 'Dias'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Entre todos os dias para acumular moedas e itens iniciais lendários!
            </p>
          </div>
        </div>

        {/* 7 Days Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 my-2">
          {DAILY_REWARDS.map((reward, idx) => {
            const isClaimed = idx < currentDayIndex || (idx === currentDayIndex && !canClaim);
            const isCurrent = idx === currentDayIndex && canClaim;
            const isFuture = idx > currentDayIndex;

            return (
              <div
                key={reward.day}
                className={`relative flex flex-col items-center justify-between p-3 rounded-2xl border-2 transition-all duration-200 text-center ${
                  isCurrent
                    ? 'bg-gradient-to-b from-amber-950/70 to-slate-900 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)] scale-105'
                    : isClaimed
                    ? 'bg-slate-950/60 border-emerald-900/60 opacity-80'
                    : 'bg-slate-950/50 border-slate-800 opacity-60'
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Dia {reward.day}
                </span>

                <div className="my-2 text-2xl">
                  {reward.day === 7 ? '👑' : reward.startingItem ? (reward.startingItem === 'chicken' ? '🍗' : reward.startingItem === 'magnet' ? '🧲' : '✝️') : '🪙'}
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-xs font-mono font-bold text-amber-300">
                    +{reward.coins}
                  </span>
                  {reward.startingItem && (
                    <span className="text-[9px] text-cyan-300 font-semibold line-clamp-1">
                      +Item
                    </span>
                  )}
                </div>

                {isClaimed && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] rounded-2xl flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 fill-emerald-950" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Active Day Detail Banner */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl text-amber-400">
              <Gift className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-300">
                Recompensa de Hoje: <strong className="text-amber-300">{activeReward.title}</strong>
              </span>
              <span className="text-[11px] text-slate-400">
                +{activeReward.coins} Moedas {activeReward.itemBonusDesc ? `• ${activeReward.itemBonusDesc}` : ''}
              </span>
            </div>
          </div>

          {canClaim ? (
            <button
              onClick={() => onClaim(activeReward)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-serif font-black text-xs tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.5)] transition hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>RESGATAR RECOMPENSA</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
              <span>Resgatado Hoje! Retorne amanhã</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
