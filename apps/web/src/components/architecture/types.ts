export interface ColorScheme {
  fill: string;
  stroke: string;
  text: string;
}

export interface ThemeColors {
  [key: string]: ColorScheme;
}

export interface DiagramDimensions {
  width: number;
  height: number;
}

// Color palettes for different diagram types
export const lightColors = {
  primary: { fill: '#e3f2fd', stroke: '#1976d2', text: '#0d47a1' },
  secondary: { fill: '#f3e5f5', stroke: '#7b1fa2', text: '#4a148c' },
  success: { fill: '#e8f5e9', stroke: '#388e3c', text: '#1b5e20' },
  warning: { fill: '#fff3e0', stroke: '#f57c00', text: '#e65100' },
  danger: { fill: '#fce4ec', stroke: '#c2185b', text: '#880e4f' },
  neutral: { fill: '#f5f5f5', stroke: '#616161', text: '#212121' },
  info: { fill: '#e0f7fa', stroke: '#00838f', text: '#006064' },
  code: { fill: '#263238', stroke: '#546e7a', text: '#eceff1' },
};

export const darkColors = {
  primary: { fill: '#1e3a5f', stroke: '#64b5f6', text: '#90caf9' },
  secondary: { fill: '#3a1f5c', stroke: '#ba68c8', text: '#ce93d8' },
  success: { fill: '#1b4332', stroke: '#66bb6a', text: '#a5d6a7' },
  warning: { fill: '#4a3000', stroke: '#ffb74d', text: '#ffe0b2' },
  danger: { fill: '#4a1f35', stroke: '#f06292', text: '#f48fb1' },
  neutral: { fill: '#2d2d2d', stroke: '#9e9e9e', text: '#e0e0e0' },
  info: { fill: '#004d5a', stroke: '#4dd0e1', text: '#b2ebf2' },
  code: { fill: '#1a1a2e', stroke: '#4fc3f7', text: '#e0e0e0' },
};
