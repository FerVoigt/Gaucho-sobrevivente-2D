// Dynamic Theme Switcher with Morning, Dusk, and Midnight palettes
// Shifts dynamically based on timeAlive milestones or manual selection

import { GameThemePalette } from '../types/survivors';

export interface ThemeDefinition {
  id: GameThemePalette;
  name: string;
  subtitle: string;
  icon: string;
  timeRange: string;
  milestoneSeconds: number;
  variables: Record<string, string>;
}

export const GAME_THEMES: Record<GameThemePalette, ThemeDefinition> = {
  morning: {
    id: 'morning',
    name: 'Alvorada Campeira',
    subtitle: 'Luz Dourada do Amanhecer nos Pampas',
    icon: '🌅',
    timeRange: '0:00 - 3:00',
    milestoneSeconds: 0,
    variables: {
      '--theme-bg-base': '#0c1412',
      '--theme-surface': '#14231f',
      '--theme-surface-glass': 'rgba(20, 35, 31, 0.88)',
      '--theme-border': '#f59e0b',
      '--theme-border-subtle': 'rgba(245, 158, 11, 0.35)',
      '--theme-accent': '#f59e0b',
      '--theme-accent-glow': 'rgba(245, 158, 11, 0.45)',
      '--theme-text-title': '#fef3c7',
      '--theme-text-body': '#fde68a',
      '--theme-text-muted': '#a7b5af',
      '--theme-badge-bg': 'rgba(180, 83, 9, 0.35)',
      '--theme-hud-gradient': 'linear-gradient(135deg, rgba(20, 35, 31, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
      '--theme-highlight': '#fbbf24',
      '--theme-xp-from': '#10b981',
      '--theme-xp-to': '#f59e0b',
    },
  },
  dusk: {
    id: 'dusk',
    name: 'Entardecer Farroupilha',
    subtitle: 'Viração Rubra e Brasas da Peleia',
    icon: '🌇',
    timeRange: '3:00 - 6:00',
    milestoneSeconds: 180,
    variables: {
      '--theme-bg-base': '#190a12',
      '--theme-surface': '#29121f',
      '--theme-surface-glass': 'rgba(41, 18, 31, 0.88)',
      '--theme-border': '#ea580c',
      '--theme-border-subtle': 'rgba(234, 88, 12, 0.45)',
      '--theme-accent': '#f97316',
      '--theme-accent-glow': 'rgba(234, 88, 12, 0.55)',
      '--theme-text-title': '#ffedd5',
      '--theme-text-body': '#fed7aa',
      '--theme-text-muted': '#cbd5e1',
      '--theme-badge-bg': 'rgba(194, 65, 12, 0.4)',
      '--theme-hud-gradient': 'linear-gradient(135deg, rgba(67, 20, 7, 0.95) 0%, rgba(88, 28, 135, 0.95) 100%)',
      '--theme-highlight': '#fb923c',
      '--theme-xp-from': '#f97316',
      '--theme-xp-to': '#ef4444',
    },
  },
  midnight: {
    id: 'midnight',
    name: 'Meia-Noite das Taipas',
    subtitle: 'Noite Fechada e Vento Minuano Cortante',
    icon: '🌙',
    timeRange: '6:00+',
    milestoneSeconds: 360,
    variables: {
      '--theme-bg-base': '#030712',
      '--theme-surface': '#0f172a',
      '--theme-surface-glass': 'rgba(15, 23, 42, 0.92)',
      '--theme-border': '#0284c7',
      '--theme-border-subtle': 'rgba(56, 189, 248, 0.35)',
      '--theme-accent': '#38bdf8',
      '--theme-accent-glow': 'rgba(56, 189, 248, 0.55)',
      '--theme-text-title': '#f0f9ff',
      '--theme-text-body': '#bae6fd',
      '--theme-text-muted': '#94a3b8',
      '--theme-badge-bg': 'rgba(14, 116, 144, 0.35)',
      '--theme-hud-gradient': 'linear-gradient(135deg, rgba(2, 6, 23, 0.95) 0%, rgba(30, 27, 75, 0.95) 100%)',
      '--theme-highlight': '#7dd3fc',
      '--theme-xp-from': '#0284c7',
      '--theme-xp-to': '#38bdf8',
    },
  },
};

// Calculate active theme based on survival timeAlive milestones
export function getThemeForTimeAlive(timeAlive: number): GameThemePalette {
  if (timeAlive < 180) {
    return 'morning';
  } else if (timeAlive < 360) {
    return 'dusk';
  } else {
    return 'midnight';
  }
}

// Inject CSS variables dynamically into document root (:root)
export function applyGameTheme(paletteId: GameThemePalette): void {
  const theme = GAME_THEMES[paletteId] || GAME_THEMES.morning;
  const root = document.documentElement;

  // Apply each CSS variable
  Object.entries(theme.variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  // Set data-theme attribute on root for clean selector targets if needed
  root.setAttribute('data-game-theme', paletteId);
}
