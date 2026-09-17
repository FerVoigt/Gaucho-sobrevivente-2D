import React, { useState } from 'react';
import { BookOpen, Skull, Shield, Zap, Sparkles, X, CheckCircle2, ChevronRight, Award, Flame, Snowflake, Search } from 'lucide-react';
import { BESTIARY_DATA } from '../game2d/constants';
import { BestiaryEntry, MonsterTier } from '../types/survivors';

interface BestiaryModalProps {
  killCounts: Record<string, number>;
  onClose: () => void;
}

export const BestiaryModal: React.FC<BestiaryModalProps> = ({ killCounts, onClose }) => {
  const [selectedId, setSelectedId] = useState<string>(BESTIARY_DATA[0].id);
  const [filterTier, setFilterTier] = useState<MonsterTier | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedEntry = BESTIARY_DATA.find((m) => m.id === selectedId) || BESTIARY_DATA[0];
  const kills = killCounts[selectedEntry.id] || 0;

  // Total kills summary
  const totalBestiaryKills = Object.values(killCounts).reduce((acc: number, count: number) => acc + count, 0);

  const filteredMonsters = BESTIARY_DATA.filter((m) => {
    const matchesTier = filterTier === 'all' || m.tier === filterTier;
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTier && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[90vh] bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 border-red-500/40 rounded-3xl p-6 shadow-[0_0_60px_rgba(239,68,68,0.25)] flex flex-col gap-4 text-slate-100 font-sans overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-950/60 border border-red-500/40 flex items-center justify-center text-2xl text-red-400 shadow-inner">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-yellow-300 tracking-wider">
                  CATÁLOGO DE INIMIGOS
                </h2>
                <span className="text-xs bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded-full text-slate-300 font-mono">
                  {BESTIARY_DATA.length} Espécies
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Conheça os horrores da noite profana e desbloqueie bônus permanentes por abates!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mr-10">
            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-red-900/60 text-xs font-mono font-bold text-rose-300">
              <Skull className="w-4 h-4 text-red-400" />
              <span>{totalBestiaryKills.toLocaleString()} Abates Totais</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['all', 'mob', 'swarm', 'elite', 'boss'] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setFilterTier(tier)}
                className={`px-3 py-1 text-xs rounded-lg font-bold capitalize transition cursor-pointer ${
                  filterTier === tier
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tier === 'all' ? 'Todos' : tier === 'mob' ? 'Comuns' : tier === 'swarm' ? 'Hordas' : tier === 'elite' ? 'Elites' : 'Chefes'}
              </button>
            ))}
          </div>

          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar monstro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500 transition"
            />
          </div>
        </div>

        {/* Main 2-Column Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0 overflow-hidden">
          {/* Left Column: Monster List */}
          <div className="lg:col-span-5 flex flex-col gap-2 overflow-y-auto pr-1">
            {filteredMonsters.map((monster) => {
              const isSelected = monster.id === selectedId;
              const count = killCounts[monster.id] || 0;
              const nextMilestone = monster.milestones.find((m) => count < m.kills);
              const maxMilestone = monster.milestones[monster.milestones.length - 1];
              const progress = Math.min(100, Math.floor((count / maxMilestone.kills) * 100));

              return (
                <button
                  key={monster.id}
                  onClick={() => setSelectedId(monster.id)}
                  className={`p-3 rounded-2xl border-2 transition-all duration-150 flex items-center justify-between gap-3 text-left cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 border border-slate-700 shadow-inner"
                      style={{ backgroundColor: `${monster.color}30` }}
                    >
                      {monster.spriteShape === 'bat' ? '🦇' :
                       monster.spriteShape === 'skeleton' ? '💀' :
                       monster.spriteShape === 'ghoul' ? '🧟' :
                       monster.spriteShape === 'wolf' ? '🐺' :
                       monster.spriteShape === 'wraith' ? '👻' :
                       monster.spriteShape === 'golem' ? '🗿' :
                       monster.spriteShape === 'boss_king' ? '👑' :
                       monster.spriteShape === 'vampire_lord' ? '🧛' : '☠️'}
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-sm text-slate-100">{monster.name}</span>
                        <span className={`text-[9px] uppercase font-mono font-bold px-1.5 py-0.2 rounded ${
                          monster.tier === 'boss' ? 'bg-amber-950 text-amber-400 border border-amber-500/50' :
                          monster.tier === 'elite' ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/50' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {monster.tier}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                        <Skull className="w-3 h-3 text-red-400" />
                        <span>{count.toLocaleString()} derrotados</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="w-16 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-red-600 to-amber-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-slate-500">{progress}%</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Selected Monster Dossier */}
          <div className="lg:col-span-7 bg-slate-950/90 border border-slate-800 rounded-3xl p-5 flex flex-col gap-4 overflow-y-auto">
            {/* Top Dossier Card */}
            <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 border-2 shadow-xl"
                style={{
                  backgroundColor: `${selectedEntry.color}35`,
                  borderColor: selectedEntry.secondaryColor,
                }}
              >
                {selectedEntry.spriteShape === 'bat' ? '🦇' :
                 selectedEntry.spriteShape === 'skeleton' ? '💀' :
                 selectedEntry.spriteShape === 'ghoul' ? '🧟' :
                 selectedEntry.spriteShape === 'wolf' ? '🐺' :
                 selectedEntry.spriteShape === 'wraith' ? '👻' :
                 selectedEntry.spriteShape === 'golem' ? '🗿' :
                 selectedEntry.spriteShape === 'boss_king' ? '👑' :
                 selectedEntry.spriteShape === 'vampire_lord' ? '🧛' : '☠️'}
              </div>

              <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-black text-xl text-red-300">
                    {selectedEntry.name}
                  </h3>
                  <span className="text-xs font-mono font-bold bg-slate-900 px-3 py-1 rounded-xl border border-red-950 text-red-400">
                    {kills.toLocaleString()} Abates
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{selectedEntry.description}</p>
              </div>
            </div>

            {/* Lore & Weakness */}
            <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800/80 flex flex-col gap-2">
              <p className="text-xs text-slate-300 italic leading-relaxed">
                "{selectedEntry.lore}"
              </p>
              <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60 text-xs">
                <strong className="text-amber-400 flex items-center gap-1 font-serif">
                  <Sparkles className="w-3.5 h-3.5" />
                  Fraqueza Recomendada:
                </strong>
                <span className="text-slate-300">{selectedEntry.weakness}</span>
              </div>
            </div>

            {/* Base Combat Attributes */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Vida Base</span>
                <p className="font-mono font-bold text-red-400 text-sm mt-0.5">{selectedEntry.baseHp}</p>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Dano</span>
                <p className="font-mono font-bold text-amber-400 text-sm mt-0.5">{selectedEntry.baseDamage}</p>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Velocidade</span>
                <p className="font-mono font-bold text-cyan-400 text-sm mt-0.5">{selectedEntry.baseSpeed} px/s</p>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold">XP Concedida</span>
                <p className="font-mono font-bold text-emerald-400 text-sm mt-0.5">{selectedEntry.xpValue} XP</p>
              </div>
            </div>

            {/* Milestones & Unlocked Rewards */}
            <div className="flex flex-col gap-2 mt-1">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Marcos de Abate & Bônus Desbloqueáveis</span>
              </span>

              <div className="flex flex-col gap-2">
                {selectedEntry.milestones.map((milestone) => {
                  const isUnlocked = kills >= milestone.kills;
                  return (
                    <div
                      key={milestone.rank}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition ${
                        isUnlocked
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-slate-200'
                          : 'bg-slate-900/40 border-slate-800 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold border ${
                            isUnlocked
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                              : 'bg-slate-800 text-slate-500 border-slate-700'
                          }`}
                        >
                          {milestone.rank}
                        </div>
                        <div className="flex flex-col">
                          <strong className={isUnlocked ? 'text-emerald-300' : 'text-slate-400'}>
                            {milestone.title} ({milestone.kills.toLocaleString()} Abates)
                          </strong>
                          <span className="text-[11px] text-slate-400">{milestone.bonusDesc}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 font-mono font-bold">
                        {isUnlocked ? (
                          <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            ATIVO
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">
                            {kills} / {milestone.kills}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
