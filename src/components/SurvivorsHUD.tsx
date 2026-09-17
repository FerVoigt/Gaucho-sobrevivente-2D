import React from 'react';
import { Volume2, VolumeX, Music, Pause, Skull, Coins, Heart, Shield, Zap, CloudSun, Sparkles, Sliders } from 'lucide-react';
import { PlayerStats, WeaponState, PassiveState, WeatherState } from '../types/survivors';
import { WEAPON_DEFS, PASSIVE_DEFS } from '../game2d/constants';
import { MusicThemeId, MUSIC_THEMES } from '../audio/survivorsAudio';

interface SurvivorsHUDProps {
  timeAlive: number;
  currentLevel: number;
  currentXp: number;
  nextLevelXp: number;
  killsCount: number;
  coinsEarned: number;
  stats: PlayerStats;
  characterName: string;
  stageName?: string;
  weather?: WeatherState | null;
  startingPerk?: string;
  weapons: WeaponState[];
  passives: PassiveState[];
  isMuted: boolean;
  isMusicEnabled: boolean;
  musicTheme?: MusicThemeId;
  specialCooldown?: number;
  specialMaxCooldown?: number;
  onTriggerSpecial?: () => void;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onCycleMusicTheme?: () => void;
  onPause: () => void;
}

export const SurvivorsHUD: React.FC<SurvivorsHUDProps> = ({
  timeAlive,
  currentLevel,
  currentXp,
  nextLevelXp,
  killsCount,
  coinsEarned,
  stats,
  characterName,
  stageName,
  weather,
  startingPerk,
  weapons,
  passives,
  isMuted,
  isMusicEnabled,
  musicTheme = 'vanera',
  specialCooldown = 0,
  specialMaxCooldown = 20,
  onTriggerSpecial,
  onToggleMute,
  onToggleMusic,
  onCycleMusicTheme,
  onPause,
}) => {
  const currentThemeObj = MUSIC_THEMES.find((t) => t.id === musicTheme) || MUSIC_THEMES[0];
  const minutes = Math.floor(timeAlive / 60).toString().padStart(2, '0');
  const seconds = Math.floor(timeAlive % 60).toString().padStart(2, '0');
  const xpPercent = Math.max(0, Math.min(100, (currentXp / nextLevelXp) * 100));
  const hpPercent = Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100));

  return (
    <div className="pointer-events-none absolute inset-0 select-none overflow-hidden flex flex-col justify-between p-3 font-sans">
      {/* ================= TOP HEADER ================= */}
      <div className="flex flex-col gap-1 w-full">
        {/* XP Progress Bar (Classic Vampire Survivors top bar) */}
        <div className="relative w-full bg-slate-950/90 h-5 rounded-full border border-blue-600/70 overflow-hidden shadow-lg">
          <div
            className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400 transition-all duration-150 shadow-[0_0_12px_rgba(56,189,248,0.7)]"
            style={{ width: `${xpPercent}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-between px-3 text-[11px] font-bold text-white drop-shadow">
            <span className="flex items-center gap-1">
              <span className="text-cyan-300 font-serif">NV. {currentLevel}</span>
              <span className="text-slate-400 text-[10px]">({Math.floor(currentXp)} / {nextLevelXp} XP)</span>
            </span>
            <span className="text-[10px] text-cyan-200 font-mono tracking-wider">{Math.floor(xpPercent)}%</span>
          </div>
        </div>

        {/* Top Info Bar: HP, Timer, Kills, Gold, Controls */}
        <div className="flex items-center justify-between mt-1">
          {/* Top Left: HP Bar & Hero info */}
          <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 shadow-xl pointer-events-auto">
            <div className="flex flex-col">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-200">
                <span className="flex items-center gap-1 text-red-400">
                  <Heart className="w-3.5 h-3.5 fill-red-500 text-red-400" />
                  <span>{Math.ceil(stats.hp)} / {stats.maxHp}</span>
                </span>
                {stats.hpRegen > 0 && (
                  <span className="text-[9px] text-emerald-400 font-mono">+{stats.hpRegen.toFixed(1)}/s</span>
                )}
              </div>
              <div className="w-28 bg-slate-900 h-2.5 rounded-full overflow-hidden border border-red-950/80 mt-0.5">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-150"
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>

            {stats.armor > 0 && (
              <div className="flex items-center gap-0.5 text-[10px] font-bold text-slate-300 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700">
                <Shield className="w-3 h-3 text-cyan-400" />
                <span>{stats.armor}</span>
              </div>
            )}
            {stats.revives > 0 && (
              <div className="flex items-center gap-0.5 text-[10px] font-bold text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/50" title="Ressurreições restantes">
                <span>🕊️ x{stats.revives}</span>
              </div>
            )}
          </div>

          {/* Center: Survival Timer (MM:SS) & Dynamic Weather */}
          <div className="flex flex-col items-center gap-1">
            <div className="bg-slate-950/90 backdrop-blur-md px-4 py-1.5 rounded-2xl border-2 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center justify-center">
              <span className="font-serif font-black text-xl tracking-widest text-amber-300 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]">
                {minutes}:{seconds}
              </span>
            </div>

            {weather && (
              <div className="flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-amber-500/40 text-[10px] text-amber-200 shadow-lg pointer-events-auto">
                <span>{weather.icon}</span>
                <span className="font-bold text-amber-300">{weather.name}</span>
                <span className="font-mono text-slate-400">({Math.ceil(weather.duration)}s)</span>
                {weather.bonusText && (
                  <span className="text-[9px] text-emerald-400 font-sans hidden sm:inline">
                    • {weather.bonusText}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Top Right: Kills, Gold, Pause & Audio Controls */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 shadow-xl text-xs font-mono font-bold">
              <span className="flex items-center gap-1 text-slate-200">
                <Skull className="w-3.5 h-3.5 text-rose-400" />
                <span>{killsCount}</span>
              </span>
              <span className="flex items-center gap-1 text-amber-300">
                <Coins className="w-3.5 h-3.5 text-yellow-400" />
                <span>{coinsEarned}</span>
              </span>
            </div>

            <div className="flex items-center gap-1 bg-slate-950/85 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-xl">
              {/* Rhythm cycle button */}
              {onCycleMusicTheme && (
                <button
                  onClick={onCycleMusicTheme}
                  title={`Ritmo Gaúcho Atual: ${currentThemeObj.name} (Clique para trocar)`}
                  className="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 text-[10px] font-bold transition cursor-pointer"
                >
                  <span>{currentThemeObj.icon}</span>
                  <span className="hidden sm:inline">{currentThemeObj.name.split(' ')[0]}</span>
                </button>
              )}

              <button
                onClick={onToggleMusic}
                title="Música BGM [M]"
                disabled={isMuted}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  isMuted
                    ? 'opacity-40 cursor-not-allowed text-slate-600'
                    : isMusicEnabled
                    ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Music className="w-4 h-4" />
              </button>

              <button
                onClick={onToggleMute}
                title={isMuted ? "Desativar Mudo Geral [S]" : "Desativar Todos os Sons (Mudo Geral) [S]"}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  !isMuted ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40' : 'bg-rose-950/70 text-rose-300 border border-rose-500/50'
                }`}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                onClick={onPause}
                title="Pausar Jogo [ESC]"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
              >
                <Pause className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Equipment Tray: Active Weapons (6 slots) & Active Passives (6 slots) */}
        <div className="flex justify-between items-center px-1 mt-1">
          {/* Active Weapons (Up to 6) */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 6 }).map((_, idx) => {
              const weapon = weapons[idx];
              const def = weapon ? WEAPON_DEFS[weapon.id] : null;

              return (
                <div
                  key={`w-${idx}`}
                  className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center relative border transition shadow ${
                    def
                      ? def.isEvolution
                        ? 'bg-gradient-to-br from-amber-950 via-red-950 to-slate-900 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                        : 'bg-slate-900/90 border-slate-700'
                      : 'bg-slate-950/50 border-slate-800/60'
                  }`}
                  title={def ? `${def.name} (Nv. ${weapon.level})` : 'Espaço de Arma Vazio'}
                >
                  {def ? (
                    <>
                      <span className="text-base">{def.icon}</span>
                      <div className="absolute -bottom-1 flex gap-0.5">
                        {Array.from({ length: Math.min(8, weapon.level) }).map((_, s) => (
                          <div
                            key={s}
                            className={`w-1 h-1 rounded-full ${def.isEvolution ? 'bg-amber-400 shadow' : 'bg-cyan-400'}`}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <span className="text-[10px] text-slate-700 font-mono">{idx + 1}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Active Passives (Up to 6) */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 6 }).map((_, idx) => {
              const passive = passives[idx];
              const def = passive ? PASSIVE_DEFS[passive.id] : null;

              return (
                <div
                  key={`p-${idx}`}
                  className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center relative border transition shadow ${
                    def ? 'bg-slate-900/90 border-emerald-500/60' : 'bg-slate-950/50 border-slate-800/60'
                  }`}
                  title={def ? `${def.name} (Nv. ${passive.level})` : 'Espaço de Passiva Vazio'}
                >
                  {def ? (
                    <>
                      <span className="text-base">{def.icon}</span>
                      <div className="absolute -bottom-1 flex gap-0.5">
                        {Array.from({ length: passive.level }).map((_, s) => (
                          <div key={s} className="w-1 h-1 rounded-full bg-emerald-400" />
                        ))}
                      </div>
                    </>
                  ) : (
                    <span className="text-[10px] text-slate-700 font-mono">P{idx + 1}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= BOTTOM CONTROLS & STATUS HINT ================= */}
      <div className="flex items-end justify-between w-full gap-2">
        {/* Movement Controls hint & Active Debuffs indicator */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span>Controles: <strong className="text-slate-200">WASD / Setas</strong></span>
            <span className="text-slate-600">|</span>
            <span className="text-amber-300/90">Ataque Automático</span>
          </div>

          <div className="flex items-center gap-1.5 border-t sm:border-t-0 sm:border-l border-slate-800 sm:pl-2 pt-1 sm:pt-0 text-[10px] text-slate-300 font-mono">
            <span className="text-slate-400">Debuffs:</span>
            <span className="text-orange-400">🔥 Queima</span>
            <span className="text-cyan-300">❄️ Gelo</span>
            <span className="text-blue-300">🌀 Lentidão</span>
          </div>
        </div>

        {/* Special Ability Button: Invocar Matilha de Cuscos Caramelos */}
        {onTriggerSpecial && (
          <div className="pointer-events-auto flex items-center justify-center">
            <button
              onClick={onTriggerSpecial}
              disabled={specialCooldown > 0}
              className={`relative group flex items-center gap-2 px-3.5 py-2 rounded-2xl border transition-all duration-200 shadow-xl cursor-pointer ${
                specialCooldown <= 0
                  ? 'bg-gradient-to-r from-amber-500/90 via-yellow-500/90 to-amber-600/90 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold border-amber-300 ring-2 ring-amber-400/50 shadow-amber-500/30 hover:scale-105 active:scale-95 animate-pulse'
                  : 'bg-slate-950/85 backdrop-blur-md border-slate-800 text-slate-400 cursor-not-allowed opacity-85'
              }`}
              title="Invocar Matilha de Cuscos Caramelos (Tecla Espaço)"
            >
              <span className="text-lg">🐺</span>
              <div className="flex flex-col items-start leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-serif ${specialCooldown <= 0 ? 'text-slate-950 font-black' : 'text-slate-200 font-bold'}`}>
                    Matilha Caramelo
                  </span>
                  <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${specialCooldown <= 0 ? 'bg-slate-950/30 text-slate-900 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                    Espaço
                  </span>
                </div>
                <span className={`text-[10px] font-mono ${specialCooldown <= 0 ? 'text-amber-950 font-extrabold' : 'text-amber-400'}`}>
                  {specialCooldown <= 0 ? 'PRONTO PARA ATACAR!' : `Recarga: ${specialCooldown.toFixed(1)}s`}
                </span>
              </div>
            </button>
          </div>
        )}

        {/* Stage & Character badge */}
        <div className="flex items-center gap-2">
          {startingPerk && (
            <div className="hidden md:flex items-center gap-1 bg-amber-950/80 border border-amber-500/50 px-2.5 py-1 rounded-xl text-[10px] font-bold text-amber-300">
              <Sparkles className="w-3 h-3 text-yellow-400" />
              <span>Bônus Diário Ativo</span>
            </div>
          )}

          {stageName && (
            <div className="hidden sm:flex items-center gap-1 bg-slate-950/80 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-400">
              <span className="text-emerald-400 font-bold">{stageName}</span>
            </div>
          )}

          <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1.5">
            <span>Herói:</span>
            <strong className="text-amber-300 font-serif">{characterName}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
