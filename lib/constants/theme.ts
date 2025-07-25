export const THEME_COLORS = {
  pink: {
    primary: '#F4BFEA',
    secondary: '#F4BFEA',
    accent: '#F4BFEA',
    bg: '#FFE5FA',
    text: '#7F4073'
  },
  cyan: {
    primary: '#80E3F5',
    secondary: '#80E3F5',
    accent: '#80E3F5',
    bg: '#D7F9FF',
    text: '#54848D'
  },
  yellow: {
    primary: '#FFE1B3',
    secondary: '#FFE1B3',
    accent: '#FFE1B3',
    bg: '#FFF7D7',
    text: '#CF8D4B'
  },
  green: {
    primary: '#A6E19E',
    secondary: '#A6E19E',
    accent: '#A6E19E',
    bg: '#D1FFCB',
    text: '#60BA54'
  },
  purple: {
    primary: '#D8C0FF',
    secondary: '#D8C0FF',
    accent: '#D8C0FF',
    bg: '#EADDFF',
    text: '#A180D7'
  }
} as const;

export type ThemeColor = keyof typeof THEME_COLORS;

export function getColorTheme(color: ThemeColor) {
  return THEME_COLORS[color];
}

export const AVAILABLE_COLORS = Object.keys(THEME_COLORS) as ThemeColor[];

export const COLOR_THEMES = AVAILABLE_COLORS.map(color => ({
  name: color,
  colors: THEME_COLORS[color]
}));