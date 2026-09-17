import React from 'react';
import { Map, Lock, Check, Sparkles, X, Coins, Compass, CloudRain, Flame, Snowflake, Moon } from 'lucide-react';
import { STAGES_CONFIG, WEATHER_DEFS } from '../game2d/constants';
import { StageConfig, StageId } from '../types/survivors';

interface StageSelectModalProps {
  stages: Record<StageId, StageConfig>;
  selectedStageId: StageId;
  totalCoins: number;
  onSelectStage: (id: StageId) => void;
  onUnlockStage: (id: StageId, cost: number) => void;
  onClose: () => void;
}

export const StageSelectModal: React.FC<StageSelectModalProps> = ({
  stages,
  selectedStageId,
  totalCoins,
  onSelectStage,
  onUnlockStage,
  onClose,
}) => {
  const selectedStage = stages[selectedStageId] || stages.mad_forest;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 border-emerald-500/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(16,185,129,0.25)] flex flex-col gap-5 text-slate-100 font-sans">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-2xl text-emerald-400 shadow-inner">
              <Map className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 tracking-wider">
                  SELEÇÃO DE FASE & ARENA
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Cada mapa possui paleta, geração procedural, clima variável e hordas de monstros únicas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 px-3.5 py-1.5 rounded-2xl border border-amber-500/40 text-amber-300 font-mono font-bold text-xs mr-10">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span>{totalCoins.toLocaleString()}</span>
          </div>
        </div>

        {/* Stages Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {(Object.values(stages) as StageConfig[]).map((stage) => {
            const isSelected = stage.id === selectedStageId;
            const canUnlock = totalCoins >= stage.cost;

            return (
              <div
                key={stage.id}
                className={`relative p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-slate-900/90 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.35)] scale-[1.01]'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Stage Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border border-slate-700 shadow-inner"
                      style={{ backgroundColor: `${stage.bgPalette.accent}20` }}
                    >
                      {stage.icon}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <strong className="font-serif font-bold text-base text-slate-100">
                          {stage.name}
                        </strong>
                        {!stage.unlocked && <Lock className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <span className="text-[11px] text-slate-400 italic">{stage.subtitle}</span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    stage.difficultyMultiplier >= 1.5 ? 'bg-red-950 text-red-400 border border-red-800' :
                    stage.difficultyMultiplier >= 1.25 ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                    'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  }`}>
                    {stage.difficultyMultiplier.toFixed(2)}x Dif.
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                  {stage.description}
                </p>

                {/* Weather Tags */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Climas:</span>
                  {stage.allowedWeather.map((w) => {
                    const wDef = WEATHER_DEFS[w];
                    return (
                      <span
                        key={w}
                        className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg text-slate-300 flex items-center gap-1 font-mono"
                      >
                        <span>{wDef?.icon}</span>
                        <span>{wDef?.name}</span>
                      </span>
                    );
                  })}
                </div>

                {/* Selection Action Button */}
                <div className="mt-1">
                  {stage.unlocked ? (
                    <button
                      onClick={() => {
                        onSelectStage(stage.id);
                        onClose();
                      }}
                      className={`w-full py-2.5 rounded-xl font-serif font-bold text-xs tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>FASE SELECIONADA</span>
                        </>
                      ) : (
                        <span>SELECIONAR ESTA FASE</span>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => onUnlockStage(stage.id, stage.cost)}
                      disabled={!canUnlock}
                      className={`w-full py-2.5 rounded-xl font-serif font-bold text-xs tracking-wider transition flex items-center justify-center gap-1.5 ${
                        canUnlock
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 hover:scale-105 cursor-pointer shadow-md'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>DESBLOQUEAR POR {stage.cost} OURO</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
