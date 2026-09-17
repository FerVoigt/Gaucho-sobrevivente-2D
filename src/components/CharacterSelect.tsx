import React, { useState } from 'react';
import {
  Play,
  ShoppingBag,
  Coins,
  Shield,
  Zap,
  Sparkles,
  Lock,
  Map,
  BookOpen,
  Calendar,
  Flame,
  Gift,
  Volume2,
  VolumeX,
  Music,
  Sliders,
  Download,
} from 'lucide-react';
import { CharacterConfig } from '../types/survivors';
import { WEAPON_DEFS } from '../game2d/constants';
import { MUSIC_THEMES, MusicThemeId, survivorsAudio } from '../audio/survivorsAudio';
import { ExportGameModal } from './ExportGameModal';

interface CharacterSelectProps {
  characters: CharacterConfig[];
  selectedId: string;
  totalCoins: number;
  selectedStageName: string;
  selectedStageIcon: string;
  totalBestiaryKills: number;
  dailyStreak: number;
  canClaimDailyReward: boolean;
  activeStartingPerk?: string;
  isMuted: boolean;
  isMusicEnabled: boolean;
  musicTheme: MusicThemeId;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onChangeMusicTheme: (theme: MusicThemeId) => void;
  onSelectCharacter: (id: string) => void;
  onUnlockCharacter: (id: string, cost: number) => void;
  onOpenShop: () => void;
  onOpenStages: () => void;
  onOpenBestiary: () => void;
  onOpenDailyRewards: () => void;
  onStartGame: () => void;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  characters,
  selectedId,
  totalCoins,
  selectedStageName,
  selectedStageIcon,
  totalBestiaryKills,
  dailyStreak,
  canClaimDailyReward,
  activeStartingPerk,
  isMuted,
  isMusicEnabled,
  musicTheme,
  onToggleMute,
  onToggleMusic,
  onChangeMusicTheme,
  onSelectCharacter,
  onUnlockCharacter,
  onOpenShop,
  onOpenStages,
  onOpenBestiary,
  onOpenDailyRewards,
  onStartGame,
}) => {
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const selectedChar = characters.find((c) => c.id === selectedId) || characters[0];
  const startingWeaponDef = WEAPON_DEFS[selectedChar.startingWeapon];
  const currentThemeObj = MUSIC_THEMES.find((t) => t.id === musicTheme) || MUSIC_THEMES[0];

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-between bg-gradient-to-b from-slate-950 via-slate-900 to-black p-4 md:p-6 overflow-y-auto">
      {/* Top Bar: Title, Gold Balance, Audio & Quick Navigation */}
      <div className="w-full max-w-6xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐎</span>
            <h1 className="font-serif font-black text-2xl md:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-yellow-400 to-red-500 drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)] tracking-wider">
              SOBREVIVENTE GAÚCHO
            </h1>
          </div>
          <p className="text-xs text-amber-200/70 font-serif">O Fandango da Sobrevivência nos Pampas • Enfrente as lendas da noite</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Audio Master Bar */}
          <div className="flex items-center gap-1 bg-slate-900/90 px-2.5 py-1 rounded-2xl border border-slate-700/60 shadow-lg">
            {/* Master Mute (Desativar todos os sons) */}
            <button
              onClick={onToggleMute}
              title={isMuted ? 'Desmutar Todos os Sons' : 'Desativar Todos os Sons (Mudo Geral)'}
              className={`flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                isMuted
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-500/50'
                  : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/50'
              }`}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span className="text-[11px] hidden sm:inline">{isMuted ? 'Sons Desativados' : 'Sons Ativos'}</span>
            </button>

            {/* Music Toggle */}
            <button
              onClick={onToggleMusic}
              title="Alternar Música de Fundo"
              disabled={isMuted}
              className={`p-1.5 rounded-xl border transition cursor-pointer ${
                isMuted
                  ? 'opacity-40 cursor-not-allowed border-slate-800 text-slate-500'
                  : isMusicEnabled
                  ? 'bg-amber-950/70 text-amber-300 border-amber-500/50'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
            </button>

            {/* Rhythm Selector Modal Toggle */}
            <button
              onClick={() => setShowAudioSettings(!showAudioSettings)}
              title="Configurações de Áudio e Ritmos Gaúchos"
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold transition cursor-pointer"
            >
              <span>{currentThemeObj.icon}</span>
              <span className="text-[11px] hidden md:inline">{currentThemeObj.name}</span>
              <Sliders className="w-3 h-3 text-slate-400" />
            </button>
          </div>

          {/* Gold Counter */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 px-3.5 py-1.5 rounded-2xl border border-amber-500/40 text-amber-300 font-mono font-bold text-xs shadow-lg">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span>{totalCoins.toLocaleString()}</span>
          </div>

          {/* Daily Reward Button with streak indicator */}
          <button
            onClick={onOpenDailyRewards}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs font-bold transition hover:scale-105 cursor-pointer shadow-md ${
              canClaimDailyReward
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse'
                : 'bg-slate-900/90 text-amber-300 border-amber-500/40 hover:bg-slate-800'
            }`}
            title="Recompensas Diárias por Sequência de Login"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-300" />
            <span>DIÁRIO</span>
            <span className="flex items-center gap-0.5 text-[10px] bg-black/40 px-1.5 py-0.5 rounded-full font-mono">
              <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
              {dailyStreak}d
            </span>
            {canClaimDailyReward && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-ping" />
            )}
          </button>

          {/* Map & Stage Selector Button */}
          <button
            onClick={onOpenStages}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition hover:scale-105 cursor-pointer shadow-md"
            title="Selecionar Mapa / Fase"
          >
            <Map className="w-3.5 h-3.5 text-emerald-400" />
            <span>MAPAS</span>
            <span className="text-[11px] font-mono text-emerald-200 bg-emerald-950/70 px-1.5 py-0.5 rounded-md border border-emerald-800/50">
              {selectedStageIcon} {selectedStageName}
            </span>
          </button>

          {/* Bestiary Catalog Button */}
          <button
            onClick={onOpenBestiary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-rose-300 border border-rose-500/40 text-xs font-bold transition hover:scale-105 cursor-pointer shadow-md"
            title="Catálogo de Inimigos e Bônus"
          >
            <BookOpen className="w-3.5 h-3.5 text-rose-400" />
            <span>BESTIÁRIO</span>
            <span className="text-[10px] font-mono text-rose-200 bg-rose-950/70 px-1.5 py-0.5 rounded-md border border-rose-800/50">
              {totalBestiaryKills.toLocaleString()} 💀
            </span>
          </button>

          {/* Shop Button */}
          <button
            onClick={onOpenShop}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-700 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-serif font-bold text-xs tracking-wider shadow-lg shadow-amber-500/20 transition hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>LOJA</span>
          </button>

          {/* Export Game (.ZIP / .EXE) Button */}
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-500/50 text-xs font-bold transition hover:scale-105 active:scale-95 cursor-pointer shadow-md"
            title="Exportar jogo em .ZIP ou criar Executável (.EXE)"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>EXPORTAR (.ZIP / .EXE)</span>
          </button>
        </div>
      </div>

      {/* Popover / Panel for Audio & Gaucho Rhythms Settings */}
      {showAudioSettings && (
        <div className="w-full max-w-4xl bg-slate-950/95 border-2 border-amber-500/40 rounded-3xl p-5 shadow-2xl my-3 animate-in fade-in duration-200 z-50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🪗</span>
              <div>
                <h3 className="font-serif font-bold text-base text-amber-300">Configurações de Áudio & Ritmos dos Pampas</h3>
                <p className="text-xs text-slate-400">Escolha a cadência gauchesca da música e experimente os efeitos sonoros</p>
              </div>
            </div>
            <button
              onClick={() => setShowAudioSettings(false)}
              className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer"
            >
              Fechar
            </button>
          </div>

          {/* Master sound controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                  <span>Desativar Todos os Sons</span>
                </div>
                <p className="text-[11px] text-slate-400">Silencia imediatamente efeitos sonoros e músicas de fundo</p>
              </div>
              <button
                onClick={onToggleMute}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  isMuted
                    ? 'bg-rose-900/60 text-rose-200 border-rose-500'
                    : 'bg-emerald-900/40 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900/60'
                }`}
              >
                {isMuted ? 'MUDO ATIVO' : 'SONS ATIVOS'}
              </button>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
                  <Music className="w-4 h-4 text-amber-400" />
                  <span>Música de Fundo (BGM)</span>
                </div>
                <p className="text-[11px] text-slate-400">Trilha procedural no ritmo tradicional gaúcho</p>
              </div>
              <button
                onClick={onToggleMusic}
                disabled={isMuted}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  isMuted
                    ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500 border-slate-700'
                    : isMusicEnabled
                    ? 'bg-amber-900/50 text-amber-200 border-amber-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {isMusicEnabled && !isMuted ? 'LIGADA' : 'DESLIGADA'}
              </button>
            </div>
          </div>

          {/* Rhythms selector */}
          <div className="mb-4">
            <h4 className="text-xs uppercase font-bold text-amber-400 mb-2 flex items-center gap-1">
              <span>🪗</span> Selecione o Ritmo Gaúcho para a Trilha Sonora:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              {MUSIC_THEMES.map((theme) => {
                const isSelected = musicTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => onChangeMusicTheme(theme.id)}
                    className={`flex flex-col p-3 rounded-2xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-950/70 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)] ring-1 ring-amber-400'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                      <span className="text-base">{theme.icon}</span>
                      <span className={isSelected ? 'text-amber-300' : 'text-slate-200'}>{theme.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{theme.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sound Effect Test Buttons */}
          <div>
            <h4 className="text-xs uppercase font-bold text-slate-400 mb-2 flex items-center gap-1">
              <span>🔊</span> Testar Efeitos Sonoros Gauchescos das Armas e Eventos:
            </h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => survivorsAudio.playFacao()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 transition cursor-pointer"
              >
                <span>🗡️</span> Facão de Aço
              </button>
              <button
                onClick={() => survivorsAudio.playLaco()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 transition cursor-pointer"
              >
                <span>🪢</span> Laço / Boleadeira
              </button>
              <button
                onClick={() => survivorsAudio.playHorseNeigh()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-amber-300 transition cursor-pointer"
              >
                <span>🐎</span> Relincho de Cavalo
              </button>
              <button
                onClick={() => survivorsAudio.playGaitaChord()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-cyan-300 transition cursor-pointer"
              >
                <span>🪗</span> Gaita Gaúcha
              </button>
              <button
                onClick={() => survivorsAudio.playBerimbau()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-orange-300 transition cursor-pointer"
              >
                <span>🎵</span> Berimbau de Boca
              </button>
              <button
                onClick={() => survivorsAudio.playChimarrao()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-emerald-300 transition cursor-pointer"
              >
                <span>🧉</span> Chimarrão
              </button>
              <button
                onClick={() => survivorsAudio.playRelho()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-yellow-300 transition cursor-pointer"
              >
                <span>⚡</span> Relho Farroupilha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Center: Character Selection Grid & Preview */}
      <div className="w-full max-w-5xl my-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-center py-4">
        {/* Left: Character List */}
        <div className="lg:col-span-7 flex flex-col gap-2.5">
          <span className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Escolha o Sobrevivente</span>
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {characters.map((char) => {
              const isSelected = char.id === selectedId;
              const wDef = WEAPON_DEFS[char.startingWeapon];

              return (
                <button
                  key={char.id}
                  onClick={() => onSelectCharacter(char.id)}
                  className={`p-3 rounded-2xl border-2 transition-all duration-200 text-left flex items-center justify-between gap-3 cursor-pointer shadow-lg ${
                    isSelected
                      ? 'bg-slate-900 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.35)] scale-[1.02]'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 border border-slate-700 shadow-inner"
                      style={{ backgroundColor: `${char.avatarColor}20` }}
                    >
                      {wDef?.icon || '🗡️'}
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-serif font-bold text-sm text-slate-100">{char.name}</span>
                        {!char.unlocked && <Lock className="w-3 h-3 text-amber-400" />}
                      </div>
                      <span className="text-[11px] text-slate-400">{char.title}</span>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-amber-300">
                    {char.unlocked ? (isSelected ? '✓' : '') : `${char.cost} 🪙`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Hero Detail Card */}
        <div className="lg:col-span-5 bg-slate-900/90 border-2 border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-slate-200">
          <div className="flex items-center gap-3.5 border-b border-slate-800 pb-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 border-2 shadow-lg"
              style={{
                backgroundColor: `${selectedChar.avatarColor}30`,
                borderColor: selectedChar.accentColor,
              }}
            >
              {startingWeaponDef?.icon || '🗡️'}
            </div>

            <div className="flex flex-col">
              <h2 className="font-serif font-black text-xl text-amber-300">{selectedChar.name}</h2>
              <span className="text-xs text-slate-400">{selectedChar.title}</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{selectedChar.description}</p>

          {/* Starting Weapon info */}
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-xl shrink-0 border border-slate-700">
              {startingWeaponDef?.icon}
            </div>
            <div className="flex flex-col text-xs">
              <span className="text-[10px] text-amber-400 font-bold uppercase">Arma Inicial</span>
              <strong className="text-slate-100 font-serif">{startingWeaponDef?.name}</strong>
              <span className="text-[11px] text-slate-400 line-clamp-1">{startingWeaponDef?.description}</span>
            </div>
          </div>

          {/* Stat Perks */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {selectedChar.bonusStats.might && (
              <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/60 flex items-center justify-between">
                <span className="text-slate-400">Poder:</span>
                <strong className="text-amber-300 font-mono">+{Math.round((selectedChar.bonusStats.might - 1) * 100)}%</strong>
              </div>
            )}
            {selectedChar.bonusStats.area && (
              <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/60 flex items-center justify-between">
                <span className="text-slate-400">Área:</span>
                <strong className="text-cyan-300 font-mono">+{Math.round((selectedChar.bonusStats.area - 1) * 100)}%</strong>
              </div>
            )}
            {selectedChar.bonusStats.amount && (
              <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/60 flex items-center justify-between">
                <span className="text-slate-400">Projéteis:</span>
                <strong className="text-amber-300 font-mono">+{selectedChar.bonusStats.amount}</strong>
              </div>
            )}
            {selectedChar.bonusStats.cooldownReduction && (
              <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/60 flex items-center justify-between">
                <span className="text-slate-400">Recarga:</span>
                <strong className="text-emerald-300 font-mono">-{Math.round(selectedChar.bonusStats.cooldownReduction * 100)}%</strong>
              </div>
            )}
            {selectedChar.bonusStats.moveSpeed && (
              <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/60 flex items-center justify-between">
                <span className="text-slate-400">Velocidade:</span>
                <strong className="text-slate-200 font-mono">{selectedChar.bonusStats.moveSpeed} px/s</strong>
              </div>
            )}
          </div>

          {/* Stage & Perk Indicator */}
          <div className="flex items-center justify-between text-xs bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-base">{selectedStageIcon}</span>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400">Mapa Escolhido:</span>
                <span className="font-bold text-emerald-300">{selectedStageName}</span>
              </div>
            </div>
            {activeStartingPerk && (
              <div className="flex items-center gap-1.5 bg-amber-950/70 border border-amber-500/50 px-2 py-1 rounded-lg text-amber-300">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-[11px] font-bold">
                  {activeStartingPerk === 'chicken'
                    ? '🍗 +30 HP Inicial'
                    : activeStartingPerk === 'magnet'
                    ? '🧲 Super Ímã Inicial'
                    : '✝️ Rosário Inicial'}
                </span>
              </div>
            )}
          </div>

          {/* Action button: Start Run or Unlock */}
          {selectedChar.unlocked ? (
            <button
              onClick={onStartGame}
              className="mt-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-amber-500 to-yellow-500 hover:from-red-500 hover:to-yellow-400 text-slate-950 font-serif font-black text-base tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.5)] transition hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>INICIAR SOBREVIVÊNCIA</span>
            </button>
          ) : (
            <button
              onClick={() => onUnlockCharacter(selectedChar.id, selectedChar.cost)}
              disabled={totalCoins < selectedChar.cost}
              className={`mt-2 w-full py-3.5 rounded-2xl font-serif font-bold text-sm tracking-wider flex items-center justify-center gap-2 transition ${
                totalCoins >= selectedChar.cost
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 hover:scale-105 cursor-pointer shadow-lg shadow-amber-500/30'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>DESBLOQUEAR POR {selectedChar.cost} OURO</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Info */}
      <div className="w-full max-w-5xl flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-900">
        <span>Vampire Survivors 2D • Ação Roguelike em Tempo Real</span>
        <span>Controles: WASD / Setas | Auto-Ataque</span>
      </div>

      {/* Export Game Modal */}
      {showExportModal && <ExportGameModal onClose={() => setShowExportModal(false)} />}
    </div>
  );
};
