import React, { useState } from 'react';
import {
  PlayerStats,
  SummonData,
  MonsterData,
  SummonType,
  Quest,
  InventoryItem,
  DuelState,
} from '../types';
import {
  Flame,
  Shield,
  Zap,
  Volume2,
  VolumeX,
  Music,
  HelpCircle,
  Sword,
  Sparkles,
  Compass,
  Scroll,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Package,
  BookOpen,
  Crosshair,
  Swords,
} from 'lucide-react';
import { soundManager } from '../audio/soundManager';
import { Minimap } from './Minimap';

interface GameHUDProps {
  playerStats: PlayerStats;
  activeSummon: SummonData;
  targetMonster: MonsterData | null;
  quests: Quest[];
  inventory: InventoryItem[];
  combatLogs: { text: string; type: string; id: string }[];
  minimapData: {
    playerPos: [number, number, number];
    playerAngle: number;
    summonPos?: [number, number, number];
    monsters: { data: MonsterData; meshPos: [number, number, number] }[];
  };
  duelState?: DuelState;
  onCastTalisman: () => void;
  onSwitchSummon: (type: SummonType) => void;
  onCastBagua: () => void;
  onSummonSpecial: () => void;
  onToggleFly: () => void;
  onToggleMeditate: () => void;
  onBreakthrough: () => void;
  onClearTarget: () => void;
  onOpenHelp: () => void;
  onOpenInventory: () => void;
  onOpenSkills: () => void;
  onQuickPotion: () => void;
  onCastDivineSurge: () => void;
  onTogglePvP?: () => void;
  onStartDuel?: () => void;
  onTeleportArena?: () => void;
  onTeleportMain?: () => void;
  onCastMultiSword?: () => void;
  onCastAirExplosion?: () => void;
  onCastDisablingSword?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  playerStats,
  activeSummon,
  targetMonster,
  quests,
  inventory,
  combatLogs,
  minimapData,
  duelState,
  onCastTalisman,
  onSwitchSummon,
  onCastBagua,
  onSummonSpecial,
  onToggleFly,
  onToggleMeditate,
  onBreakthrough,
  onClearTarget,
  onOpenHelp,
  onOpenInventory,
  onOpenSkills,
  onQuickPotion,
  onCastDivineSurge,
  onTogglePvP,
  onStartDuel,
  onTeleportArena,
  onTeleportMain,
  onCastMultiSword,
  onCastAirExplosion,
  onCastDisablingSword,
}) => {
  const [isMuted, setIsMuted] = useState(soundManager.getIsMuted());
  const [isMusicPlaying, setIsMusicPlaying] = useState(soundManager.getIsMusicPlaying());
  const [showLog, setShowLog] = useState(true);

  const toggleSound = () => {
    const next = !isMuted;
    soundManager.setMuted(next);
    setIsMuted(next);
  };

  const toggleBgm = () => {
    const playing = soundManager.toggleMusic();
    setIsMusicPlaying(playing);
  };

  const hpPercent = Math.max(0, Math.min(100, (playerStats.hp / playerStats.maxHp) * 100));
  const mpPercent = Math.max(0, Math.min(100, (playerStats.mp / playerStats.maxMp) * 100));
  const expPercent = Math.max(0, Math.min(100, (playerStats.exp / playerStats.maxExp) * 100));

  const targetHpPercent = targetMonster
    ? Math.max(0, Math.min(100, (targetMonster.currentHp / targetMonster.maxHp) * 100))
    : 0;

  const summonHpPercent = Math.max(0, Math.min(100, (activeSummon.currentHp / activeSummon.maxHp) * 100));

  // Count available healing potions
  const potionCount = inventory
    .filter((i) => i.type === 'consumable' && i.name.includes('Poção'))
    .reduce((sum, i) => sum + (i.quantity || 1), 0);

  const isSurgeActive = (playerStats.divineSurgeTimer || 0) > 0;
  const surgeLevel = playerStats.skills.divine_surge || 0;

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4 overflow-hidden font-sans">
      {/* ==================== TOP BAR: PLAYER FRAME & TARGET FRAME & MINIMAP ==================== */}
      <div className="flex justify-between items-start w-full">
        {/* PLAYER UNIT FRAME (Zu Online Oriental Daoist Style) */}
        <div id="player-unit-frame" className="pointer-events-auto flex items-center gap-3 bg-slate-950/80 backdrop-blur-md border border-amber-500/50 rounded-2xl p-3 shadow-2xl max-w-md">
          {/* Avatar sphere with Bagua ring */}
          <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-900 via-blue-950 to-slate-900 border-2 border-amber-400 shadow-inner">
            <div className="text-2xl font-serif text-amber-300">道</div>
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 font-bold text-xs px-1.5 py-0.5 rounded-full border border-amber-200">
              Nv.{playerStats.level}
            </div>
          </div>

          {/* Player stats */}
          <div className="flex flex-col gap-1.5 min-w-[210px]">
            <div className="flex justify-between items-baseline">
              <span className="text-amber-200 font-bold tracking-wide text-sm font-serif">
                {playerStats.name}
              </span>
              <span className="text-cyan-400 text-xs font-semibold px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/30">
                {playerStats.realm}
              </span>
            </div>

            {/* HP Bar */}
            <div className="relative w-full bg-slate-900 h-4 rounded-full overflow-hidden border border-red-900/60">
              <div
                className="h-full bg-gradient-to-r from-red-700 via-red-500 to-rose-400 transition-all duration-200"
                style={{ width: `${hpPercent}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow">
                HP {Math.ceil(playerStats.hp)} / {playerStats.maxHp}
              </span>
            </div>

            {/* MP (Chi) Bar */}
            <div className="relative w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-blue-900/60">
              <div
                className="h-full bg-gradient-to-r from-blue-700 via-cyan-500 to-teal-300 transition-all duration-200"
                style={{ width: `${mpPercent}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-cyan-100 drop-shadow">
                Qi {Math.ceil(playerStats.mp)} / {playerStats.maxMp}
              </span>
            </div>

            {/* Badges: Flying, Meditating & Equipment */}
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {playerStats.isFlying && (
                <span className="text-[10px] bg-blue-600/60 text-blue-200 px-2 py-0.5 rounded-full border border-blue-400/50 flex items-center gap-1">
                  <Sword className="w-3 h-3" /> Espada Voadora
                </span>
              )}
              {playerStats.isMeditating && (
                <span className="text-[10px] bg-emerald-600/60 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/50 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Meditação de Qi
                </span>
              )}
              {playerStats.equippedItems?.weapon && (
                <span className="text-[10px] bg-sky-950 text-sky-300 px-2 py-0.5 rounded-full border border-sky-500/40">
                  ⚔ {playerStats.equippedItems.weapon.name}
                </span>
              )}
              {playerStats.equippedItems?.summonRelic && (
                <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40">
                  🛡 {playerStats.equippedItems.summonRelic.name}
                </span>
              )}
              <span className="text-[10px] text-amber-300 ml-auto flex items-center gap-1 font-mono">
                💎 {playerStats.spiritStones} Pedras
              </span>
            </div>
          </div>
        </div>

        {/* TARGET UNIT FRAME (When a monster is selected) */}
        {targetMonster && targetMonster.type !== 'pvp_rival' && (
          <div id="target-unit-frame" className="pointer-events-auto flex flex-col gap-1.5 bg-slate-950/90 backdrop-blur-md border border-rose-500/70 rounded-2xl p-3 shadow-2xl max-w-sm animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-red-950 via-rose-900 to-black border-2 border-red-500 shadow">
                <span className="text-xl">👹</span>
                <div className="absolute -bottom-1 -right-1 bg-red-600 text-white font-bold text-[10px] px-1.5 py-0.5 rounded-full">
                  Nv.{targetMonster.level}
                </div>
              </div>

              <div className="flex flex-col gap-1 min-w-[180px]">
                <div className="flex justify-between items-center">
                  <span className="text-rose-200 font-bold text-sm truncate max-w-[140px]">
                    {targetMonster.name}
                  </span>
                  <button
                    onClick={onClearTarget}
                    className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 hover:bg-slate-800 rounded"
                    title="Desmarcar alvo"
                  >
                    ✕
                  </button>
                </div>

                {/* Monster HP */}
                <div className="relative w-full bg-slate-900 h-4 rounded-full overflow-hidden border border-rose-900/60">
                  <div
                    className="h-full bg-gradient-to-r from-red-700 via-rose-500 to-amber-400 transition-all duration-150"
                    style={{ width: `${targetHpPercent}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow">
                    {targetMonster.currentHp} / {targetMonster.maxHp} ({Math.ceil(targetHpPercent)}%)
                  </span>
                </div>

                <div className="flex justify-between text-[10px] text-slate-300 font-mono">
                  <span>ATK: {targetMonster.attackPower}</span>
                  <span>DEF: {targetMonster.defense}</span>
                  <span className="text-amber-300">+{targetMonster.expReward} EXP</span>
                </div>
              </div>
            </div>

            {/* Monster Attack Pattern Description */}
            {targetMonster.attackPatternDesc && (
              <div className="mt-1 px-2 py-1 bg-rose-950/40 border border-rose-500/30 rounded-lg text-[10px] text-rose-200/90 leading-tight">
                <span className="font-bold text-rose-400">Padrão de Ataque: </span>
                {targetMonster.attackPatternDesc}
              </div>
            )}
          </div>
        )}

        {/* CENTER TOP: SOULFIGHT DUEL BOSS BAR (Kaisete Lv. 230) */}
        {duelState && (duelState.isActive || targetMonster?.type === 'pvp_rival') && (
          <div id="duel-unit-frame" className="pointer-events-auto flex flex-col items-center gap-1.5 bg-slate-950/95 backdrop-blur-md border-2 border-amber-500/80 rounded-2xl px-5 py-2.5 shadow-[0_0_30px_rgba(245,158,11,0.4)] min-w-[320px] max-w-md mx-2 animate-fadeIn">
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚔️</span>
                <div>
                  <div className="text-xs font-serif font-bold text-amber-200 flex items-center gap-1.5">
                    <span>Grão-Mestre Kaisete</span>
                    <span className="text-[10px] bg-red-900/80 text-red-200 px-1.5 py-0.2 rounded-full border border-red-500/50">
                      Nv.230
                    </span>
                    <span className="text-[10px] text-amber-400 font-sans">({duelState.opponentClass})</span>
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">
                    {duelState.state === 'countdown'
                      ? '⏱ Contagem Regressiva...'
                      : duelState.state === 'fighting'
                      ? '⚔️ Em Duelo Mortal de Imortais'
                      : duelState.state === 'victory'
                      ? '🏆 Vitória do Cultivador!'
                      : duelState.state === 'defeat'
                      ? '💀 Derrota no Duelo'
                      : 'Arena Soulfight Preparada'}
                  </div>
                </div>
              </div>

              <div className="text-right flex flex-col items-end">
                <div className="text-xs font-mono font-bold text-amber-300">
                  ⏱ {Math.floor(duelState.timer / 60).toString().padStart(2, '0')}:{Math.floor(duelState.timer % 60).toString().padStart(2, '0')}
                </div>
                <button
                  onClick={onStartDuel}
                  className="text-[10px] text-amber-400 hover:text-amber-200 font-semibold px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 hover:bg-amber-900/60 transition mt-0.5"
                >
                  {duelState.isActive ? 'Reiniciar [G]' : 'Iniciar Duelo [G]'}
                </button>
              </div>
            </div>

            {/* Boss HP Bar */}
            <div className="relative w-full bg-slate-900 h-4 rounded-full overflow-hidden border border-red-900/80 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-red-700 via-rose-500 to-amber-400 transition-all duration-150"
                style={{ width: `${Math.max(0, Math.min(100, (duelState.opponentHp / duelState.opponentMaxHp) * 100))}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow">
                HP {Math.ceil(duelState.opponentHp)} / {duelState.opponentMaxHp} ({Math.ceil((duelState.opponentHp / duelState.opponentMaxHp) * 100)}%)
              </span>
            </div>

            {/* Swirling Blade Shield Bar */}
            <div className="relative w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-amber-500/50">
              <div
                className="h-full bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-200 transition-all duration-150"
                style={{ width: `${Math.max(0, Math.min(100, (duelState.opponentShield / 15000) * 100))}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-slate-950 drop-shadow">
                {duelState.opponentShield > 0
                  ? `🛡 Escudo Giratório: ${Math.ceil(duelState.opponentShield)} / 15.000`
                  : '⚡ Escudo Quebrado (Vulnerável!)'}
              </span>
            </div>
          </div>
        )}

        {/* TOP RIGHT: CONTROLS & OBJECTIVES & MINIMAP */}
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          {/* Oriental Zu Minimap Radar */}
          <Minimap
            playerPos={minimapData.playerPos}
            playerAngle={minimapData.playerAngle}
            summonPos={minimapData.summonPos}
            monsters={minimapData.monsters}
          />

          {/* Quick Action Navigation Bar & PvP Arena Teleport */}
          <div className="flex flex-col items-end gap-1.5">
            {/* Teleport & PvP Quick Controls */}
            <div className="flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-xl border border-amber-500/50 shadow-xl">
              <button
                id="arena-teleport-btn"
                onClick={onTeleportArena}
                title="Teleportar para a Arena Soulfight e desafiar Kaisete Nv. 230 [Atalho: T]"
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-red-950 to-amber-950 border border-amber-400 hover:border-amber-300 text-amber-200 transition flex items-center gap-1.5 shadow"
              >
                <Swords className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="text-[11px]">Arena Soulfight [T]</span>
              </button>

              <button
                id="shushan-teleport-btn"
                onClick={onTeleportMain}
                title="Teleportar de volta para o Templo de Shushan"
                className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-200 transition flex items-center gap-1 shadow"
              >
                <span className="text-[11px]">🏝️ Shushan</span>
              </button>

              <button
                id="pvp-toggle-btn"
                onClick={onTogglePvP}
                title="Alternar Modo Duelo Lv 187 (Escala Zu Online) [Atalho: P]"
                className={`px-2 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1 ${
                  playerStats.isPvPMode
                    ? 'bg-amber-600/40 text-amber-200 border-amber-400 shadow-amber-500/30'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <span className="text-[10px]">PvP 187 [P]</span>
              </button>
            </div>

            {/* Inventory, Skills, Audio, Help Bar */}
            <div className="flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-700 shadow-xl">
            {/* INVENTORY MODAL BUTTON [I] */}
            <button
              id="inventory-modal-btn"
              onClick={onOpenInventory}
              title="Abrir Mochila & Equipamentos (Atalho: [I])"
              className="relative px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-700 hover:border-amber-400 text-amber-200 transition flex items-center gap-1.5 shadow"
            >
              <Package className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] hidden sm:inline">Mochila [I]</span>
              {inventory.length > 0 && (
                <span className="bg-amber-500 text-slate-950 text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                  {inventory.length}
                </span>
              )}
            </button>

            {/* SKILLS MODAL BUTTON [K] */}
            <button
              id="skills-modal-btn"
              onClick={onOpenSkills}
              title="Árvore de Técnicas Taoistas (Atalho: [K])"
              className="relative px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-700 hover:border-cyan-400 text-cyan-200 transition flex items-center gap-1.5 shadow"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span className="text-[11px] hidden sm:inline">Técnicas [K]</span>
              {playerStats.skillPoints > 0 && (
                <span className="animate-bounce bg-cyan-400 text-slate-950 text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                  +{playerStats.skillPoints} pts
                </span>
              )}
            </button>

            {/* Music */}
            <button
              id="bgm-toggle-btn"
              onClick={toggleBgm}
              title={isMusicPlaying ? 'Pausar Música Xianxia' : 'Tocar Música Xianxia'}
              className={`p-2 rounded-lg text-xs flex items-center gap-1 transition ${
                isMusicPlaying ? 'bg-amber-600/40 text-amber-200 border border-amber-500/50' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Music className="w-4 h-4" />
            </button>

            {/* Sound FX */}
            <button
              id="sound-toggle-btn"
              onClick={toggleSound}
              title={isMuted ? 'Ativar Efeitos Sonoros' : 'Silenciar'}
              className={`p-2 rounded-lg text-xs transition ${
                isMuted ? 'text-rose-400 hover:bg-rose-950/50' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Help Guide */}
            <button
              id="help-modal-btn"
              onClick={onOpenHelp}
              title="Guia de Comandos e Lore"
              className="p-2 rounded-lg text-xs text-amber-300 hover:bg-amber-950/40 transition flex items-center gap-1"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

          {/* QUEST / TRIALS TRACKER */}
          <div className="bg-slate-950/85 backdrop-blur-md border border-amber-500/40 rounded-xl p-3 text-xs w-64 shadow-xl">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold font-serif mb-2 pb-1 border-b border-amber-500/20">
              <Scroll className="w-4 h-4 text-amber-400" />
              <span>Caminho do Imortal (Missões)</span>
            </div>
            <div className="flex flex-col gap-2">
              {quests.map((q) => (
                <div key={q.id} className="flex flex-col gap-0.5">
                  <div className="flex justify-between items-center">
                    <span className={`font-semibold ${q.completed ? 'line-through text-emerald-400' : 'text-slate-200'}`}>
                      {q.title}
                    </span>
                    <span className="text-[10px] text-amber-400">
                      {q.progress}/{q.maxProgress}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">{q.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ==================== BOTTOM HUD: ACTIVE SUMMON & COMBAT LOG & ACTION BAR ==================== */}
      <div className="flex flex-col gap-2 w-full">
        <div className="flex justify-between items-end w-full">
          {/* BOTTOM-LEFT: ACTIVE SUMMON CARD & SWITCHER */}
          <div id="summon-companion-card" className="pointer-events-auto flex flex-col gap-2 bg-slate-950/85 backdrop-blur-md border border-cyan-500/50 rounded-2xl p-3 max-w-xs shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center border shadow"
                  style={{ backgroundColor: `${activeSummon.color}25`, borderColor: activeSummon.color }}
                >
                  {activeSummon.id === 'fox' && <Flame className="w-5 h-5 text-red-400" />}
                  {activeSummon.id === 'xuanwu' && <Shield className="w-5 h-5 text-emerald-400" />}
                  {activeSummon.id === 'dragon' && <Zap className="w-5 h-5 text-sky-400" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-100">{activeSummon.name}</div>
                  <div className="text-[10px] text-cyan-300">{activeSummon.role}</div>
                </div>
              </div>
            </div>

            {/* Summon HP */}
            <div className="relative w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-cyan-900/60">
              <div
                className="h-full bg-gradient-to-r from-cyan-600 to-teal-300 transition-all duration-200"
                style={{ width: `${summonHpPercent}%` }}
              />
            </div>

            {/* Summon Stats */}
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>ATK: {activeSummon.attackPower}</span>
              <span>DEF: {activeSummon.defense}</span>
              <span className="text-amber-300">Alcance: {activeSummon.attackRange}m</span>
            </div>

            {/* Summon Switch Buttons */}
            <div className="flex items-center gap-1 pt-1 border-t border-slate-800">
              <button
                id="summon-fox-btn"
                onClick={() => onSwitchSummon('fox')}
                className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 border transition ${
                  activeSummon.id === 'fox'
                    ? 'bg-red-950/80 border-red-500 text-red-200'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-red-500/60'
                }`}
              >
                <Flame className="w-3 h-3 text-red-400" /> [2] Raposa
              </button>

              <button
                id="summon-xuanwu-btn"
                onClick={() => onSwitchSummon('xuanwu')}
                className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 border transition ${
                  activeSummon.id === 'xuanwu'
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-emerald-500/60'
                }`}
              >
                <Shield className="w-3 h-3 text-emerald-400" /> [3] Xuanwu
              </button>

              <button
                id="summon-dragon-btn"
                onClick={() => onSwitchSummon('dragon')}
                className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 border transition ${
                  activeSummon.id === 'dragon'
                    ? 'bg-sky-950/80 border-sky-500 text-sky-200'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-sky-500/60'
                }`}
              >
                <Zap className="w-3 h-3 text-sky-400" /> [4] Dragão
              </button>
            </div>
          </div>

          {/* COMBAT LOG (Zu Online Style) */}
          <div className="pointer-events-auto hidden md:flex flex-col w-80 bg-slate-950/80 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden shadow-lg mb-1">
            <div
              className="flex justify-between items-center px-2.5 py-1 bg-slate-900/80 border-b border-slate-800 cursor-pointer text-[10px] text-slate-400 font-semibold"
              onClick={() => setShowLog(!showLog)}
            >
              <span>Registro de Batalha & Espólios</span>
              {showLog ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </div>
            {showLog && (
              <div className="p-2 flex flex-col gap-1 max-h-28 overflow-y-auto text-[10px] font-mono scrollbar-thin">
                {combatLogs.slice(-6).map((log) => (
                  <div
                    key={log.id}
                    className={`leading-tight ${
                      log.type === 'damage'
                        ? 'text-amber-200'
                        : log.type === 'summon'
                        ? 'text-cyan-300'
                        : log.type === 'loot'
                        ? 'text-emerald-300 font-bold'
                        : 'text-slate-300'
                    }`}
                  >
                    › {log.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ==================== ORNATE MMORPG ACTION BAR ==================== */}
        <div className="flex flex-col items-center gap-1.5 w-full">
          {/* Cultivation Exp Bar */}
          <div className="pointer-events-auto flex items-center gap-2 w-full max-w-2xl bg-slate-950/80 px-3 py-1 rounded-full border border-amber-500/30">
            <span className="text-[10px] font-bold text-amber-300">EXP Cultivo</span>
            <div className="relative flex-1 bg-slate-900 h-2.5 rounded-full overflow-hidden border border-amber-900/50">
              <div
                className="h-full bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-200 transition-all duration-300"
                style={{ width: `${expPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-amber-200 font-mono">
              {playerStats.exp}/{playerStats.maxExp} ({Math.ceil(expPercent)}%)
            </span>
            {playerStats.exp >= playerStats.maxExp && (
              <button
                id="breakthrough-btn"
                onClick={onBreakthrough}
                className="animate-pulse bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-950 font-bold text-[10px] px-2.5 py-0.5 rounded-full shadow hover:scale-105 active:scale-95"
              >
                ✨ Avançar Reino!
              </button>
            )}
          </div>

          {/* Action Slots Hotbar */}
          <div id="game-hotbar" className="pointer-events-auto flex items-center gap-2 bg-slate-950/90 backdrop-blur-md p-2 rounded-2xl border-2 border-amber-500/60 shadow-2xl">
            {/* Slot Q: Poção de Cura (Quick Potion) */}
            <button
              id="skill-slot-q"
              onClick={onQuickPotion}
              className="relative group w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 border-2 border-emerald-500 flex flex-col items-center justify-center hover:border-emerald-300 active:scale-95 transition shadow-lg"
              title="Beber Poção de Cura (+350 HP)"
            >
              <FlaskConical className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition" />
              <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-emerald-400 font-mono">Q</span>
              <span className="absolute top-0.5 left-1 text-[8px] font-bold text-white bg-emerald-700/80 px-1 rounded-full font-mono">
                {potionCount}
              </span>
            </button>

            {/* Slot 1: Talisman Toss OR Chuva de Espadas Voadoras (PvP Mode) */}
            <button
              id="skill-slot-1"
              onClick={playerStats.isPvPMode || duelState?.isActive ? onCastMultiSword : onCastTalisman}
              className="relative group w-12 h-12 rounded-xl bg-gradient-to-br from-amber-950 via-slate-900 to-amber-900 border-2 border-amber-500 flex flex-col items-center justify-center hover:border-amber-300 active:scale-95 transition shadow-lg"
              title={
                playerStats.isPvPMode || duelState?.isActive
                  ? '万剑诀 - Chuva de Espadas Celestes (Atalho: [1]) - Dispara 6 espadas teleguiadas em sequência!'
                  : 'Talismã Espiritual (Dano Mágico Rápido - Atalho: [1])'
              }
            >
              {playerStats.isPvPMode || duelState?.isActive ? (
                <Swords className="w-5 h-5 text-amber-300 group-hover:scale-110 transition animate-pulse" />
              ) : (
                <Scroll className="w-5 h-5 text-amber-300 group-hover:scale-110 transition" />
              )}
              <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-amber-400 font-mono">1</span>
              <span className="absolute top-0.5 left-1 text-[8px] text-cyan-300 font-mono">
                {playerStats.isPvPMode || duelState?.isActive ? '30Qi' : '25Qi'}
              </span>
            </button>

            {/* Slot 2: Celestial Fox */}
            <button
              id="skill-slot-2"
              onClick={() => onSwitchSummon('fox')}
              className={`relative group w-12 h-12 rounded-xl bg-slate-900 border-2 flex flex-col items-center justify-center transition shadow-lg ${
                activeSummon.id === 'fox' ? 'border-red-400 bg-red-950/60' : 'border-slate-700 hover:border-red-400/60'
              }`}
              title="Invocar Raposa Celestial (Fogo DPS)"
            >
              <Flame className="w-5 h-5 text-red-400 group-hover:scale-110 transition" />
              <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-red-400 font-mono">2</span>
            </button>

            {/* Slot 3: Xuanwu */}
            <button
              id="skill-slot-3"
              onClick={() => onSwitchSummon('xuanwu')}
              className={`relative group w-12 h-12 rounded-xl bg-slate-900 border-2 flex flex-col items-center justify-center transition shadow-lg ${
                activeSummon.id === 'xuanwu' ? 'border-emerald-400 bg-emerald-950/60' : 'border-slate-700 hover:border-emerald-400/60'
              }`}
              title="Invocar Tartaruga Xuanwu (Tanque)"
            >
              <Shield className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition" />
              <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-emerald-400 font-mono">3</span>
            </button>

            {/* Slot 4: Azure Dragon */}
            <button
              id="skill-slot-4"
              onClick={() => onSwitchSummon('dragon')}
              className={`relative group w-12 h-12 rounded-xl bg-slate-900 border-2 flex flex-col items-center justify-center transition shadow-lg ${
                activeSummon.id === 'dragon' ? 'border-sky-400 bg-sky-950/60' : 'border-slate-700 hover:border-sky-400/60'
              }`}
              title="Invocar Dragão Celeste (Trovão / Cura)"
            >
              <Zap className="w-5 h-5 text-sky-400 group-hover:scale-110 transition" />
              <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-sky-400 font-mono">4</span>
            </button>

            {/* Slot 5: 破空斩 (Air Explosion / Qi Blade Slash) */}
            <button
              id="skill-slot-5"
              onClick={onCastAirExplosion}
              className="relative group w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-950 via-slate-900 to-blue-950 border-2 border-cyan-400 flex flex-col items-center justify-center hover:border-cyan-200 active:scale-95 transition shadow-lg"
              title="破空斩 - Lâmina Cortante de Qi (Atalho: [5] ou [Z]) - Dispara lâmina de vácuo crescente cortando múltiplos alvos!"
            >
              <Sword className="w-5 h-5 text-cyan-300 group-hover:scale-110 rotate-45 transition" />
              <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-cyan-300 font-mono">5/Z</span>
              <span className="absolute top-0.5 left-1 text-[8px] text-cyan-200 font-mono">55Qi</span>
            </button>

            {/* Slot 6: 绝命剑 (Disabling Sword / Celestial Dash Slash) */}
            <button
              id="skill-slot-6"
              onClick={onCastDisablingSword}
              className="relative group w-12 h-12 rounded-xl bg-gradient-to-br from-rose-950 via-slate-900 to-amber-950 border-2 border-rose-500 flex flex-col items-center justify-center hover:border-rose-300 active:scale-95 transition shadow-lg"
              title="绝命剑 - Garrote Celestial (Atalho: [6] ou [X]) - Investida veloz com dano fulminante e atordoamento de Qi!"
            >
              <Crosshair className="w-5 h-5 text-rose-400 group-hover:scale-110 transition" />
              <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-rose-400 font-mono">6/X</span>
              <span className="absolute top-0.5 left-1 text-[8px] text-rose-200 font-mono">80Qi</span>
            </button>

            {/* Slot E: Bagua Array AoE */}
            <button
              id="skill-slot-e"
              onClick={onCastBagua}
              className="relative group w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-900 border-2 border-indigo-500 flex flex-col items-center justify-center hover:border-cyan-300 active:scale-95 transition shadow-lg"
              title="Formação Bagua (Explosão de Chi em Área - Atalho: [E])"
            >
              <Compass className="w-5 h-5 text-cyan-300 group-hover:scale-110 transition" />
              <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-cyan-300 font-mono">E</span>
              <span className="absolute top-0.5 left-1 text-[8px] text-cyan-300 font-mono">70Qi</span>
            </button>

            {/* Slot F: Summon Special */}
            <button
              id="skill-slot-f"
              onClick={onSummonSpecial}
              className="relative group w-12 h-12 rounded-xl bg-gradient-to-br from-orange-950 via-slate-900 to-amber-900 border-2 border-orange-500 flex flex-col items-center justify-center hover:border-amber-300 active:scale-95 transition shadow-lg"
              title={`Habilidade Especial da Invocação: ${activeSummon.specialSkillName}`}
            >
              <Sparkles className="w-5 h-5 text-amber-300 group-hover:scale-110 transition" />
              <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-amber-300 font-mono">F</span>
            </button>

            {/* Slot R: Divine Surge (Active Summoner Skill) */}
            <button
              id="skill-slot-r"
              onClick={onCastDivineSurge}
              className={`relative group w-12 h-12 rounded-xl border-2 flex flex-col items-center justify-center transition shadow-lg ${
                isSurgeActive
                  ? 'border-yellow-400 bg-yellow-950/80 shadow-yellow-500/50 animate-pulse'
                  : surgeLevel > 0
                  ? 'border-yellow-600/80 bg-slate-900 hover:border-yellow-400'
                  : 'border-slate-800 bg-slate-950/60 opacity-60'
              }`}
              title="Sobrecarga Espiritual Divina (Atalho: [R] - Fortalece Invocações)"
            >
              <Zap className={`w-5 h-5 ${isSurgeActive ? 'text-yellow-300 animate-spin' : 'text-yellow-500'} group-hover:scale-110 transition`} />
              <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-yellow-400 font-mono">R</span>
              {isSurgeActive ? (
                <span className="absolute top-0.5 left-1 text-[8px] text-yellow-300 font-bold font-mono">
                  {Math.ceil(playerStats.divineSurgeTimer || 0)}s
                </span>
              ) : (
                <span className="absolute top-0.5 left-1 text-[8px] text-yellow-500 font-mono">45Qi</span>
              )}
            </button>

            <div className="h-8 w-[1px] bg-slate-700 mx-0.5" />

            {/* Slot V: Flying Sword Mode */}
            <button
              id="skill-slot-v"
              onClick={onToggleFly}
              className={`relative group w-12 h-12 rounded-xl border-2 flex flex-col items-center justify-center transition shadow-lg ${
                playerStats.isFlying ? 'border-blue-400 bg-blue-900/60 shadow-blue-500/40' : 'border-slate-700 bg-slate-900 hover:border-blue-400/60'
              }`}
              title="Espada Voadora Celestial (Voo / Super Velocidade)"
            >
              <Sword className="w-5 h-5 text-blue-300 group-hover:scale-110 transition" />
              <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-blue-300 font-mono">V</span>
            </button>

            {/* Slot B: Meditate Mode */}
            <button
              id="skill-slot-b"
              onClick={onToggleMeditate}
              className={`relative group w-12 h-12 rounded-xl border-2 flex flex-col items-center justify-center transition shadow-lg ${
                playerStats.isMeditating ? 'border-emerald-400 bg-emerald-900/60' : 'border-slate-700 bg-slate-900 hover:border-emerald-400/60'
              }`}
              title="Meditação de Cultivo (Regenera Vida e Qi)"
            >
              <span className="text-base font-serif text-emerald-300">☯</span>
              <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-emerald-300 font-mono">B</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==================== ZU ONLINE COMBO METER ==================== */}
      {duelState && duelState.comboCount > 0 && (
        <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-end animate-bounce z-40">
          <div className="text-6xl font-black italic font-serif text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-amber-400 to-red-500 drop-shadow-[0_0_20px_rgba(245,158,11,0.9)]">
            {duelState.comboCount}
          </div>
          <div className="text-xs font-black tracking-widest text-amber-200 bg-amber-950/90 px-2.5 py-0.5 rounded-full border border-amber-400/70 uppercase shadow-lg">
            HITS COMBO!
          </div>
          <div className="text-[10px] text-amber-300 font-bold tracking-wider mt-0.5 font-mono">
            BURST DANO x{(1 + duelState.comboCount * 0.05).toFixed(2)}
          </div>
        </div>
      )}

      {/* ==================== DUEL COUNTDOWN OVERLAY ==================== */}
      {duelState?.isActive && duelState.state === 'countdown' && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-[2px] z-50 animate-fadeIn">
          <div className="text-center">
            <div className="text-amber-400 font-serif tracking-widest text-xl font-bold drop-shadow">
              ⚔️ DUELO DE IMORTAIS - SOULFIGHT ⚔️
            </div>
            <div className="text-slate-200 text-sm font-sans tracking-wide mt-1">
              Cultivador Nv. 187 vs Grão-Mestre Kaisete Nv. 230
            </div>
            <div className="text-8xl font-serif font-black text-amber-300 drop-shadow-[0_0_35px_rgba(245,158,11,0.9)] mt-4 animate-pulse">
              {Math.ceil(duelState.countdown) > 0 ? Math.ceil(duelState.countdown) : 'LUTA!'}
            </div>
          </div>
        </div>
      )}

      {/* ==================== DUEL VICTORY OVERLAY ==================== */}
      {duelState?.isActive && duelState.state === 'victory' && (
        <div className="absolute inset-0 pointer-events-auto flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-sm z-50 animate-fadeIn">
          <div className="bg-slate-950 border-2 border-amber-400 rounded-3xl p-6 text-center max-w-md shadow-[0_0_60px_rgba(245,158,11,0.6)] flex flex-col items-center gap-3">
            <div className="text-5xl animate-bounce">🏆</div>
            <div className="text-amber-300 font-serif text-2xl font-bold">VITÓRIA NO DUELO!</div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Você superou o Grão-Mestre Kaisete com a maestria suprema das Espadas Voadoras! A seita de Zu reverencia sua ascensão!
            </p>
            <div className="flex gap-4 my-1 text-xs font-mono text-amber-200 bg-amber-950/60 px-4 py-2 rounded-xl border border-amber-500/40">
              <span>Honra PvP: +500</span>
              <span>EXP: +25.000</span>
              <span>Combo Máx: {duelState.maxCombo} Hits</span>
            </div>
            <div className="flex gap-2 w-full mt-2">
              <button
                onClick={onStartDuel}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:brightness-110 shadow-lg transition"
              >
                Desafiar Novamente [G]
              </button>
              <button
                onClick={onTeleportMain}
                className="py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
              >
                Retornar a Shushan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DUEL DEFEAT OVERLAY ==================== */}
      {duelState?.isActive && duelState.state === 'defeat' && (
        <div className="absolute inset-0 pointer-events-auto flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-sm z-50 animate-fadeIn">
          <div className="bg-slate-950 border-2 border-rose-600 rounded-3xl p-6 text-center max-w-md shadow-[0_0_60px_rgba(225,29,72,0.5)] flex flex-col items-center gap-3">
            <div className="text-5xl">💀</div>
            <div className="text-rose-400 font-serif text-2xl font-bold">DERROTA NO DUELO</div>
            <p className="text-slate-300 text-xs leading-relaxed">
              As espadas celestes de Kaisete romperam sua barreira. Medite, reorganize seu fluxo de Qi e tente a revanche!
            </p>
            <div className="flex gap-2 w-full mt-2">
              <button
                onClick={onStartDuel}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-rose-600 to-amber-600 text-white hover:brightness-110 shadow-lg transition"
              >
                Revanche Imediata [G]
              </button>
              <button
                onClick={onTeleportMain}
                className="py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
              >
                Retornar a Shushan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
