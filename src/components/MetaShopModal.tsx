import React from 'react';
import { Coins, RotateCcw, X, ShoppingBag, Sparkles, Check } from 'lucide-react';
import { MetaUpgrade } from '../types/survivors';

interface MetaShopModalProps {
  upgrades: MetaUpgrade[];
  totalCoins: number;
  onBuyUpgrade: (id: string, cost: number) => void;
  onRefundAll: () => void;
  onClose: () => void;
}

export const MetaShopModal: React.FC<MetaShopModalProps> = ({
  upgrades,
  totalCoins,
  onBuyUpgrade,
  onRefundAll,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-950/95 border-2 border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-slate-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-black text-2xl text-amber-300 tracking-wide">LOJA DE PODER</h2>
              <p className="text-xs text-slate-400">Aprimoramentos permanentes para todos os sobreviventes</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-amber-500/50 text-amber-300 font-mono font-bold text-sm">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span>{totalCoins.toLocaleString()}</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Upgrade Cards List */}
        <div className="flex flex-col gap-2.5">
          {upgrades.map((item) => {
            const isMax = item.currentRank >= item.maxRank;
            const cost = item.costPerRank * (item.currentRank + 1);
            const canAfford = totalCoins >= cost;

            return (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-4 hover:border-slate-700 transition"
              >
                {/* Left: Icon & Description */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center text-2xl shrink-0">
                    {item.icon}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <strong className="font-serif font-bold text-slate-100">{item.name}</strong>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({item.currentRank}/{item.maxRank})
                      </span>
                    </div>
                    <span className="text-xs text-slate-300 mt-0.5">{item.description}</span>
                  </div>
                </div>

                {/* Right: Level Pips & Buy Button */}
                <div className="flex items-center gap-4 shrink-0">
                  {/* Pips */}
                  <div className="flex gap-1">
                    {Array.from({ length: item.maxRank }).map((_, r) => (
                      <div
                        key={r}
                        className={`w-2.5 h-3 rounded-sm ${
                          r < item.currentRank ? 'bg-amber-400 shadow-[0_0_5px_rgba(245,158,11,0.6)]' : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Buy Button */}
                  {isMax ? (
                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-2 rounded-xl border border-emerald-500/40">
                      <Check className="w-4 h-4" />
                      <span>MÁX</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => onBuyUpgrade(item.id, cost)}
                      disabled={!canAfford}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition shadow ${
                        canAfford
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 hover:scale-105 cursor-pointer shadow-amber-500/20'
                          : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      }`}
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>{cost}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer: Refund All & Close */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <button
            onClick={onRefundAll}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-rose-400 hover:text-rose-300 text-xs font-bold transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Redefinir & Reembolsar Tudo</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            Fechar Loja
          </button>
        </div>
      </div>
    </div>
  );
};
