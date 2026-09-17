// Procedural Web Audio API sound effects & authentic Gaúcho dynamic soundtrack for Sobrevivente Gaúcho

export type MusicThemeId = 'vanera' | 'milonga' | 'chote' | 'retro_gothic';

export interface MusicThemeOption {
  id: MusicThemeId;
  name: string;
  icon: string;
  description: string;
}

export const MUSIC_THEMES: MusicThemeOption[] = [
  {
    id: 'vanera',
    name: 'Vanera Campeira',
    icon: '🪗',
    description: 'Ritmo fandangueiro acelerado com gaitaço alegre e bumbo marcado dos pampas.',
  },
  {
    id: 'milonga',
    name: 'Milonga dos Pampas',
    icon: '🎸',
    description: 'Compasso tradicional cadenciado, misterioso e solene das noites na fronteira.',
  },
  {
    id: 'chote',
    name: 'Chote Farroupilha',
    icon: '🐎',
    description: 'Balanço tradicional de galpão com fole de gaita e violão sincopado.',
  },
  {
    id: 'retro_gothic',
    name: 'Sintetizador Gótico',
    icon: '🦇',
    description: 'Trilha retrô clássica sombria estilo terror gótico dos jogos de sobrevivência.',
  },
];

class SurvivorsAudioEngine {
  private ctx: AudioContext | null = null;
  // Master mute toggle (desativa todos os sons: efeitos e música)
  private isMuted: boolean = false;
  // Individual controls
  private isSfxEnabled: boolean = true;
  private isMusicEnabled: boolean = true;
  private currentMusicTheme: MusicThemeId = 'vanera';

  private musicInterval: number | null = null;
  private beatCount: number = 0;
  private lastGemTime: number = 0;
  private gemCombo: number = 0;

  constructor() {
    // Load persisted preferences safely
    try {
      const savedMute = localStorage.getItem('vs_audio_muted');
      if (savedMute !== null) {
        this.isMuted = savedMute === 'true';
      }
      const savedMusic = localStorage.getItem('vs_music_enabled');
      if (savedMusic !== null) {
        this.isMusicEnabled = savedMusic === 'true';
      }
      const savedTheme = localStorage.getItem('vs_music_theme') as MusicThemeId;
      if (savedTheme && ['vanera', 'milonga', 'chote', 'retro_gothic'].includes(savedTheme)) {
        this.currentMusicTheme = savedTheme;
      }
    } catch {
      // Ignore storage errors
    }
  }

  private init() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch {
      // Audio blocked or unsupported
    }
  }

  // ================= MASTER & VOLUME CONTROLS =================

  /** Desativa / ativa TODOS os sons (SFX + Música) simultaneamente */
  public setMuted(muted: boolean) {
    this.isMuted = muted;
    try {
      localStorage.setItem('vs_audio_muted', muted.toString());
    } catch {}

    if (muted) {
      this.stopMusic();
    } else if (this.isMusicEnabled) {
      this.startMusic();
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public toggleMusic(): boolean {
    this.isMusicEnabled = !this.isMusicEnabled;
    try {
      localStorage.setItem('vs_music_enabled', this.isMusicEnabled.toString());
    } catch {}

    if (this.isMusicEnabled && !this.isMuted) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
    return this.isMusicEnabled;
  }

  public getIsMusicEnabled(): boolean {
    return this.isMusicEnabled;
  }

  public setMusicTheme(theme: MusicThemeId) {
    if (this.currentMusicTheme === theme) return;
    this.currentMusicTheme = theme;
    try {
      localStorage.setItem('vs_music_theme', theme);
    } catch {}

    if (this.musicInterval) {
      this.stopMusic();
      this.startMusic();
    }
  }

  public getMusicTheme(): MusicThemeId {
    return this.currentMusicTheme;
  }

  public cycleMusicTheme(): MusicThemeId {
    const themes: MusicThemeId[] = ['vanera', 'milonga', 'chote', 'retro_gothic'];
    const idx = themes.indexOf(this.currentMusicTheme);
    const nextTheme = themes[(idx + 1) % themes.length];
    this.setMusicTheme(nextTheme);
    return nextTheme;
  }

  private canPlaySfx(): boolean {
    if (this.isMuted || !this.isSfxEnabled) return false;
    this.init();
    return !!this.ctx;
  }

  // ================= EFEITOS SONOROS GAUCHESCOS E DE ARMAS =================

  /** Som cortante de Facão Crioulo de Aço (lâmina afiada rasgando o ar com tinido de prata) */
  public playFacao() {
    if (!this.canPlaySfx() || !this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. Swish de ar cortado (Noise / Bandpass sweep)
    const swishOsc = this.ctx.createOscillator();
    const swishGain = this.ctx.createGain();
    swishOsc.type = 'sine';
    swishOsc.frequency.setValueAtTime(1400, now);
    swishOsc.frequency.exponentialRampToValueAtTime(320, now + 0.12);
    swishGain.gain.setValueAtTime(0.2, now);
    swishGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    swishOsc.connect(swishGain);
    swishGain.connect(this.ctx.destination);
    swishOsc.start(now);
    swishOsc.stop(now + 0.12);

    // 2. Tinido metálico penetrante do aço puro (Metallic Ring)
    const ringOsc = this.ctx.createOscillator();
    const ringGain = this.ctx.createGain();
    ringOsc.type = 'triangle';
    ringOsc.frequency.setValueAtTime(2450, now + 0.02);
    ringOsc.frequency.exponentialRampToValueAtTime(1800, now + 0.22);
    ringGain.gain.setValueAtTime(0.18, now + 0.02);
    ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    ringOsc.connect(ringGain);
    ringGain.connect(this.ctx.destination);
    ringOsc.start(now + 0.02);
    ringOsc.stop(now + 0.22);
  }

  /** Som do Laço e Boleadeira (corda zunindo no ar e estalo de impacto) */
  public playLaco() {
    if (!this.canPlaySfx() || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Rodopio veloz da presilha no ar (Whirring loop sweep)
    const whirrOsc = this.ctx.createOscillator();
    const whirrGain = this.ctx.createGain();
    whirrOsc.type = 'triangle';
    whirrOsc.frequency.setValueAtTime(280, now);
    whirrOsc.frequency.linearRampToValueAtTime(620, now + 0.08);
    whirrOsc.frequency.linearRampToValueAtTime(380, now + 0.14);
    whirrGain.gain.setValueAtTime(0.16, now);
    whirrGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    whirrOsc.connect(whirrGain);
    whirrGain.connect(this.ctx.destination);
    whirrOsc.start(now);
    whirrOsc.stop(now + 0.15);

    // Estalo seco de couro prendendo
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snapOsc.type = 'sawtooth';
    snapOsc.frequency.setValueAtTime(750, now + 0.07);
    snapOsc.frequency.exponentialRampToValueAtTime(90, now + 0.18);
    snapGain.gain.setValueAtTime(0.24, now + 0.07);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    snapOsc.connect(snapGain);
    snapGain.connect(this.ctx.destination);
    snapOsc.start(now + 0.07);
    snapOsc.stop(now + 0.18);
  }

  /** Som de arremesso de Boleadeira Campeira */
  public playBoleadeira() {
    this.playLaco();
  }

  /** Relincho vigoroso de Cavalo Crioulo dos Pampas (expressivo com vibrato equino) */
  public playHorseNeigh() {
    if (!this.canPlaySfx() || !this.ctx) return;
    const now = this.ctx.currentTime;

    // O relincho tem uma subida inicial, modulação rápida e declínio expressivo
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, now);
    filter.Q.setValueAtTime(2.2, now);

    // Curva de frequência do relincho (sobe, treme em vibrato e desce)
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.exponentialRampToValueAtTime(1250, now + 0.18);
    osc.frequency.linearRampToValueAtTime(1180, now + 0.28);
    osc.frequency.linearRampToValueAtTime(1260, now + 0.38);
    osc.frequency.linearRampToValueAtTime(1020, now + 0.52);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.72);

    // LFO de vibrato natural no tom do cavalo
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(16, now); // 16 Hz tremolo de relincho
    lfoGain.gain.setValueAtTime(65, now);
    lfo.connect(osc.frequency);
    lfo.start(now);
    lfo.stop(now + 0.72);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.12);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.45);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.72);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.72);
  }

  /** Som de Cascos de Cavalo / Galope nos Pampas (trote rítmico no campo) */
  public playGalope() {
    if (!this.canPlaySfx() || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Batida dupla característica de casco "po-co-tó"
    [0, 0.08].forEach((offset, idx) => {
      if (!this.ctx) return;
      const t = now + offset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(idx === 0 ? 190 : 160, t);
      osc.frequency.exponentialRampToValueAtTime(65, t + 0.07);

      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.07);
    });
  }

  /** Acorde / Floreio de Gaita Gaúcha (Acordeom Campeiro) */
  public playGaitaChord() {
    if (!this.canPlaySfx() || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Acorde tradicional de fandango (ex: Sol Maior: G4, B4, D5 com harmônico aberto de fole)
    const notes = [392.0, 493.88, 587.33, 783.99];
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Formante do fole de acordeom
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, now);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.025);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.04 + i * 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35 + i * 0.02);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + i * 0.025);
      osc.stop(now + 0.38);
    });
  }

  /** Floreio comemorativo rápido de Gaitaço Gaúcho */
  public playGaitaRiff() {
    if (!this.canPlaySfx() || !this.ctx) return;
    const now = this.ctx.currentTime;
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];

    scale.forEach((freq, i) => {
      if (!this.ctx) return;
      const t = now + i * 0.04;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.16);
    });
  }

  /** Som de Berimbau Gaúcho / Berimbau de Boca (ressonância elástica metálica) */
  public playBerimbau() {
    if (!this.canPlaySfx() || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(145, now);

    // Filtro modulando a cavidade bucal (efeito "wó-immm")
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(5.5, now);
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.exponentialRampToValueAtTime(1300, now + 0.12);
    filter.frequency.exponentialRampToValueAtTime(650, now + 0.32);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.32);
  }

  /** Ronco de cuia de Chimarrão / Fervor de água quente na erva-mate */
  public playChimarrao() {
    if (!this.canPlaySfx() || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Borbulhar e sucção aerada característica da bomba de chimarrão
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(540, now + 0.08);
    osc.frequency.linearRampToValueAtTime(260, now + 0.18);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  /** Chibatada e estalo de Relho Farroupilha de Couro Cru */
  public playRelho() {
    if (!this.canPlaySfx() || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Chiado inicial do couro passando no ar
    const whipOsc = this.ctx.createOscillator();
    const whipGain = this.ctx.createGain();
    whipOsc.type = 'sawtooth';
    whipOsc.frequency.setValueAtTime(950, now);
    whipOsc.frequency.exponentialRampToValueAtTime(90, now + 0.16);
    whipGain.gain.setValueAtTime(0.28, now);
    whipGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    whipOsc.connect(whipGain);
    whipGain.connect(this.ctx.destination);
    whipOsc.start(now);
    whipOsc.stop(now + 0.16);
  }

  /** Latido protetor e alegre do Cusco Caramelo dos pampas */
  public playDogBark() {
    if (!this.canPlaySfx() || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(360, now);
    osc.frequency.exponentialRampToValueAtTime(170, now + 0.13);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(750, now);
    filter.frequency.exponentialRampToValueAtTime(420, now + 0.13);
    filter.Q.setValueAtTime(3.5, now);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.14);
  }

  /** Mordida rápida e ágil do Cusco contra as assombrações */
  public playDogBite() {
    if (!this.canPlaySfx() || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.09);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  /** Tiro estrondoso de Garrucha ou Trabuco Farrapo de Pederneira */
  public playGunshot() {
    if (!this.canPlaySfx() || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.2);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  /** Redemoinho veloz e travesso do Saci-Pererê */
  public playSaciWhirlwind() {
    if (!this.canPlaySfx() || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.linearRampToValueAtTime(780, now + 0.11);
    osc.frequency.linearRampToValueAtTime(290, now + 0.22);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  /** Teletransporte místico e veloz d'O Negrinho do Pastoreio (Harmônicos celestiais e centelha de vela benta) */
  public playNegrinhoTeleport() {
    if (!this.canPlaySfx() || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Glissando etéreo ascendente com modulação de sino
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.exponentialRampToValueAtTime(1318.51, now + 0.25); // E6

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(659.25, now); // E5
    osc2.frequency.exponentialRampToValueAtTime(1567.98, now + 0.25); // G6

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.28);
    osc2.stop(now + 0.28);
  }

  /** Impacto de Dano de Área (AoE) sagrado d'O Negrinho do Pastoreio (Sino consagrado e estrondo de luz) */
  public playNegrinhoAoe() {
    if (!this.canPlaySfx() || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Resonância de sino de capela com impacto grave
    const bell = this.ctx.createOscillator();
    const boom = this.ctx.createOscillator();
    const bellGain = this.ctx.createGain();
    const boomGain = this.ctx.createGain();

    bell.type = 'sine';
    bell.frequency.setValueAtTime(880, now);
    bell.frequency.exponentialRampToValueAtTime(440, now + 0.5);

    bellGain.gain.setValueAtTime(0.22, now);
    bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    boom.type = 'triangle';
    boom.frequency.setValueAtTime(150, now);
    boom.frequency.exponentialRampToValueAtTime(40, now + 0.35);

    boomGain.gain.setValueAtTime(0.25, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    bell.connect(bellGain);
    boom.connect(boomGain);
    bellGain.connect(this.ctx.destination);
    boomGain.connect(this.ctx.destination);

    bell.start(now);
    boom.start(now);
    bell.stop(now + 0.5);
    boom.stop(now + 0.35);
  }

  /** Milagre do Pastoreio / Coleta da Vela Benta (Fanfarra angelical de graça alcançada) */
  public playNegrinhoMiracle() {
    if (!this.canPlaySfx() || !this.ctx) return;
    const now = this.ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C E G C E celestial
    notes.forEach((freq, idx) => {
      const startTime = now + idx * 0.08;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.45);
    });
  }

  // ================= EFEITOS CLÁSSICOS REFINADOS =================

  public playWhip() {
    this.playRelho();
  }

  public playSword() {
    this.playFacao();
  }

  public playDagger() {
    if (!this.canPlaySfx() || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(650, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.14, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  public playLightning() {
    if (!this.canPlaySfx() || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.38, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  public playHolyWater() {
    if (!this.canPlaySfx() || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(240, this.ctx.currentTime + 0.22);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.22);
  }

  public playGemPickup() {
    if (!this.canPlaySfx() || !this.ctx) return;
    const now = Date.now();
    if (now - this.lastGemTime < 350) {
      this.gemCombo = Math.min(this.gemCombo + 1, 14);
    } else {
      this.gemCombo = 0;
    }
    this.lastGemTime = now;

    const pentatonic = [440, 493.88, 554.37, 659.25, 739.99, 880, 987.77, 1108.73, 1318.51, 1479.98, 1760, 1975.53, 2217.46, 2637.02, 2959.96];
    const freq = pentatonic[this.gemCombo % pentatonic.length];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.08, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  public playLevelUp() {
    if (!this.canPlaySfx() || !this.ctx) return;
    // Toca gaitaço triunfante misturado com a fanfarra campeira
    this.playGaitaRiff();

    const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const startTime = this.ctx.currentTime + idx * 0.07;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  }

  public playMonsterDeath() {
    if (!this.canPlaySfx() || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(190, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  public playBloodSplatter() {
    if (!this.canPlaySfx() || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.09);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, now);
      filter.frequency.exponentialRampToValueAtTime(140, now + 0.08);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.13, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);
    } catch {
      // Safe fallback
    }
  }

  /** Efeito atmosférico do Vento Minuano soprando nos pampas */
  public playWindGust() {
    if (!this.canPlaySfx() || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const dur = 1.4;
      const bufferSize = Math.floor(this.ctx.sampleRate * dur);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.setValueAtTime(3.5, now);
      filter.frequency.setValueAtTime(260, now);
      filter.frequency.linearRampToValueAtTime(540, now + dur * 0.45);
      filter.frequency.exponentialRampToValueAtTime(180, now + dur);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + dur * 0.35);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);
    } catch {
      // Safe fallback
    }
  }

  /** Impacto estalado de pedra de granizo no telhado campeiro */
  public playHailImpact() {
    if (!this.canPlaySfx() || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800 + Math.random() * 600, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // Safe fallback
    }
  }

  /** Som de chimarrão pronto / sino de partida para a peleia */
  public playLoadingComplete() {
    if (!this.canPlaySfx() || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [440, 554.37, 659.25, 880].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.08, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.35);
      });
    } catch {
      // Safe fallback
    }
  }

  public playBreakProp() {
    if (!this.canPlaySfx() || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(70, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  public playRosary() {
    if (!this.canPlaySfx() || !this.ctx) return;
    const freqs = [110, 220, 440, 880];
    freqs.forEach((freq) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.24, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 1.2);
    });
  }

  public playChestOpen() {
    if (!this.canPlaySfx() || !this.ctx) return;
    this.playGaitaChord();
    const notes = [392.0, 523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + idx * 0.11;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  }

  public playChestUnlock() {
    this.playChestOpen();
  }

  public playGoldFever() {
    if (!this.canPlaySfx() || !this.ctx) return;
    // Ouro campeiro com relincho de cavalo e sinetas de prata
    this.playHorseNeigh();

    const goldChimes = [587.33, 739.99, 880.0, 1174.66, 1479.98, 1760.0];
    goldChimes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.05, t + 0.35);

      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  }

  public playSupremeFusion() {
    if (!this.canPlaySfx() || !this.ctx) return;
    // Fusão Suprema Farroupilha: Sub-grave potente + Gaitaço glorioso
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(120, this.ctx.currentTime);
    sub.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.8);
    subGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    subGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.85);
    sub.connect(subGain);
    subGain.connect(this.ctx.destination);
    sub.start();
    sub.stop(this.ctx.currentTime + 0.85);

    this.playGaitaRiff();

    const chord = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
    chord.forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + 0.15 + idx * 0.09;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.26, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.8);
    });
  }

  public playPickupItem() {
    if (!this.canPlaySfx() || !this.ctx) return;
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + idx * 0.07;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  public playPlayerHurt() {
    if (!this.canPlaySfx() || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.24, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  public playVictory() {
    if (!this.canPlaySfx() || !this.ctx) return;
    this.playHorseNeigh();
    this.playGaitaRiff();

    const victoryNotes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
    victoryNotes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + idx * 0.1;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.02, t + 0.6);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.7);
    });
  }

  public playGameOver() {
    if (!this.canPlaySfx() || !this.ctx) return;
    const chords = [130.81, 155.56, 196.0, 233.08];
    chords.forEach((freq) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 2.5);
    });
  }

  // ================= MÚSICA AMBIENTE DINÂMICA & RITMOS GAÚCHOS =================

  public startMusic() {
    if (this.musicInterval) return;
    if (this.isMuted || !this.isMusicEnabled) return;

    this.init();
    if (!this.ctx) return;

    this.beatCount = 0;

    switch (this.currentMusicTheme) {
      case 'vanera':
        this.startVaneraMusic();
        break;
      case 'milonga':
        this.startMilongaMusic();
        break;
      case 'chote':
        this.startChoteMusic();
        break;
      case 'retro_gothic':
      default:
        this.startRetroGothicMusic();
        break;
    }
  }

  public stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  /** Ritmo 1: VANERA CAMPEIRA (136 BPM, 2/4 marcado com gaitaço e bumbo de fandango) */
  private startVaneraMusic() {
    const bpm = 136;
    const stepTimeMs = (60 / bpm / 4) * 1000; // semicolcheias (16th notes)

    // Harmonia campeira tradicional em Lá Maior (A - E - D - A)
    const vaneraBassProgression = [
      110.0, 110.0, 164.81, 110.0, // A
      164.81, 164.81, 123.47, 164.81, // E
      146.83, 146.83, 220.0, 146.83, // D
      110.0, 110.0, 164.81, 110.0, // A
    ];

    // Arpejo saltitante de gaita gaúcha
    const vaneraGaitaNotes = [
      440.0, 554.37, 659.25, 880.0, 659.25, 554.37, 440.0, 554.37,
      329.63, 415.3, 493.88, 659.25, 493.88, 415.3, 329.63, 415.3,
      293.66, 369.99, 440.0, 587.33, 440.0, 369.99, 293.66, 369.99,
      440.0, 554.37, 659.25, 880.0, 739.99, 659.25, 554.37, 440.0,
    ];

    this.musicInterval = window.setInterval(() => {
      if (this.isMuted || !this.isMusicEnabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const step16 = this.beatCount % 16;
      const barCount = Math.floor(this.beatCount / 16);

      // 1. Bumbo / Baixo campeiro vanera (tempo 1 e tempo 2 sincopado)
      if (step16 === 0 || step16 === 6 || step16 === 8 || step16 === 14) {
        const bassFreq = vaneraBassProgression[barCount % vaneraBassProgression.length];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(bassFreq, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.16);
      }

      // 2. Acorde de Gaita Gaúcha no contratempo (estilo fole vanera: passos 4, 12)
      if (step16 === 4 || step16 === 12) {
        const chordNotes = [440, 554.37, 659.25];
        chordNotes.forEach((freq) => {
          if (!this.ctx) return;
          const gOsc = this.ctx.createOscillator();
          const gGain = this.ctx.createGain();
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(1400, now);
          gOsc.type = 'sawtooth';
          gOsc.frequency.setValueAtTime(freq, now);
          gGain.gain.setValueAtTime(0.045, now);
          gGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
          gOsc.connect(filter);
          filter.connect(gGain);
          gGain.connect(this.ctx.destination);
          gOsc.start(now);
          gOsc.stop(now + 0.11);
        });
      }

      // 3. Pedaço melódico da Gaita em semicolcheias (passos pares)
      if (step16 % 2 === 0) {
        const noteIdx = (this.beatCount / 2) % vaneraGaitaNotes.length;
        const noteFreq = vaneraGaitaNotes[noteIdx];
        const melOsc = this.ctx.createOscillator();
        const melGain = this.ctx.createGain();
        melOsc.type = 'sawtooth';
        melOsc.frequency.setValueAtTime(noteFreq, now);
        melGain.gain.setValueAtTime(0.025, now);
        melGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
        melOsc.connect(melGain);
        melGain.connect(this.ctx.destination);
        melOsc.start(now);
        melOsc.stop(now + 0.08);
      }

      // 4. Marcação de prato / chocalho de espora no contratempo
      if (step16 % 2 === 1) {
        const hh = this.ctx.createOscillator();
        const hhG = this.ctx.createGain();
        hh.type = 'square';
        hh.frequency.setValueAtTime(1600, now);
        hhG.gain.setValueAtTime(0.012, now);
        hhG.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
        hh.connect(hhG);
        hhG.connect(this.ctx.destination);
        hh.start(now);
        hh.stop(now + 0.035);
      }

      this.beatCount++;
    }, stepTimeMs);
  }

  /** Ritmo 2: MILONGA DOS PAMPAS (96 BPM, cadência solene, misteriosa e profunda da noite) */
  private startMilongaMusic() {
    const bpm = 96;
    const stepTimeMs = (60 / bpm / 4) * 1000;

    // Padrão de Milonga: Habanera pampeana (1 e... 2 e... acentuações sincopadas)
    // Passos do compasso 16: [0 (forte), 3 (sincopa), 6, 8, 11, 14]
    const milongaBassNotes = [82.41, 110.0, 73.42, 98.0]; // E2, A2, D2, G2

    this.musicInterval = window.setInterval(() => {
      if (this.isMuted || !this.isMusicEnabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const step16 = this.beatCount % 16;
      const bar = Math.floor(this.beatCount / 16);

      // 1. Bordão de violão pampeano (ritmo milongueiro sincopado)
      if (step16 === 0 || step16 === 3 || step16 === 6 || step16 === 8 || step16 === 11) {
        const freq = milongaBassNotes[bar % milongaBassNotes.length];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(step16 === 0 ? freq : freq * 1.5, now);
        gain.gain.setValueAtTime(step16 === 0 ? 0.08 : 0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
      }

      // 2. Gaita melancólica de fundo
      if (step16 % 4 === 0) {
        const chords = [
          [220, 261.63, 329.63], // Am
          [196, 246.94, 293.66], // G
          [220, 277.18, 329.63], // A
          [164.81, 246.94, 329.63], // Em
        ];
        const curChord = chords[bar % chords.length];
        curChord.forEach((f) => {
          if (!this.ctx) return;
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(f, now);
          g.gain.setValueAtTime(0.022, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
          o.connect(g);
          g.connect(this.ctx.destination);
          o.start(now);
          o.stop(now + 0.45);
        });
      }

      // 3. Ecos de percussão campeira (madeira oca de bumbo legüero)
      if (step16 === 0 || step16 === 8) {
        const leguero = this.ctx.createOscillator();
        const lGain = this.ctx.createGain();
        leguero.type = 'sine';
        leguero.frequency.setValueAtTime(85, now);
        leguero.frequency.exponentialRampToValueAtTime(45, now + 0.18);
        lGain.gain.setValueAtTime(0.07, now);
        lGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        leguero.connect(lGain);
        lGain.connect(this.ctx.destination);
        leguero.start(now);
        leguero.stop(now + 0.18);
      }

      this.beatCount++;
    }, stepTimeMs);
  }

  /** Ritmo 3: CHOTE FARROUPILHA (114 BPM, balanço alegre de dois-pra-lá, dois-pra-cá) */
  private startChoteMusic() {
    const bpm = 114;
    const stepTimeMs = (60 / bpm / 4) * 1000;

    const choteBass = [98.0, 146.83, 110.0, 164.81]; // G, D, A, E

    this.musicInterval = window.setInterval(() => {
      if (this.isMuted || !this.isMusicEnabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const step16 = this.beatCount % 16;
      const bar = Math.floor(this.beatCount / 16);

      // Baixo no tempo forte 1 e 3
      if (step16 === 0 || step16 === 8) {
        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bOsc.type = 'triangle';
        bOsc.frequency.setValueAtTime(choteBass[bar % choteBass.length], now);
        bGain.gain.setValueAtTime(0.07, now);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        bOsc.connect(bGain);
        bGain.connect(this.ctx.destination);
        bOsc.start(now);
        bOsc.stop(now + 0.22);
      }

      // Repique sincopado de gaita nos passos 4 e 12
      if (step16 === 4 || step16 === 12) {
        const choteChords = [392, 493.88, 587.33];
        choteChords.forEach((freq) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.035, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.12);
        });
      }

      // Batida de pé de bota gaúcha no assoalho
      if (step16 === 0 || step16 === 8) {
        const stomp = this.ctx.createOscillator();
        const sGain = this.ctx.createGain();
        stomp.type = 'triangle';
        stomp.frequency.setValueAtTime(120, now);
        stomp.frequency.exponentialRampToValueAtTime(50, now + 0.1);
        sGain.gain.setValueAtTime(0.06, now);
        sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        stomp.connect(sGain);
        sGain.connect(this.ctx.destination);
        stomp.start(now);
        stomp.stop(now + 0.1);
      }

      this.beatCount++;
    }, stepTimeMs);
  }

  /** Ritmo 4: SINTETIZADOR RETRÔ GÓTICO (132 BPM, Darkwave clássico) */
  private startRetroGothicMusic() {
    const bpm = 132;
    const stepTimeMs = (60 / bpm / 4) * 1000;

    const bassline = [110, 110, 130.81, 110, 98, 98, 110, 123.47];
    const arpeggio = [220, 261.63, 329.63, 440, 392, 329.63, 261.63, 196];

    this.musicInterval = window.setInterval(() => {
      if (this.isMuted || !this.isMusicEnabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const step = this.beatCount % 16;

      // Bass note on quarter notes
      if (step % 4 === 0) {
        const bassFreq = bassline[Math.floor(this.beatCount / 4) % bassline.length];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(bassFreq, now);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
      }

      // Synth Arp on every 16th note
      const arpFreq = arpeggio[this.beatCount % arpeggio.length];
      const arpOsc = this.ctx.createOscillator();
      const arpGain = this.ctx.createGain();
      arpOsc.type = 'triangle';
      arpOsc.frequency.setValueAtTime(arpFreq, now);
      arpGain.gain.setValueAtTime(0.038, now);
      arpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      arpOsc.connect(arpGain);
      arpGain.connect(this.ctx.destination);
      arpOsc.start(now);
      arpOsc.stop(now + 0.1);

      // Hi-hat pulse on off-beats
      if (step % 2 === 1) {
        const hhOsc = this.ctx.createOscillator();
        const hhGain = this.ctx.createGain();
        hhOsc.type = 'square';
        hhOsc.frequency.setValueAtTime(1400, now);
        hhGain.gain.setValueAtTime(0.015, now);
        hhGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
        hhOsc.connect(hhGain);
        hhGain.connect(this.ctx.destination);
        hhOsc.start(now);
        hhOsc.stop(now + 0.04);
      }

      this.beatCount++;
    }, stepTimeMs);
  }
}

export const survivorsAudio = new SurvivorsAudioEngine();
