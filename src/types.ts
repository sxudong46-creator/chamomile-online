export type ThemeId = 'meadow' | 'indigo' | 'sunset' | 'moonrise';

export interface ThemeSettings {
  id: ThemeId;
  label: string;
  skyGradientStart: string;
  skyGradientEnd: string;
  groundColor: string;
  fieldGlow: string;
  ambientLight: number; // 0 (dark) to 1 (bright)
  petalColor: string;
  centerColor: string;
  accentGlow: string;
}

export interface Flower {
  id: number;
  x: number;
  y: number;
  size: number;
  stemLength: number;
  angle: number;             // Current stem deflection angle
  targetAngle: number;       // Target bend due to wind/rain
  angularVel: number;        // Angular velocity for spring physics
  rotation: number;          // Base orientation of flower head
  petalCount: number;
  swaySpeed: number;         // Individual natural oscillation rate
  swayPhase: number;         // Offset for natural wind sways
  dripTimer: number;         // Rain accumulation before heavy drop falls
  dripsAccumulated: number;  // Visual representation of dew on center disk
  opacity: number;           // For fade-in effects on density change
}

export interface Raindrop {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  alpha: number;
  isCursorRain: boolean;      // Born from cursor or ambient
}

export interface Splash {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  maxLife: number;
  alpha: number;
}

export interface Ripple {
  id: number;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  strength: number;          // Waves height/opacity index
  speed: number;             // Expansion rate
  life: number;
  maxLife: number;
}

export interface Settings {
  rainMode: 'hover' | 'always' | 'none';
  intensity: number;      // 0 to 100
  windStrength: number;   // 0 to 100
  windAngle: number;      // Angle in degrees (-180 to 180)
  soundEnabled: boolean;
  soundVolume: number;    // 0 to 100
  flowerDensity: 'sparse' | 'normal' | 'lush';
  theme: ThemeId;
}
