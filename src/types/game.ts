export type HeroId = 'mage' | 'pumpkin';

export type GamePhase = 'title' | 'playing' | 'levelup' | 'paused' | 'gameover';

export type AimMode = 'cursor' | 'auto';

export type MovementStance = 'free' | 'bastion';

export type EnemyType = 'scout' | 'warrior' | 'wraith' | 'necromancer' | 'colossus';

export type RelicId =
  | 'split_prism'
  | 'solar_lens'
  | 'celestial_cadence'
  | 'piercing_ray'
  | 'soul_magnet'
  | 'guardian_orbs'
  | 'mist_boots'
  | 'blessed_sanctuary'
  | 'ricochet_shards'
  | 'astral_lightning';

export interface HeroDefinition {
  id: HeroId;
  name: string;
  title: string;
  weaponName: string;
  weaponDesc: string;
  passiveName: string;
  passiveDesc: string;
  primaryColor: string;
  secondaryColor: string;
  glowRgba: string;
  baseStats: {
    maxHp: number;
    moveSpeed: number;
    fireRate: number; // shots per second
    damage: number;
    projectileSpeed: number;
    projectileRadius: number;
    pierce: number;
    splashRadius: number;
    pickupRadius: number;
    critChance: number;
  };
}

export interface RelicDefinition {
  id: RelicId;
  name: string;
  description: string;
  rarity: 'Commune' | 'Rare' | 'Légendaire';
  accent: 'cyan' | 'gold' | 'violet';
  maxLevel: number;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  level: number;
  xp: number;
  xpToNext: number;
  aimAngle: number;
  inSanctuary: boolean;
  sanctuaryCharge: number; // 0 to 1
  invulnerableTimer: number;
  novaCooldown: number;
  novaMaxCooldown: number;
  fireCooldown: number;
  lightningCooldown: number;
  orbitAngle: number;
  // Computed stats
  moveSpeed: number;
  fireRate: number;
  damage: number;
  projectileSpeed: number;
  projectileRadius: number;
  projectileCount: number;
  pierce: number;
  ricochet: number;
  splashRadius: number;
  pickupRadius: number;
  xpMultiplier: number;
  critChance: number;
  guardianOrbsCount: number;
  lightningLevel: number;
  sanctuaryRegen: number;
}

export interface Enemy {
  id: number;
  type: EnemyType;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  speed: number;
  radius: number;
  damage: number;
  xpValue: number;
  scoreValue: number;
  hitFlashTimer: number;
  walkPhase: number;
  shootTimer: number;
  isElite: boolean;
  isBoss: boolean;
  burnTimer: number;
  burnDps: number;
}

export interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: string;
  secondaryColor: string;
  heroId: HeroId;
  pierceLeft: number;
  ricochetLeft: number;
  splashRadius: number;
  isCrit: boolean;
  hitEnemyIds: Set<number>;
  life: number;
  maxLife: number;
  trail: Array<{ x: number; y: number }>;
}

export interface EnemyProjectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  life: number;
}

export interface SoulOrb {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  xp: number;
  tier: 'small' | 'medium' | 'large';
  magnetized: boolean;
  pulsePhase: number;
  age: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'spark' | 'bone' | 'ring' | 'smoke' | 'lightning';
  endRadius?: number;
  targetX?: number;
  targetY?: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  isCrit?: boolean;
}

export interface Tombstone {
  x: number;
  y: number;
  width: number;
  height: number;
  variant: 'cross' | 'arch' | 'obelisk' | 'slab';
  rotation: number;
  hasMoss: boolean;
  runeGlow: number;
}

export interface AmbientFirefly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  phase: number;
}

export interface RunStats {
  wave: number;
  waveProgress: number;
  waveTotalEnemies: number;
  waveRemainingEnemies: number;
  kills: number;
  score: number;
  elapsedSeconds: number;
  level: number;
  bossActive: Enemy | null;
}
