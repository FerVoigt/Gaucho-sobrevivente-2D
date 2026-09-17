import React, { useState } from 'react';
import { Download, FileArchive, Monitor, Copy, Check, X, Terminal, ExternalLink, Sparkles } from 'lucide-react';

interface ExportGameModalProps {
  onClose: () => void;
}

export const ExportGameModal: React.FC<ExportGameModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'zip' | 'exe'>('zip');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const nativefierCmd = 'npm install -g nativefier\nnpm run build\nnativefier --name "Sobrevivente Gaucho" --icon public/icon.svg dist/';
  const electronCmd = 'npm install --save-dev electron electron-builder\nnpm run build\nnpx electron-builder --windows';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200 font-sans">
      <div className="w-full max-w-2xl bg-slate-950 border-2 border-amber-500/40 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col gap-5 text-slate-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif font-black text-xl md:text-2xl text-amber-300">
                Exportar Sobrevivente Gaúcho
              </h2>
              <p className="text-xs text-slate-400">
                Como baixar o jogo em arquivo .ZIP ou compilar como Executável (.EXE)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-100 border border-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('zip')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
              activeTab === 'zip'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileArchive className="w-4 h-4" />
            <span>1. Exportar em .ZIP (Código & Jogo)</span>
          </button>

          <button
            onClick={() => setActiveTab('exe')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
              activeTab === 'exe'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>2. Gerar Executável .EXE (Windows)</span>
          </button>
        </div>

        {/* Tab 1: ZIP */}
        {activeTab === 'zip' && (
          <div className="flex flex-col gap-4 text-xs md:text-sm text-slate-300 leading-relaxed">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Sparkles className="w-4 h-4" />
                <span>Pelo Menu do Google AI Studio (Método Direto)</span>
              </div>
              <ol className="list-decimal list-inside flex flex-col gap-2 text-slate-300 pl-1">
                <li>
                  No topo direito da tela do AI Studio, clique no <strong>menu de opções / configurações (ícone de engrenagem ou três pontinhos ⋯)</strong>.
                </li>
                <li>
                  Selecione a opção <strong>&quot;Export as ZIP&quot;</strong> ou <strong>&quot;Download ZIP&quot;</strong> (você também pode escolher <strong>&quot;Export to GitHub&quot;</strong> para sincronizar seu repositório).
                </li>
                <li>
                  O arquivo compactado contendo todos os arquivos TypeScript, assets, áudios e configurações do jogo será baixado diretamente para o seu computador.
                </li>
              </ol>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
              <span className="font-bold text-slate-200">Para rodar o .ZIP no seu PC após descompactar:</span>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-amber-300 flex items-center justify-between">
                <code>npm install && npm run dev</code>
                <button
                  onClick={() => handleCopy('npm install && npm run dev', 1)}
                  className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                >
                  {copiedIndex === 1 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copiar</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: EXE */}
        {activeTab === 'exe' && (
          <div className="flex flex-col gap-4 text-xs md:text-sm text-slate-300 leading-relaxed">
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-3.5 text-amber-200 text-xs">
              💡 <strong>Como transformar o jogo em .exe de Desktop:</strong> Jogos feitos em Web (HTML5/Vite/React) são transformados em arquivos executáveis (.exe) nativos do Windows através de empacotadores como <strong>Nativefier</strong> ou <strong>Electron</strong>.
            </div>

            {/* Method A: Nativefier (Super rápido) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <span>Método 1: Criar .exe instantâneo (Recomendado & Fácil)</span>
                </span>
                <button
                  onClick={() => handleCopy(nativefierCmd, 2)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 transition cursor-pointer"
                >
                  {copiedIndex === 2 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copiar Comandos</span>
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Descompacte o .ZIP, abra o terminal na pasta e rode os 3 comandos:
              </p>
              <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-amber-300 overflow-x-auto whitespace-pre-wrap">
                {nativefierCmd}
              </pre>
              <p className="text-[11px] text-emerald-400">
                ✓ Isso gera automaticamente a pasta com o arquivo <strong>Sobrevivente Gaucho.exe</strong> pronto para jogar offline no Windows!
              </p>
            </div>

            {/* Method B: Electron Builder */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-slate-400" />
                  <span>Método 2: Electron Builder (Instalador Profissional)</span>
                </span>
                <button
                  onClick={() => handleCopy(electronCmd, 3)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer"
                >
                  {copiedIndex === 3 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copiar</span>
                </button>
              </div>
              <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap">
                {electronCmd}
              </pre>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-800 pt-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
          >
            Entendido, Fechar Guia
          </button>
        </div>
      </div>
    </div>
  );
};
