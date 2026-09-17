import React from 'react';
import { PlayerStats, SummonerSkillId } from '../types';
import { X, Sparkles, Zap, Shield, Flame, BookOpen, ArrowUpCircle } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface SkillTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerStats: PlayerStats;
  onUpgradeSkill: (skillId: SummonerSkillId) => void;
}

export const SkillTreeModal: React.FC<SkillTreeModalProps> = ({
  isOpen,
  onClose,
  playerStats,
  onUpgradeSkill,
}) => {
  if (!isOpen) return null;

  const pactLvl = playerStats.skills.ancestral_pact || 0;
  const qiLvl = playerStats.skills.qi_resonance || 0;
  const surgeLvl = playerStats.skills.divine_surge || 0;

  const skillsList = [
    {
      id: 'ancestral_pact' as SummonerSkillId,
      name: 'Pacto Ancestral Espiritual',
      type: 'Passiva',
      icon: Flame,
      color: 'text-amber-400',
      borderColor: 'border-amber-500/50',
      bgColor: 'bg-amber-950/20',
      level: pactLvl,
      maxLevel: 5,
      description:
        'Condensa fios da alma taoista nas bestas invocadas, aumentando permanentemente o poder de ataque espiritual de todas as invocações.',
      currentEffect:
        pactLvl > 0
          ? `+${pactLvl * 15}% de Dano e Poder de Ataque em todas as invocações`
          : 'Nenhum bônus ativo',
      nextEffect:
        pactLvl < 5
          ? `+${(pactLvl + 1) * 15}% de Dano e Poder de Ataque em todas as invocações`
          : 'Nível Máximo Atingido',
    },
    {
      id: 'qi_resonance' as SummonerSkillId,
      name: 'Ressonância de Qi Celestial',
      type: 'Passiva',
      icon: Shield,
      color: 'text-sky-400',
      borderColor: 'border-sky-500/50',
      bgColor: 'bg-sky-950/20',
      level: qiLvl,
      maxLevel: 5,
      description:
        'Sincroniza o meridiano espiritual do Invocador com o summon. Reduz a recarga da habilidade especial [F] e regenera Qi a cada golpe desferido.',
      currentEffect:
        qiLvl > 0
          ? `-${qiLvl * 12}% Tempo de Recarga da Habilidade Especial [F] e +${qiLvl * 6} Qi por ataque`
          : 'Nenhum bônus ativo',
      nextEffect:
        qiLvl < 5
          ? `-${(qiLvl + 1) * 12}% Tempo de Recarga da Habilidade Especial [F] e +${(qiLvl + 1) * 6} Qi por ataque`
          : 'Nível Máximo Atingido',
    },
    {
      id: 'divine_surge' as SummonerSkillId,
      name: 'Sobrecarga Espiritual Divina',
      type: 'Ativa [Tecla R]',
      icon: Zap,
      color: 'text-yellow-300',
      borderColor: 'border-yellow-500/50',
      bgColor: 'bg-yellow-950/20',
      level: surgeLvl,
      maxLevel: 5,
      description:
        'Canaliza o Dao celestial diretamente na invocação atual por 12 segundos, concedendo velocidade furiosa de ataque (+50%) e rajadas flamejantes com dano bônus.',
      currentEffect:
        surgeLvl > 0
          ? `Duração 12s, +50% Vel. Ataque, +${surgeLvl * 25} Dano Mágico por golpe (Custo: 45 Qi, Recarga: 24s)`
          : 'Habilidade não aprendida (Desbloqueie para usar com [R])',
      nextEffect:
        surgeLvl < 5
          ? `Aumenta o dano sagrado extra para +${(surgeLvl + 1) * 25} por golpe e reduz recarga para ${25 - surgeLvl}s`
          : 'Nível Máximo Atingido',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-950/95 border-2 border-amber-500/70 rounded-3xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto font-sans">
        {/* Close Button */}
        <button
          id="close-skill-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500 flex items-center justify-center text-amber-300 font-serif font-bold text-xl">
              法
            </div>
            <div>
              <h2 className="text-xl font-bold text-amber-200 font-serif tracking-wide">
                Livro de Habilidades do Invocador
              </h2>
              <p className="text-xs text-slate-400">
                Aprenda e aprimore técnicas espirituais para comandar e empoderar suas invocações
              </p>
            </div>
          </div>

          {/* Skill Points Banner */}
          <div className="flex items-center gap-2 bg-amber-950/50 border border-amber-500/60 px-3 py-1.5 rounded-2xl shadow-inner">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <div className="text-right">
              <span className="text-[10px] text-amber-300 block font-bold leading-tight">
                Pontos de Técnica
              </span>
              <span className="text-base font-bold text-amber-100 font-mono leading-none">
                {playerStats.skillPoints} pts
              </span>
            </div>
          </div>
        </div>

        {/* Skills List */}
        <div className="flex flex-col gap-4">
          {skillsList.map((skill) => {
            const Icon = skill.icon;
            const canUpgrade = playerStats.skillPoints > 0 && skill.level < skill.maxLevel;

            return (
              <div
                key={skill.id}
                className={`p-4 rounded-2xl border ${skill.borderColor} ${skill.bgColor} flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all`}
              >
                <div className="flex items-start gap-3.5 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 shadow-lg">
                    <Icon className={`w-7 h-7 ${skill.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-100">
                        {skill.name}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-amber-300 font-semibold">
                        {skill.type}
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-400 ml-auto">
                        Nv. {skill.level} / {skill.maxLevel}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {skill.description}
                    </p>

                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">
                          Efeito Atual:
                        </span>
                        <span className="text-emerald-400 font-mono font-medium">
                          {skill.currentEffect}
                        </span>
                      </div>
                      <div className="bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">
                          Próximo Nível:
                        </span>
                        <span className="text-sky-300 font-mono font-medium">
                          {skill.nextEffect}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upgrade Button */}
                <div className="shrink-0 w-full md:w-auto flex justify-end">
                  {skill.level >= skill.maxLevel ? (
                    <span className="text-xs font-bold text-amber-500/80 px-3 py-2 bg-slate-900 rounded-xl border border-slate-800">
                      ✨ Maximizado
                    </span>
                  ) : (
                    <button
                      id={`upgrade-skill-${skill.id}`}
                      disabled={!canUpgrade}
                      onClick={() => {
                        onUpgradeSkill(skill.id);
                        soundManager.playSkillUpgrade();
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg ${
                        canUpgrade
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 hover:scale-105 active:scale-95'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      <ArrowUpCircle className="w-4 h-4" />
                      {skill.level === 0 ? 'Aprender Técnica' : 'Aprimorar (+1 pt)'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Level Up Info Footer */}
        <div className="mt-6 pt-3 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-amber-400" />
            Você ganha <strong>1 Ponto de Técnica</strong> toda vez que avança de nível ou alcança um novo reino de cultivo!
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
