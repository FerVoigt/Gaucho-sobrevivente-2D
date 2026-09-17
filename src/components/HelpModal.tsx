import React from 'react';
import { X, Flame, Shield, Zap, Sword, Sparkles, Navigation } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-950/95 border-2 border-amber-500/70 rounded-3xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto font-sans">
        {/* Close Button */}
        <button
          id="close-help-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-amber-500/30">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500 flex items-center justify-center text-amber-300 font-serif font-bold text-xl">
            蜀
          </div>
          <div>
            <h2 className="text-xl font-bold text-amber-200 font-serif tracking-wide">
              Zu Online: Guia do Invocador Celestial
            </h2>
            <p className="text-xs text-slate-400">
              Guia de Controles, Bestas Espirituais e Reino de Cultivo
            </p>
          </div>
        </div>

        {/* Section 1: Controles de Jogo */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Navigation className="w-4 h-4" /> Controles do Jogo (MMORPG)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <span className="font-bold text-amber-400 font-mono">W, A, S, D</span>
              <p className="text-slate-400 mt-0.5">Mover Invocador</p>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <span className="font-bold text-amber-400 font-mono">Botão Direito Mouse</span>
              <p className="text-slate-400 mt-0.5">Girar câmera 360°</p>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <span className="font-bold text-amber-400 font-mono">Scroll do Mouse</span>
              <p className="text-slate-400 mt-0.5">Zoom da Câmera</p>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <span className="font-bold text-amber-400 font-mono">Clique Esquerdo</span>
              <p className="text-slate-400 mt-0.5">Selecionar Monstro / Atacar</p>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <span className="font-bold text-amber-400 font-mono">Espaço</span>
              <p className="text-slate-400 mt-0.5">Pular</p>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <span className="font-bold text-amber-400 font-mono">Tecla Tab</span>
              <p className="text-slate-400 mt-0.5">Alternar Alvos</p>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <span className="font-bold text-amber-400 font-mono">Tecla [1]</span>
              <p className="text-slate-400 mt-0.5">Talismã Espiritual</p>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <span className="font-bold text-amber-400 font-mono">Tecla [E]</span>
              <p className="text-slate-400 mt-0.5">Formação Bagua em Área</p>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <span className="font-bold text-amber-400 font-mono">Tecla [F]</span>
              <p className="text-slate-400 mt-0.5">Habilidade da Invocação</p>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <span className="font-bold text-amber-400 font-mono">Tecla [V]</span>
              <p className="text-slate-400 mt-0.5">Montar Espada Voadora</p>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <span className="font-bold text-amber-400 font-mono">Tecla [B]</span>
              <p className="text-slate-400 mt-0.5">Meditação (Regenera Qi)</p>
            </div>
          </div>
        </div>

        {/* Section 2: As 3 Invocações */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> As 3 Criaturas Espirituais
          </h3>
          <div className="flex flex-col gap-2.5">
            {/* Summon 1: Raposa */}
            <div className="flex items-start gap-3 bg-red-950/30 border border-red-500/40 p-3 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-red-900/40 border border-red-500 flex items-center justify-center shrink-0">
                <Flame className="w-6 h-6 text-red-400" />
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-red-300">[Tecla 2] Raposa Celestial das 9 Chamas</span>
                  <span className="bg-red-500/20 text-red-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    DPS MÁGICO / FOGO
                  </span>
                </div>
                <p className="text-slate-300 mt-1">
                  Ataca à distância com orbes de fogo místico. Sua habilidade especial <strong>[F] Dança das 9 Chamas</strong> lança uma tempestade de fogo em área atingindo múltiplos monstros.
                </p>
              </div>
            </div>

            {/* Summon 2: Xuanwu */}
            <div className="flex items-start gap-3 bg-emerald-950/30 border border-emerald-500/40 p-3 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-emerald-900/40 border border-emerald-500 flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-300">[Tecla 3] Tartaruga Negra Xuanwu</span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    TANQUE / TERRA
                  </span>
                </div>
                <p className="text-slate-300 mt-1">
                  Criatura colossal de jade com imensa defesa. Sua habilidade <strong>[F] Bastião Sagrado</strong> pisa no solo provocando todos os monstros próximos para atacá-la e concedendo escudo ao Invocador.
                </p>
              </div>
            </div>

            {/* Summon 3: Dragão */}
            <div className="flex items-start gap-3 bg-sky-950/30 border border-sky-500/40 p-3 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-sky-900/40 border border-sky-500 flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-sky-400" />
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sky-300">[Tecla 4] Dragão Celeste dos Raios</span>
                  <span className="bg-sky-500/20 text-sky-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    TROVÃO / CURA
                  </span>
                </div>
                <p className="text-slate-300 mt-1">
                  Dragão oriental voador que dispara raios divinos em cadeia. Sua habilidade <strong>[F] Bênção da Chuva Celestial</strong> atordoa inimigos e restaura massivamente a vida e Qi do Invocador.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Monstros & Boss */}
        <div className="mb-4">
          <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Sword className="w-4 h-4" /> Monstros e Zonas
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            - <strong>Ilha Central:</strong> Habitada por Morcegos Demônio Sombrios (Nv. 3) e Gárgulas de Jade (Nv. 5).
            <br />
            - <strong>Ilha dos Demônios (Leste):</strong> Habitada por Espectros da Chama Negra (Nv. 8).
            <br />
            - <strong>Pico Infernal (Noroeste):</strong> Guardado pelo temível <strong>Rei Demônio de Lava [CHEFE Nv. 20]</strong>. Ative sua Espada Voadora [V] para atravessar o abismo até o altar do chefe!
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 font-bold text-slate-950 transition shadow-lg text-sm"
        >
          Retornar à Batalha
        </button>
      </div>
    </div>
  );
};
