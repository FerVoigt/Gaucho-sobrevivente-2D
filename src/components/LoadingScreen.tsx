import React, { useEffect, useRef, useState } from 'react';
import { survivorsAudio } from '../audio/survivorsAudio';
import { CharacterConfig, StageConfig } from '../types/survivors';
import { Flame, Wind, CloudSnow, Sparkles, RefreshCw, Compass, ShieldAlert, ArrowRight, Volume2 } from 'lucide-react';

export type LoadingWeatherEffect = 'wind' | 'snow' | 'hail' | 'storm';

export interface FolkloreQuote {
  id: number;
  text: string;
  source: string;
  category: 'ditado' | 'lenda' | 'causo' | 'clima';
}

export const GAUCHO_FOLKLORE_QUOTES: FolkloreQuote[] = [
  {
    id: 1,
    text: 'Não tá morto quem peleia, vivente! Segura com firmeza o cabo do facão que a noite no pampa é comprida.',
    source: 'Provérbio Farroupilha',
    category: 'ditado',
  },
  {
    id: 2,
    text: 'O Minuano uiva cortando as carnes quando o Negrinho do Pastoreio anda campeando os tocos de vela.',
    source: 'Lenda das Missões',
    category: 'lenda',
  },
  {
    id: 3,
    text: 'Quem tem medo de assombração não cruza o banhado nem bebe água de cacimba à meia-noite.',
    source: 'Causo de Galpão',
    category: 'causo',
  },
  {
    id: 4,
    text: 'Boleadeira bem calibrada e olhar atento no horizonte: nas trevas das coxilhas, o primeiro laço decide quem volta pro rancho.',
    source: 'Sabedoria Campeira',
    category: 'ditado',
  },
  {
    id: 5,
    text: 'Mais agarrado que carrapato em ovelha xucra: assim deve ser o peão na defesa da sua querência.',
    source: 'Ditado Farroupilha',
    category: 'ditado',
  },
  {
    id: 6,
    text: 'Cuidado com o Boitatá nas taperas abandonadas: a serpente de fogo-fátuo devora o entendimento dos covardes.',
    source: 'Mitologia dos Pampas',
    category: 'lenda',
  },
  {
    id: 7,
    text: 'Cavalo bueno não se espanta com grito de coruja rasgando a noite nem com uivo de lobisomem no capão.',
    source: 'Ditado dos Galpões',
    category: 'ditado',
  },
  {
    id: 8,
    text: 'Chimarrão bem cevado na cuia de porongo espanta o frio de renguear cusco e esquenta a coragem pro combate.',
    source: 'Tradição do Mate Crioulo',
    category: 'causo',
  },
  {
    id: 9,
    text: 'A Teiniaguá, princesa encantada com pedra de carbúnculo na fronte, vigia as cavernas misteriosas do Cerro do Jarau.',
    source: 'Lenda do Cerro do Jarau',
    category: 'lenda',
  },
  {
    id: 10,
    text: 'Cusco leal nunca abandona a bota do patrão na tronqueira, nem quando a Mula Sem Cabeça cruza a cancela.',
    source: 'Sabedoria dos Tropeiros',
    category: 'causo',
  },
  {
    id: 11,
    text: 'Deus ajuda quem madruga, mas o vento Minuano não perdoa quem sai pra lida sem o pala nos ombros.',
    source: 'Ditado da Fronteira',
    category: 'clima',
  },
  {
    id: 12,
    text: 'Fogo de chão crepitando, chaleira chiando e relho aprumado na cinta: venham as visagens do além!',
    source: 'Causo de Fogo de Chão',
    category: 'causo',
  },
  {
    id: 13,
    text: 'Mais faceiro que guri de bombacha nova desfilando a cavalo em pleno Vinte de Setembro.',
    source: 'Humor & Tradição Gaúcha',
    category: 'ditado',
  },
  {
    id: 14,
    text: 'Nas rajadas do vento sul viajam as preces dos lanceiros negros e o eco dos clarins da Guerra dos Farrapos.',
    source: 'Memória Histórica',
    category: 'lenda',
  },
  {
    id: 15,
    text: 'O Saci nos pampas adora trançar a crina dos potros no potreiro e assobiar no taquaral pra confundir o viajante.',
    source: 'Folclore Crioulo',
    category: 'lenda',
  },
  {
    id: 16,
    text: 'Peleia contra o tinhoso não se ganha com conversa mole: afia o aço na chaira e firma o pé no estribo!',
    source: 'Sabedoria dos Lanceiros',
    category: 'ditado',
  },
  {
    id: 17,
    text: 'Céu vermelho ao poente anuncia geada negra rengueadora, temporal de granizo graúdo ou rastro de mula encantada.',
    source: 'Sinais do Tempo Campeiro',
    category: 'clima',
  },
  {
    id: 18,
    text: 'Quem já domou potro aporreado no pelo não treme as pernas diante de assombração de cemitério jesuíta.',
    source: 'Orgulho Gaúcho',
    category: 'ditado',
  },
  {
    id: 19,
    text: 'Galo cantou à meia-noite no terreiro? Benze as cancelas com sal grosso, tição de brasa e ramo de arruda!',
    source: 'Crença Popular Campeira',
    category: 'causo',
  },
  {
    id: 20,
    text: 'A noite das Missões pertence aos mistérios; o alvorecer da coxilha pertence aos que tiveram honra de resistir.',
    source: 'Causo Tradicional',
    category: 'lenda',
  },
];

const PREPARATION_STEPS = [
  'Cilando os arreios e amolando o facão...',
  'Fervendo a água do mate na chaleira de ferro...',
  'Escutando o assovio do vento pelas frestas do galpão...',
  'Invocando a bênção do Negrinho do Pastoreio...',
  'Carregando a Garrucha Farroupilha e boleadeiras...',
  'Despertando as assombrações e feras do pampa...',
  'Tudo nos trinques, vivente! Pronto pra peleia!',
];

interface LoadingScreenProps {
  character: CharacterConfig;
  stage: StageConfig;
  activePerk?: string;
  isMuted?: boolean;
  onComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  character,
  stage,
  activePerk,
  isMuted = false,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Choose appropriate initial weather based on stage
  const getDefaultWeatherForStage = (): LoadingWeatherEffect => {
    if (stage.id === 'frost_peaks') return 'snow';
    if (stage.id === 'blood_crypt') return 'hail';
    if (stage.defaultWeather === 'rain' || stage.defaultWeather === 'ember_storm') return 'storm';
    return 'wind';
  };

  const [weatherEffect, setWeatherEffect] = useState<LoadingWeatherEffect>(getDefaultWeatherForStage);
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * GAUCHO_FOLKLORE_QUOTES.length));
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [quoteFading, setQuoteFading] = useState(false);

  // Current quote
  const currentQuote = GAUCHO_FOLKLORE_QUOTES[quoteIndex];

  // Rotate quotes randomly or forward
  const handleNextQuote = () => {
    setQuoteFading(true);
    setTimeout(() => {
      setQuoteIndex((prev) => (prev + 1 + Math.floor(Math.random() * 3)) % GAUCHO_FOLKLORE_QUOTES.length);
      setQuoteFading(false);
    }, 200);
  };

  // Change weather effect with sound
  const handleSelectWeather = (effect: LoadingWeatherEffect) => {
    setWeatherEffect(effect);
    if (!isMuted) {
      if (effect === 'wind' || effect === 'storm') {
        survivorsAudio.playWindGust();
      } else if (effect === 'hail') {
        survivorsAudio.playHailImpact();
      } else if (effect === 'snow') {
        survivorsAudio.playWindGust();
      }
    }
  };

  // Progress simulation (smooth organic progression to 100% over ~2.4 seconds)
  useEffect(() => {
    const startTime = Date.now();
    const duration = 2400; // 2.4s loading duration

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(interval);
        setIsReady(true);
        if (!isMuted) {
          survivorsAudio.playLoadingComplete();
        }
      }
    }, 40);

    return () => clearInterval(interval);
  }, [isMuted]);

  // Auto complete after reaching 100% (after 1.3s delay) if user doesn't click immediately
  useEffect(() => {
    if (!isReady) return;
    const timer = setTimeout(() => {
      onComplete();
    }, 1400);
    return () => clearTimeout(timer);
  }, [isReady, onComplete]);

  // Initial ambient wind sound on mount
  useEffect(() => {
    if (!isMuted) {
      const timer = setTimeout(() => {
        survivorsAudio.playWindGust();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isMuted]);

  // Dynamic Weather Canvas Particle Simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Weather Particles Definitions
    interface WindParticle {
      x: number;
      y: number;
      length: number;
      speed: number;
      opacity: number;
      width: number;
      curve: number;
    }

    interface LeafParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      rot: number;
      vRot: number;
      size: number;
      color: string;
    }

    interface EmberParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      life: number;
    }

    interface SnowParticle {
      x: number;
      y: number;
      size: number;
      speed: number;
      swaySpeed: number;
      swayOffset: number;
      alpha: number;
      isDetailed: boolean;
    }

    interface HailParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      rotation: number;
      bounces: number;
    }

    interface RainParticle {
      x: number;
      y: number;
      length: number;
      speed: number;
      alpha: number;
    }

    // Pools
    const windStreaks: WindParticle[] = [];
    const leaves: LeafParticle[] = [];
    const embers: EmberParticle[] = [];
    const snowflakes: SnowParticle[] = [];
    const hailStones: HailParticle[] = [];
    const rainDrops: RainParticle[] = [];

    // Initialize Wind
    for (let i = 0; i < 45; i++) {
      windStreaks.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: 80 + Math.random() * 220,
        speed: 400 + Math.random() * 600,
        opacity: 0.15 + Math.random() * 0.35,
        width: 1 + Math.random() * 2,
        curve: (Math.random() - 0.5) * 15,
      });
    }

    const leafColors = ['#9a3412', '#c2410c', '#b45309', '#78350f', '#4d7c0f'];
    for (let i = 0; i < 28; i++) {
      leaves.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 180 + Math.random() * 240,
        vy: 20 + (Math.random() - 0.3) * 60,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 6,
        size: 5 + Math.random() * 8,
        color: leafColors[Math.floor(Math.random() * leafColors.length)],
      });
    }

    // Initialize Snow
    for (let i = 0; i < 140; i++) {
      snowflakes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 1 + Math.random() * 3.8,
        speed: 40 + Math.random() * 95,
        swaySpeed: 1 + Math.random() * 2.5,
        swayOffset: Math.random() * Math.PI * 2,
        alpha: 0.3 + Math.random() * 0.7,
        isDetailed: Math.random() > 0.8,
      });
    }

    // Initialize Hail
    for (let i = 0; i < 70; i++) {
      hailStones.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: -60 - Math.random() * 90,
        vy: 480 + Math.random() * 380,
        size: 3 + Math.random() * 4.5,
        alpha: 0.65 + Math.random() * 0.35,
        rotation: Math.random() * Math.PI * 2,
        bounces: 0,
      });
    }

    // Initialize Rain & Storm
    for (let i = 0; i < 160; i++) {
      rainDrops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: 22 + Math.random() * 30,
        speed: 700 + Math.random() * 450,
        alpha: 0.25 + Math.random() * 0.5,
      });
    }

    let lastTime = performance.now();
    let lightningTimer = 0;
    let lightningFlash = 0;

    // Animation Loop
    const render = (time: number) => {
      const dt = Math.min(0.1, (time - lastTime) / 1000);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // Handle lightning for storm & hail
      if (weatherEffect === 'storm' || weatherEffect === 'hail') {
        lightningTimer += dt;
        if (lightningTimer > 3.5 + Math.random() * 4) {
          lightningTimer = 0;
          lightningFlash = 0.55;
          if (!isMuted && Math.random() > 0.4) {
            survivorsAudio.playHailImpact();
          }
        }
        if (lightningFlash > 0) {
          lightningFlash -= dt * 2.5;
          ctx.fillStyle = `rgba(224, 242, 254, ${Math.max(0, lightningFlash * 0.38)})`;
          ctx.fillRect(0, 0, width, height);
        }
      }

      // 1. RENDER WIND EFFECT (Vento Minuano)
      if (weatherEffect === 'wind' || weatherEffect === 'storm') {
        // Wind speed lines
        ctx.save();
        for (const w of windStreaks) {
          w.x += w.speed * dt;
          if (w.x - w.length > width) {
            w.x = -w.length;
            w.y = Math.random() * height;
          }

          const grad = ctx.createLinearGradient(w.x - w.length, w.y, w.x, w.y);
          grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          grad.addColorStop(0.7, `rgba(226, 232, 240, ${w.opacity * 0.8})`);
          grad.addColorStop(1, `rgba(186, 230, 253, ${w.opacity})`);

          ctx.strokeStyle = grad;
          ctx.lineWidth = w.width;
          ctx.beginPath();
          ctx.moveTo(w.x - w.length, w.y);
          ctx.quadraticCurveTo(w.x - w.length * 0.5, w.y + w.curve, w.x, w.y);
          ctx.stroke();
        }
        ctx.restore();

        // Flying Autumn Pampa Leaves
        for (const l of leaves) {
          l.x += l.vx * dt;
          l.y += l.vy * dt;
          l.rot += l.vRot * dt;

          if (l.x > width + 20) {
            l.x = -20;
            l.y = Math.random() * height;
          }
          if (l.y > height + 20) l.y = -10;
          if (l.y < -20) l.y = height + 10;

          ctx.save();
          ctx.translate(l.x, l.y);
          ctx.rotate(l.rot);
          ctx.fillStyle = l.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, l.size, l.size * 0.45, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(-l.size, 0);
          ctx.lineTo(l.size, 0);
          ctx.stroke();
          ctx.restore();
        }

        // Drifting Embers from Campfire
        if (Math.random() < 0.3) {
          embers.push({
            x: -10,
            y: height * 0.5 + (Math.random() - 0.5) * height * 0.6,
            vx: 180 + Math.random() * 260,
            vy: (Math.random() - 0.5) * 60 - 20,
            size: 1.5 + Math.random() * 2.5,
            alpha: 1,
            life: 1.2 + Math.random() * 1.5,
          });
        }

        for (let i = embers.length - 1; i >= 0; i--) {
          const em = embers[i];
          em.x += em.vx * dt;
          em.y += em.vy * dt;
          em.life -= dt;
          em.alpha = Math.max(0, em.life / 1.5);

          if (em.life <= 0 || em.x > width + 10) {
            embers.splice(i, 1);
            continue;
          }

          ctx.fillStyle = `rgba(249, 115, 22, ${em.alpha})`;
          ctx.beginPath();
          ctx.arc(em.x, em.y, em.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 2. RENDER SNOW EFFECT (Neve da Serra Gaúcha)
      if (weatherEffect === 'snow') {
        ctx.save();
        for (const s of snowflakes) {
          s.y += s.speed * dt;
          s.x += Math.sin(time * 0.002 * s.swaySpeed + s.swayOffset) * 28 * dt + 15 * dt;

          if (s.y > height + 10) {
            s.y = -10;
            s.x = Math.random() * width;
          }
          if (s.x > width + 10) s.x = -10;
          if (s.x < -10) s.x = width + 10;

          ctx.fillStyle = `rgba(241, 245, 249, ${s.alpha})`;

          if (s.isDetailed && s.size > 2.8) {
            // Draw delicate 6-pointed ice star
            ctx.save();
            ctx.translate(s.x, s.y);
            ctx.strokeStyle = `rgba(224, 242, 254, ${s.alpha * 0.9})`;
            ctx.lineWidth = 1;
            for (let arm = 0; arm < 3; arm++) {
              ctx.beginPath();
              ctx.moveTo(-s.size * 1.4, 0);
              ctx.lineTo(s.size * 1.4, 0);
              ctx.stroke();
              ctx.rotate(Math.PI / 3);
            }
            ctx.restore();
          } else {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Cold frost vignette at the borders
        const frostGrad = ctx.createRadialGradient(width / 2, height / 2, width * 0.35, width / 2, height / 2, width * 0.7);
        frostGrad.addColorStop(0, 'rgba(186, 230, 253, 0)');
        frostGrad.addColorStop(1, 'rgba(186, 230, 253, 0.14)');
        ctx.fillStyle = frostGrad;
        ctx.fillRect(0, 0, width, height);

        ctx.restore();
      }

      // 3. RENDER HAIL EFFECT (Granizo Campeiro)
      if (weatherEffect === 'hail') {
        ctx.save();
        const groundY = height - 30;

        for (const h of hailStones) {
          h.x += h.vx * dt;
          h.y += h.vy * dt;
          h.rotation += 4 * dt;

          // Impact bounce on ground
          if (h.y >= groundY && h.bounces === 0) {
            h.bounces++;
            h.vy = -h.vy * 0.25;
            h.vx = (Math.random() - 0.5) * 120;
          }

          if (h.y > height + 20 || h.x < -30) {
            h.y = -20;
            h.x = Math.random() * (width + 200);
            h.vy = 520 + Math.random() * 380;
            h.vx = -70 - Math.random() * 90;
            h.bounces = 0;
          }

          ctx.save();
          ctx.translate(h.x, h.y);
          ctx.rotate(h.rotation);

          // Ice Crystal Hail Pellet (hexagon or faceted pebble)
          ctx.fillStyle = `rgba(240, 249, 255, ${h.alpha})`;
          ctx.strokeStyle = `rgba(147, 197, 253, ${h.alpha * 0.8})`;
          ctx.lineWidth = 1.2;

          ctx.beginPath();
          const sides = 6;
          for (let i = 0; i < sides; i++) {
            const ang = (i / sides) * Math.PI * 2;
            const r = h.size * (0.85 + (i % 2 === 0 ? 0.25 : -0.1));
            const px = Math.cos(ang) * r;
            const py = Math.sin(ang) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Glint highlight
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.beginPath();
          ctx.arc(-h.size * 0.3, -h.size * 0.3, h.size * 0.35, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
        ctx.restore();
      }

      // 4. RENDER STORM EFFECT (Temporal Farroupilha com Chuva)
      if (weatherEffect === 'storm') {
        ctx.save();
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.45)';
        ctx.lineWidth = 1.4;

        for (const r of rainDrops) {
          r.x -= r.speed * 0.22 * dt;
          r.y += r.speed * dt;

          if (r.y > height + 20) {
            r.y = -r.length;
            r.x = Math.random() * (width + 200);
          }

          ctx.beginPath();
          ctx.moveTo(r.x, r.y);
          ctx.lineTo(r.x - r.length * 0.22, r.y + r.length);
          ctx.stroke();
        }
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [weatherEffect, isMuted]);

  // Current step text based on progress
  const stepIndex = Math.min(
    PREPARATION_STEPS.length - 1,
    Math.floor((progress / 100) * PREPARATION_STEPS.length)
  );
  const currentStep = PREPARATION_STEPS[stepIndex];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-4 sm:p-8 bg-[#090d10] text-amber-50 select-none overflow-hidden font-sans">
      {/* Background Weather Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />

      {/* Atmospheric Vignette and Shadows */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 pointer-events-none z-1" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none z-1" />

      {/* TOP HEADER: Stage & Character Info + Weather Switcher */}
      <div className="relative z-10 w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-amber-900/30 pb-4 backdrop-blur-sm">
        {/* Stage & Hero Pill */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-2xl shadow-lg shadow-amber-950/40">
            {stage.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400/90 font-serif">
                Destino no Pampa
              </span>
              <span className="text-xs text-amber-200/50">•</span>
              <span className="text-xs text-amber-200/80 font-medium">
                Herói: <strong className="text-amber-100">{character.name}</strong>
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold font-serif text-amber-100 tracking-wide">
              {stage.name}
            </h1>
          </div>
        </div>

        {/* Interactive Weather Effect Switcher Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-black/60 rounded-xl border border-amber-500/20 backdrop-blur-md">
          <span className="text-[11px] font-semibold text-amber-300/70 px-2 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-amber-400" /> Clima:
          </span>
          <button
            onClick={() => handleSelectWeather('wind')}
            title="Vento Minuano soprado das coxilhas"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              weatherEffect === 'wind'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/50 scale-105'
                : 'text-amber-200/70 hover:text-amber-100 hover:bg-white/5'
            }`}
          >
            <Wind className="w-3.5 h-3.5 text-sky-300" />
            <span className="hidden sm:inline">Vento</span>
          </button>
          <button
            onClick={() => handleSelectWeather('snow')}
            title="Neve da Serra Gaúcha e Geada Negra"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              weatherEffect === 'snow'
                ? 'bg-sky-700 text-white shadow-md shadow-sky-900/50 scale-105'
                : 'text-amber-200/70 hover:text-amber-100 hover:bg-white/5'
            }`}
          >
            <CloudSnow className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Neve</span>
          </button>
          <button
            onClick={() => handleSelectWeather('hail')}
            title="Granizo Campeiro e Pedras de Gelo"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              weatherEffect === 'hail'
                ? 'bg-cyan-800 text-white shadow-md shadow-cyan-900/50 scale-105'
                : 'text-amber-200/70 hover:text-amber-100 hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span className="hidden sm:inline">Granizo</span>
          </button>
          <button
            onClick={() => handleSelectWeather('storm')}
            title="Temporal Farroupilha com Chuva e Trovoadas"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              weatherEffect === 'storm'
                ? 'bg-indigo-900 text-white shadow-md shadow-indigo-950/50 scale-105'
                : 'text-amber-200/70 hover:text-amber-100 hover:bg-white/5'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Temporal</span>
          </button>
        </div>
      </div>

      {/* CENTERPIECE: Gaucho Folklore Quotes & Lore Card */}
      <div className="relative z-10 w-full max-w-3xl my-auto flex flex-col items-center text-center px-4">
        {/* Animated decorative heraldic seal */}
        <div className="relative mb-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-b from-amber-600/30 to-red-950/60 border-2 border-amber-500/50 flex items-center justify-center shadow-2xl shadow-amber-950/80 ring-4 ring-amber-500/10">
            <span className="text-4xl sm:text-5xl drop-shadow-md select-none animate-pulse">🧉</span>
          </div>
          {/* Subtle spinning ring */}
          <div className="absolute -inset-2 border-2 border-dashed border-amber-400/20 rounded-full animate-spin [animation-duration:18s] pointer-events-none" />
        </div>

        {/* Folklore Quote Container */}
        <div className="w-full bg-stone-950/80 border border-amber-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden transition-all duration-300">
          {/* Corner flourish accents */}
          <div className="absolute top-2 left-2 text-amber-500/30 font-serif text-xs">◆</div>
          <div className="absolute top-2 right-2 text-amber-500/30 font-serif text-xs">◆</div>
          <div className="absolute bottom-2 left-2 text-amber-500/30 font-serif text-xs">◆</div>
          <div className="absolute bottom-2 right-2 text-amber-500/30 font-serif text-xs">◆</div>

          {/* Subtitle / Category Badge */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400/80 bg-amber-950/70 border border-amber-600/30 px-3 py-0.5 rounded-full">
              Folclore & Sabedoria dos Pampas
            </span>
          </div>

          {/* The Folklore Quote */}
          <div
            className={`min-h-[90px] flex items-center justify-center transition-opacity duration-200 ${
              quoteFading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            }`}
          >
            <p className="text-lg sm:text-2xl font-serif font-medium text-amber-100 leading-relaxed italic px-2">
              "{currentQuote.text}"
            </p>
          </div>

          {/* Source Attribution */}
          <div className="mt-4 pt-3 border-t border-amber-900/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-300/70">
            <span className="font-serif tracking-wider text-amber-400 font-semibold">
              — {currentQuote.source}
            </span>

            {/* Change Quote Button */}
            <button
              onClick={handleNextQuote}
              className="px-3 py-1 rounded-lg bg-amber-900/30 hover:bg-amber-800/40 border border-amber-500/30 text-amber-200 hover:text-white flex items-center gap-1.5 transition cursor-pointer text-xs"
              title="Ler outro provérbio ou lenda gaúcha"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              Ouvir outro causo
            </button>
          </div>
        </div>

        {/* Consumed Perk notice if active */}
        {activePerk && (
          <div className="mt-4 flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-xs text-emerald-200 font-medium shadow">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
            Vantagem Ativa:{' '}
            <span className="text-emerald-100 font-semibold">{activePerk}</span>
          </div>
        )}
      </div>

      {/* BOTTOM PROGRESS BAR & START BUTTON */}
      <div className="relative z-10 w-full max-w-3xl flex flex-col items-center gap-3">
        {/* Preparation step text & percentage */}
        <div className="w-full flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-amber-300/90 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="italic">{currentStep}</span>
          </div>
          <span className="font-mono font-bold text-amber-400 text-sm">{progress}%</span>
        </div>

        {/* The Progress Bar */}
        <div className="w-full h-3 sm:h-3.5 bg-black/70 rounded-full border border-amber-500/40 p-0.5 overflow-hidden shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-700 via-amber-500 to-yellow-300 transition-all duration-150 relative"
            style={{ width: `${progress}%` }}
          >
            {/* Glossy line */}
            <div className="absolute inset-0 bg-white/20 rounded-full" />
          </div>
        </div>

        {/* Action Button: Auto completes or allows clicking immediately once ready */}
        <div className="h-12 flex items-center justify-center mt-1">
          {isReady ? (
            <button
              onClick={onComplete}
              className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-red-600 to-amber-700 hover:from-amber-500 hover:via-red-500 hover:to-amber-600 text-white font-serif font-bold text-base tracking-wider uppercase shadow-xl shadow-red-950/70 border border-amber-300/40 flex items-center gap-2 transform hover:scale-105 active:scale-95 transition-all cursor-pointer animate-bounce"
            >
              <span>Entrar na Peleia</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-xs text-amber-400/60 uppercase tracking-widest font-mono">
              Inicializando motor do jogo...
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
