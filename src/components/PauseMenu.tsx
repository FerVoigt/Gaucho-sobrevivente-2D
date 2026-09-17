import React from 'react';
import { Play, Home, Volume2, VolumeX, Music, Swords, Activity, Shield, Zap, Heart, Sliders } from 'lucide-react';
import { PlayerStats, WeaponState } from '../types/survivors';
import { WEAPON_DEFS } from '../game2d/constants';
import { MusicThemeId, MUSIC_THEMES, survivorsAudio } from '../audio/survivorsAudio';

interface PauseMenuProps {
  weapons: WeaponState[];
  stats: PlayerStats;
  timeAlive: number;
  isMuted: boolean;
  isMusicEnabled: boolean;
  musicTheme?: MusicThemeId;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onChangeMusicTheme?: (theme: MusicThemeId) => void;
  onResume: () => void;
  onQuit: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  weapons,
  stats,
  timeAlive,
  isMuted,
  isMusicEnabled,
  musicTheme = 'vanera',
  onToggleMute,
  onToggleMusic,
  onChangeMusicTheme,
  onResume,
  onQuit,
}) => {
  const totalDamageAllWeapons = weapons.reduce((acc, w) => acc + w.totalDamageDealt, 0) || 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-950/95 border-2 border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-slate-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <span className="text-xl">🐎</span>
            </div>
            <div>
              <h2 className="font-serif font-black text-2xl text-amber-300 tracking-wide">SOBREVIVENTE GAÚCHO</h2>
              <p className="text-xs text-slate-400">Jogo Pausado • Estatísticas & Configurações de Áudio</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleMusic}
              disabled={isMuted}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isMuted
                  ? 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-600'
                  : isMusicEnabled
                  ? 'bg-amber-950/60 text-amber-300 border-amber-500/50'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
              title="Música BGM [M]"
            >
              <Music className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleMute}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                !isMuted ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/50' : 'bg-rose-950/80 text-rose-300 border-rose-500/50'
              }`}
              title={isMuted ? "Desativar Mudo Geral [S]" : "Desativar Todos os Sons (Mudo Geral) [S]"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Audio & Gaucho Rhythm Controls */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-3.5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <Sliders className="w-3.5 h-3.5" />
              <span>Configurações de Som & Ritmo Musical</span>
            </div>
            <button
              onClick={onToggleMute}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                isMuted
                  ? 'bg-rose-900/60 text-rose-200 border-rose-500'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
              }`}
            >
              {isMuted ? 'MUDO GERAL ATIVO' : 'DESATIVAR TODOS OS SONS'}
            </button>
          </div>

          {/* Rhythms Picker */}
          {onChangeMusicTheme && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Ritmo da Música Ambiente:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MUSIC_THEMES.map((t) => {
                  const isCur = musicTheme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => onChangeMusicTheme(t.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition text-left cursor-pointer ${
                        isCur
                          ? 'bg-amber-950/80 text-amber-300 border-amber-400 ring-1 ring-amber-400'
                          : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-sm">{t.icon}</span>
                      <span className="truncate">{t.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Weapons DPS Breakdown Table */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>Desempenho de Armas & DPS</span>
          </h3>

          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden text-xs">
            <div className="grid grid-cols-12 px-3.5 py-2.5 bg-slate-950/80 border-b border-slate-800 font-bold text-slate-400">
              <span className="col-span-5">Arma</span>
              <span className="col-span-3 text-right">Dano Total</span>
              <span className="col-span-2 text-right">DPS</span>
              <span className="col-span-2 text-right">% Dano</span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {weapons.map((w) => {
                const def = WEAPON_DEFS[w.id];
                const dps = timeAlive > 0 ? Math.round(w.totalDamageDealt / timeAlive) : 0;
                const percent = Math.round((w.totalDamageDealt / totalDamageAllWeapons) * 100);

                return (
                  <div key={w.id} className="grid grid-cols-12 px-3.5 py-2.5 items-center hover:bg-slate-800/40">
                    <div className="col-span-5 flex items-center gap-2">
                      <span className="text-base">{def?.icon || '🗡️'}</span>
                      <div className="flex flex-col">
                        <span className="font-serif font-bold text-slate-200">{def?.name || w.id}</span>
                        <span className="text-[10px] text-slate-400">Nv. {w.level}</span>
                      </div>
                    </div>
                    <span className="col-span-3 text-right font-mono font-bold text-amber-300">
                      {w.totalDamageDealt.toLocaleString()}
                    </span>
                    <span className="col-span-2 text-right font-mono text-cyan-300">{dps}</span>
                    <span className="col-span-2 text-right font-mono text-slate-300">{percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Current Player Stats Grid */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Atributos Atuais</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Poder (Might)</span>
              <strong className="text-amber-300 font-mono">+{Math.round((stats.might - 1) * 100)}%</strong>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Armadura</span>
              <strong className="text-cyan-300 font-mono">+{stats.armor}</strong>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Velocidade</span>
              <strong className="text-slate-200 font-mono">{Math.round(stats.moveSpeed)} px/s</strong>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Área</span>
              <strong className="text-slate-200 font-mono">+{Math.round((stats.area - 1) * 100)}%</strong>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Recarga (CDR)</span>
              <strong className="text-emerald-300 font-mono">-{Math.round(stats.cooldownReduction * 100)}%</strong>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Projéteis</span>
              <strong className="text-amber-300 font-mono">+{stats.amount}</strong>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Ímã (Magnet)</span>
              <strong className="text-slate-200 font-mono">{Math.round(stats.magnet)} px</strong>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Regeneração</span>
              <strong className="text-emerald-300 font-mono">+{stats.hpRegen.toFixed(1)}/s</strong>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={onQuit}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Sair da Corrida</span>
          </button>

          <button
            onClick={onResume}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-serif font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Retomar Jogo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
