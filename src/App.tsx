import { InfoModal } from './components/InfoModal';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AimMode,
  AmbientFirefly,
  Enemy,
  EnemyProjectile,
  EnemyType,
  FloatingText,
  GamePhase,
  HeroId,
  Particle,
  PlayerState,
  Projectile,
  RelicDefinition,
  RelicId,
  RunStats,
  SoulOrb,
  Tombstone,
} from './types/game';
import { HEROES, RELICS } from './data/relics';
import {
  generateFireflies,
  generateTombstones,
  renderGraveyardScene,
  SANCTUARY_RADIUS,
} from './canvas/graveyardRenderer';
import { soundEngine } from './audio/soundEngine';
import { TitleOverlay } from './components/TitleOverlay';
import { GameHud } from './components/GameHud';
import { LevelUpModal } from './components/LevelUpModal';
import { GameOverModal, PauseModal } from './components/EndAndPauseModals';

const INITIAL_RELIC_LEVELS: Record<RelicId, number> = {
  split_prism: 0,
  solar_lens: 0,
  celestial_cadence: 0,
  piercing_ray: 0,
  guardian_orbs: 0,
  ricochet_shards: 0,
  astral_lightning: 0,
  soul_magnet: 0,
  mist_boots: 0,
  blessed_sanctuary: 0,
};

function createInitialPlayer(heroId: HeroId, width: number, height: number): PlayerState {
  const base = HEROES[heroId].baseStats;
  return {
    x: width / 2,
    y: height / 2,
    vx: 0,
    vy: 0,
    hp: base.maxHp,
    maxHp: base.maxHp,
    level: 1,
    xp: 0,
    xpToNext: 35,
    aimAngle: 0,
    inSanctuary: true,
    sanctuaryCharge: 1,
    invulnerableTimer: 0,
    novaCooldown: 0,
    novaMaxCooldown: 9.0,
    fireCooldown: 0,
    lightningCooldown: 2.0,
    orbitAngle: 0,
    moveSpeed: base.moveSpeed,
    fireRate: base.fireRate,
    damage: base.damage,
    projectileSpeed: base.projectileSpeed,
    projectileRadius: base.projectileRadius,
    projectileCount: 1,
    pierce: base.pierce,
    ricochet: 0,
    splashRadius: base.splashRadius,
    pickupRadius: base.pickupRadius,
    xpMultiplier: 1,
    critChance: base.critChance,
    guardianOrbsCount: 0,
    lightningLevel: 0,
    sanctuaryRegen: heroId === 'pumpkin' ? 3.4 : 2.2,
  };
}

export function App() {
  const [showInfo, setShowInfo] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // React UI state
  const [selectedHero, setSelectedHero] = useState<HeroId>('mage');
  const [gamePhase, setGamePhase] = useState<GamePhase>('title');
  const [aimMode, setAimMode] = useState<AimMode>('cursor');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [relicLevels, setRelicLevels] = useState<Record<RelicId, number>>({
    ...INITIAL_RELIC_LEVELS,
  });
  const [levelUpChoices, setLevelUpChoices] = useState<RelicDefinition[]>([]);
  const [waveBanner, setWaveBanner] = useState<{ title: string; subtitle: string } | null>(null);
  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('cimetiere_best_score') || 0);
    } catch {
      return 0;
    }
  });
  const [bestWave, setBestWave] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('cimetiere_best_wave') || 0);
    } catch {
      return 0;
    }
  });
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);

  // HUD Snapshot State (updated at ~15fps to avoid excessive React re-renders while canvas runs at 60fps)
  const [hudPlayer, setHudPlayer] = useState<PlayerState>(() =>
    createInitialPlayer('mage', window.innerWidth, window.innerHeight)
  );
  const [hudStats, setHudStats] = useState<RunStats>({
    wave: 1,
    waveProgress: 0,
    waveTotalEnemies: 12,
    waveRemainingEnemies: 12,
    kills: 0,
    score: 0,
    elapsedSeconds: 0,
    level: 1,
    bossActive: null,
  });

  // Mutable Game Engine Refs for 60fps loop
  const phaseRef = useRef<GamePhase>('title');
  const heroIdRef = useRef<HeroId>('mage');
  const aimModeRef = useRef<AimMode>('cursor');
  const relicLevelsRef = useRef<Record<RelicId, number>>({ ...INITIAL_RELIC_LEVELS });

  const playerRef = useRef<PlayerState>(
    createInitialPlayer('mage', window.innerWidth, window.innerHeight)
  );
  const enemiesRef = useRef<Enemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const enemyProjectilesRef = useRef<EnemyProjectile[]>([]);
  const soulOrbsRef = useRef<SoulOrb[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const tombstonesRef = useRef<Tombstone[]>([]);
  const firefliesRef = useRef<AmbientFirefly[]>([]);

  const keysRef = useRef<Set<string>>(new Set());
  const mousePosRef = useRef<{ x: number; y: number }>({
    x: window.innerWidth / 2 + 120,
    y: window.innerHeight / 2,
  });
  const mouseDownRef = useRef<boolean>(false);

  // Wave & Spawner Refs
  const nextEntityIdRef = useRef<number>(1);
  const waveRef = useRef<number>(1);
  const waveToSpawnRef = useRef<number>(12);
  const waveTotalRef = useRef<number>(12);
  const spawnTimerRef = useRef<number>(0);
  const killsRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);
  const bannerTimerRef = useRef<number>(0);

  // Recompute player stats whenever relics or hero changes
  const recomputePlayerStats = useCallback((p: PlayerState, hId: HeroId, rLevels: Record<RelicId, number>) => {
    const base = HEROES[hId].baseStats;
    p.moveSpeed = base.moveSpeed * (1 + rLevels.mist_boots * 0.18);
    p.fireRate = base.fireRate * (1 + rLevels.celestial_cadence * 0.22);
    p.damage = Math.round(base.damage * (1 + rLevels.solar_lens * 0.25));
    p.projectileSpeed = base.projectileSpeed * (1 + rLevels.piercing_ray * 0.12);
    p.projectileRadius = base.projectileRadius * (1 + rLevels.solar_lens * 0.12);
    p.projectileCount = 1 + rLevels.split_prism;
    p.pierce = base.pierce + rLevels.piercing_ray;
    p.ricochet = rLevels.ricochet_shards;
    p.splashRadius =
      base.splashRadius > 0
        ? base.splashRadius * (1 + rLevels.solar_lens * 0.18)
        : rLevels.solar_lens >= 2
        ? 36 + rLevels.solar_lens * 8
        : 0;
    p.pickupRadius = base.pickupRadius * (1 + rLevels.soul_magnet * 0.45);
    p.xpMultiplier = 1 + rLevels.soul_magnet * 0.15;
    p.critChance = Math.min(0.65, base.critChance + rLevels.solar_lens * 0.04);
    p.guardianOrbsCount = rLevels.guardian_orbs;
    p.lightningLevel = rLevels.astral_lightning;
    p.novaMaxCooldown = Math.max(3.8, 9.0 - rLevels.mist_boots * 1.1);
    p.sanctuaryRegen = (hId === 'pumpkin' ? 3.4 : 2.2) + rLevels.blessed_sanctuary * 1.6;
  }, []);

  // Spawn floating combat text
  const addFloatingText = useCallback(
    (x: number, y: number, text: string, color: string, size = 14, isCrit = false) => {
      if (floatingTextsRef.current.length > 45) {
        floatingTextsRef.current.shift();
      }
      floatingTextsRef.current.push({
        id: nextEntityIdRef.current++,
        x: x + (Math.random() - 0.5) * 14,
        y,
        vy: isCrit ? -48 : -34,
        text,
        color,
        size: isCrit ? size + 3 : size,
        life: isCrit ? 0.85 : 0.65,
        maxLife: isCrit ? 0.85 : 0.65,
        isCrit,
      });
    },
    []
  );

  // Trigger Active Nova Lumineuse shockwave
  const triggerNova = useCallback(() => {
    if (phaseRef.current !== 'playing') return;
    const p = playerRef.current;
    if (p.novaCooldown > 0) return;

    p.novaCooldown = p.novaMaxCooldown;
    soundEngine.playNova();

    const heroColor = HEROES[heroIdRef.current].primaryColor;
    const novaRadius = 260;

    // Expanding luminous shockwave rings
    particlesRef.current.push({
      x: p.x,
      y: p.y,
      vx: 0,
      vy: 0,
      size: 16,
      endRadius: novaRadius,
      color: heroColor,
      alpha: 0.95,
      life: 0.48,
      maxLife: 0.48,
      type: 'ring',
    });
    particlesRef.current.push({
      x: p.x,
      y: p.y,
      vx: 0,
      vy: 0,
      size: 8,
      endRadius: novaRadius * 0.78,
      color: '#FFB800',
      alpha: 0.8,
      life: 0.38,
      maxLife: 0.38,
      type: 'ring',
    });

    // Clear enemy dark projectiles within range
    enemyProjectilesRef.current = enemyProjectilesRef.current.filter((ep) => {
      const d = Math.hypot(ep.x - p.x, ep.y - p.y);
      return d > novaRadius;
    });

    // Damage & Knockback all skeletons within Nova radius
    const novaDamage = Math.round(p.damage * 2.4);
    for (const enemy of enemiesRef.current) {
      const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
      if (dist <= novaRadius + enemy.radius) {
        enemy.hp -= novaDamage;
        enemy.hitFlashTimer = 0.12;
        const angle = Math.atan2(enemy.y - p.y, enemy.x - p.x);
        const knock = enemy.isBoss ? 32 : 95;
        enemy.x += Math.cos(angle) * knock;
        enemy.y += Math.sin(angle) * knock;
        addFloatingText(enemy.x, enemy.y - enemy.radius, `${novaDamage}`, '#FFB800', 15, true);
      }
    }

    addFloatingText(p.x, p.y - 28, 'NOVA SOLAIRE !', heroColor, 15, true);
  }, [addFloatingText]);

  // Setup a wave of skeletons
  const startWave = useCallback((waveNum: number, isDemo = false) => {
    waveRef.current = waveNum;
    const total = isDemo ? 8 : Math.round(10 + waveNum * 5.5);
    waveTotalRef.current = total;
    waveToSpawnRef.current = total;
    spawnTimerRef.current = 0.2;

    if (!isDemo) {
      const isBossWave = waveNum % 3 === 0;
      soundEngine.playWaveBell(isBossWave);
      setWaveBanner({
        title: isBossWave ? `Vague ${waveNum}  :  Colosse du Caveau` : `Vague ${waveNum}`,
        subtitle: isBossWave
          ? 'Un gardien ossuaire géant émerge des brumes !'
          : `${total} squelettes approchent du Sanctuaire`,
      });
      bannerTimerRef.current = 3.0;
    }
  }, []);

  // Spawn an individual skeleton from the graveyard gates or perimeter
  const spawnEnemy = useCallback((width: number, height: number, waveNum: number, forceBoss = false) => {
    const cx = width / 2;
    const cy = height / 2;
    const pad = 28;

    // 70% chance to emerge from one of the 4 cardinal graveyard gates, 30% perimeter
    let x = pad;
    let y = pad;
    if (Math.random() < 0.72) {
      const gate = Math.floor(Math.random() * 4);
      const spread = (Math.random() - 0.5) * 70;
      if (gate === 0) {
        x = cx + spread;
        y = pad;
      } else if (gate === 1) {
        x = cx + spread;
        y = height - pad;
      } else if (gate === 2) {
        x = pad;
        y = cy + spread;
      } else {
        x = width - pad;
        y = cy + spread;
      }
    } else {
      const edge = Math.floor(Math.random() * 4);
      if (edge === 0) {
        x = Math.random() * width;
        y = pad;
      } else if (edge === 1) {
        x = Math.random() * width;
        y = height - pad;
      } else if (edge === 2) {
        x = pad;
        y = Math.random() * height;
      } else {
        x = width - pad;
        y = Math.random() * height;
      }
    }

    const hpScale = 1 + (waveNum - 1) * 0.24;
    const speedScale = 1 + Math.min(0.65, (waveNum - 1) * 0.04);

    let type: EnemyType = 'scout';
    let name = 'Squelette Éclaireur';
    let hp = Math.round(32 * hpScale);
    let speed = 78 * speedScale;
    let radius = 13;
    let damage = 10 + Math.floor(waveNum * 1.5);
    let xpValue = 12;
    let scoreValue = 25;
    let isElite = false;
    let isBoss = false;

    if (forceBoss) {
      type = 'colossus';
      name = 'Colosse du Caveau';
      hp = Math.round(420 * hpScale);
      speed = 54 * speedScale;
      radius = 26;
      damage = 24 + waveNum * 2;
      xpValue = 95;
      scoreValue = 350;
      isElite = true;
      isBoss = true;
    } else {
      const roll = Math.random();
      if (waveNum >= 4 && roll < 0.16) {
        type = 'necromancer';
        name = "Nécromant d'Ombre";
        hp = Math.round(62 * hpScale);
        speed = 58 * speedScale;
        radius = 15;
        damage = 14 + waveNum * 1.5;
        xpValue = 26;
        scoreValue = 65;
        isElite = true;
      } else if (waveNum >= 3 && roll < 0.36) {
        type = 'wraith';
        name = 'Crâne Spectral';
        hp = Math.round(44 * hpScale);
        speed = 98 * speedScale;
        radius = 13;
        damage = 12 + waveNum * 1.5;
        xpValue = 18;
        scoreValue = 45;
      } else if (waveNum >= 2 && roll < 0.62) {
        type = 'warrior';
        name = 'Guerrier Ossuaire';
        hp = Math.round(74 * hpScale);
        speed = 62 * speedScale;
        radius = 16;
        damage = 15 + waveNum * 1.6;
        xpValue = 20;
        scoreValue = 50;
        isElite = Math.random() < 0.22;
      }
    }

    enemiesRef.current.push({
      id: nextEntityIdRef.current++,
      type,
      name,
      x,
      y,
      vx: 0,
      vy: 0,
      hp,
      maxHp: hp,
      speed,
      radius,
      damage,
      xpValue,
      scoreValue,
      hitFlashTimer: 0,
      walkPhase: Math.random() * Math.PI * 2,
      shootTimer: 2.2 + Math.random() * 1.5,
      isElite,
      isBoss,
      burnTimer: 0,
      burnDps: 0,
    });
  }, []);

  // Roll 3 distinct relic choices for Level-Up Modal
  const triggerLevelUpModal = useCallback(() => {
    soundEngine.playLevelUp();
    const currentLevels = relicLevelsRef.current;
    const available = RELICS.filter((r) => (currentLevels[r.id] || 0) < r.maxLevel);
    const pool = available.length >= 3 ? [...available] : [...RELICS];

    // Shuffle and pick 3
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    setLevelUpChoices(pool.slice(0, 3));
    phaseRef.current = 'levelup';
    setGamePhase('levelup');
  }, []);

  // Start or Restart a Full Game Run
  const startNewRun = useCallback(
    (heroId: HeroId = selectedHero) => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      heroIdRef.current = heroId;
      const freshRelics = { ...INITIAL_RELIC_LEVELS };
      relicLevelsRef.current = freshRelics;
      setRelicLevels(freshRelics);

      const newPlayer = createInitialPlayer(heroId, width, height);
      recomputePlayerStats(newPlayer, heroId, freshRelics);
      playerRef.current = newPlayer;

      enemiesRef.current = [];
      projectilesRef.current = [];
      enemyProjectilesRef.current = [];
      soulOrbsRef.current = [];
      particlesRef.current = [];
      floatingTextsRef.current = [];
      tombstonesRef.current = generateTombstones(width, height);

      killsRef.current = 0;
      scoreRef.current = 0;
      elapsedRef.current = 0;
      setIsNewRecord(false);

      phaseRef.current = 'playing';
      setGamePhase('playing');
      startWave(1, false);
    },
    [recomputePlayerStats, selectedHero, startWave]
  );

  // Select a Relic Card on Level Up
  const handleSelectRelic = useCallback(
    (relicId: RelicId) => {
      soundEngine.playRelicSelect();
      const updated = {
        ...relicLevelsRef.current,
        [relicId]: (relicLevelsRef.current[relicId] || 0) + 1,
      };
      relicLevelsRef.current = updated;
      setRelicLevels(updated);

      const p = playerRef.current;
      if (relicId === 'blessed_sanctuary') {
        p.maxHp += 25;
        p.hp = Math.min(p.maxHp, p.hp + 40);
        addFloatingText(p.x, p.y - 24, '+40 PV !', '#06D6A0', 15, true);
      }

      recomputePlayerStats(p, heroIdRef.current, updated);

      // Luminous burst ring on resume
      particlesRef.current.push({
        x: p.x,
        y: p.y,
        vx: 0,
        vy: 0,
        size: 10,
        endRadius: 150,
        color: '#FFB800',
        alpha: 0.9,
        life: 0.4,
        maxLife: 0.4,
        type: 'ring',
      });

      phaseRef.current = 'playing';
      setGamePhase('playing');
    },
    [addFloatingText, recomputePlayerStats]
  );

  // Keyboard & Mouse Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      keysRef.current.add(code);

      if (code === 'Space') {
        if (phaseRef.current === 'playing') {
          e.preventDefault();
          triggerNova();
        }
      } else if (code === 'KeyP' || code === 'Escape') {
        if (phaseRef.current === 'playing') {
          phaseRef.current = 'paused';
          setGamePhase('paused');
        } else if (phaseRef.current === 'paused') {
          phaseRef.current = 'playing';
          setGamePhase('playing');
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [triggerNova]);

  // Keep heroIdRef synced when user switches hero on Title Overlay
  useEffect(() => {
    heroIdRef.current = selectedHero;
    if (phaseRef.current === 'title') {
      const p = createInitialPlayer(selectedHero, window.innerWidth, window.innerHeight);
      playerRef.current = p;
    }
  }, [selectedHero]);

  useEffect(() => {
    aimModeRef.current = aimMode;
  }, [aimMode]);

  // Main 60FPS Canvas Animation & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      tombstonesRef.current = generateTombstones(canvas.width, canvas.height);
      firefliesRef.current = generateFireflies(canvas.width, canvas.height, 36);
      if (phaseRef.current === 'title') {
        playerRef.current.x = canvas.width / 2;
        playerRef.current.y = canvas.height / 2;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Seed background demo wave for Title Screen
    startWave(1, true);

    let animationFrameId: number;
    let lastTime = performance.now();
    let hudSyncTimer = 0;

    const updateEnemyDeath = (enemy: Enemy) => {
      soundEngine.playKill(enemy.isElite || enemy.isBoss);
      killsRef.current += 1;
      scoreRef.current += enemy.scoreValue;

      // Bone-shatter particles + luminous soul sparks
      const shardCount = enemy.isBoss ? 24 : 9;
      for (let i = 0; i < shardCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 40 + Math.random() * 130;
        particlesRef.current.push({
          x: enemy.x,
          y: enemy.y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          size: 3 + Math.random() * 2.5,
          color: i % 2 === 0 ? '#E2E8F0' : HEROES[heroIdRef.current].primaryColor,
          alpha: 0.95,
          life: 0.35 + Math.random() * 0.25,
          maxLife: 0.6,
          type: i % 2 === 0 ? 'bone' : 'spark',
        });
      }

      // Drop Soul-Orbs (XP Gems)
      const orbDrops = enemy.isBoss ? 8 : enemy.isElite ? 2 : 1;
      for (let i = 0; i < orbDrops; i++) {
        const jitterX = orbDrops > 1 ? (Math.random() - 0.5) * 32 : 0;
        const jitterY = orbDrops > 1 ? (Math.random() - 0.5) * 32 : 0;
        soulOrbsRef.current.push({
          id: nextEntityIdRef.current++,
          x: enemy.x + jitterX,
          y: enemy.y + jitterY,
          vx: jitterX * 1.5,
          vy: jitterY * 1.5,
          xp: Math.round(enemy.xpValue / orbDrops),
          tier: enemy.isBoss ? 'large' : enemy.isElite ? 'medium' : 'small',
          magnetized: phaseRef.current === 'title',
          pulsePhase: Math.random() * Math.PI * 2,
          age: 0,
        });
      }
    };

    const stepSimulation = (dt: number, nowSec: number) => {
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;
      const isTitle = phaseRef.current === 'title';
      const p = playerRef.current;
      const heroDef = HEROES[heroIdRef.current];

      // Update ambient fireflies
      for (const fly of firefliesRef.current) {
        fly.x += fly.vx * dt;
        fly.y += fly.vy * dt;
        if (fly.x < 0) fly.x = width;
        if (fly.x > width) fly.x = 0;
        if (fly.y < 0) fly.y = height;
        if (fly.y > height) fly.y = 0;
      }

      // Update Wave Announcement Banner timer
      if (bannerTimerRef.current > 0) {
        bannerTimerRef.current -= dt;
        if (bannerTimerRef.current <= 0) {
          setWaveBanner(null);
        }
      }

      // If paused or in levelup or gameover, only drift ambient particles
      if (phaseRef.current !== 'playing' && phaseRef.current !== 'title') {
        return;
      }

      if (!isTitle) {
        elapsedRef.current += dt;
      }

      // 1. Player Movement (ZQSD / WASD / Arrow Keys)
      let moveX = 0;
      let moveY = 0;
      if (!isTitle) {
        const keys = keysRef.current;
        if (keys.has('KeyW') || keys.has('KeyZ') || keys.has('ArrowUp')) moveY -= 1;
        if (keys.has('KeyS') || keys.has('ArrowDown')) moveY += 1;
        if (keys.has('KeyA') || keys.has('KeyQ') || keys.has('ArrowLeft')) moveX -= 1;
        if (keys.has('KeyD') || keys.has('ArrowRight')) moveX += 1;
      }

      if (moveX !== 0 || moveY !== 0) {
        const len = Math.hypot(moveX, moveY);
        p.vx = (moveX / len) * p.moveSpeed;
        p.vy = (moveY / len) * p.moveSpeed;
      } else {
        p.vx *= 0.8;
        p.vy *= 0.8;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Keep inside graveyard iron fence
      const margin = 42;
      p.x = Math.max(margin, Math.min(width - margin, p.x));
      p.y = Math.max(margin, Math.min(height - margin, p.y));

      // Gentle collision push out of Tombstones
      for (const stone of tombstonesRef.current) {
        const dx = p.x - stone.x;
        const dy = p.y - stone.y;
        const dist = Math.hypot(dx, dy);
        const minDist = 26;
        if (dist < minDist && dist > 0.01) {
          const push = minDist - dist;
          p.x += (dx / dist) * push;
          p.y += (dy / dist) * push;
        }
      }

      // Check if Player is standing inside the Central Sanctuary of Light
      const distFromCenter = Math.hypot(p.x - cx, p.y - cy);
      p.inSanctuary = distFromCenter <= SANCTUARY_RADIUS;

      if (p.inSanctuary && p.hp < p.maxHp) {
        p.hp = Math.min(p.maxHp, p.hp + p.sanctuaryRegen * dt);
      }

      if (p.invulnerableTimer > 0) p.invulnerableTimer -= dt;
      if (p.novaCooldown > 0) p.novaCooldown = Math.max(0, p.novaCooldown - dt);
      p.orbitAngle += dt * 3.1;

      // 2. Aiming & Firing Projectiles of Light
      let nearestEnemy: Enemy | null = null;
      let nearestDist = Infinity;
      for (const e of enemiesRef.current) {
        const d = Math.hypot(e.x - p.x, e.y - p.y);
        if (d < nearestDist) {
          nearestDist = d;
          nearestEnemy = e;
        }
      }

      if (isTitle || aimModeRef.current === 'auto') {
        if (nearestEnemy) {
          p.aimAngle = Math.atan2(nearestEnemy.y - p.y, nearestEnemy.x - p.x);
        } else {
          p.aimAngle += dt * 0.8;
        }
      } else {
        p.aimAngle = Math.atan2(
          mousePosRef.current.y - p.y,
          mousePosRef.current.x - p.x
        );
      }

      // Fire Cooldown (Sanctuary grants +18% fire rate bonus!)
      const effectiveFireRate = p.fireRate * (p.inSanctuary ? 1.18 : 1.0);
      p.fireCooldown -= dt;

      const shouldFire =
        p.fireCooldown <= 0 &&
        (aimModeRef.current === 'cursor' || nearestEnemy !== null || mouseDownRef.current);

      if (shouldFire) {
        p.fireCooldown = 1 / effectiveFireRate;
        if (!isTitle) {
          soundEngine.playShoot(heroIdRef.current);
        }

        const count = p.projectileCount;
        const spreadArc = Math.min(0.65, (count - 1) * 0.14);

        for (let i = 0; i < count; i++) {
          const offsetAngle =
            count === 1 ? 0 : -spreadArc / 2 + (i / (count - 1)) * spreadArc;
          const shotAngle = p.aimAngle + offsetAngle;
          const isCrit = Math.random() < p.critChance;

          projectilesRef.current.push({
            id: nextEntityIdRef.current++,
            x: p.x + Math.cos(shotAngle) * 18,
            y: p.y + Math.sin(shotAngle) * 18,
            vx: Math.cos(shotAngle) * p.projectileSpeed,
            vy: Math.sin(shotAngle) * p.projectileSpeed,
            radius: p.projectileRadius * (isCrit ? 1.25 : 1),
            damage: Math.round(p.damage * (isCrit ? 1.65 : 1)),
            color: heroDef.primaryColor,
            secondaryColor: heroDef.secondaryColor,
            heroId: heroIdRef.current,
            pierceLeft: p.pierce,
            ricochetLeft: p.ricochet,
            splashRadius: p.splashRadius,
            isCrit,
            hitEnemyIds: new Set(),
            life: 1.5,
            maxLife: 1.5,
            trail: [],
          });
        }
      }

      // 3. Periodic Astral Lightning Relic Strike
      if (p.lightningLevel > 0 && enemiesRef.current.length > 0) {
        p.lightningCooldown -= dt;
        if (p.lightningCooldown <= 0) {
          p.lightningCooldown = Math.max(0.85, 2.5 - p.lightningLevel * 0.32);
          const target = enemiesRef.current[Math.floor(Math.random() * enemiesRef.current.length)];
          if (target) {
            const lDmg = Math.round(p.damage * (1.2 + p.lightningLevel * 0.35));
            target.hp -= lDmg;
            target.hitFlashTimer = 0.1;
            soundEngine.playHit(true);
            addFloatingText(target.x, target.y - 16, `⚡ ${lDmg}`, '#38F9D7', 14, true);

            particlesRef.current.push({
              x: p.x,
              y: p.y - 12,
              targetX: target.x,
              targetY: target.y,
              vx: 0,
              vy: 0,
              size: 3,
              color: '#38F9D7',
              alpha: 1,
              life: 0.22,
              maxLife: 0.22,
              type: 'lightning',
            });
            particlesRef.current.push({
              x: target.x,
              y: target.y,
              vx: 0,
              vy: 0,
              size: 6,
              endRadius: 42,
              color: '#38F9D7',
              alpha: 0.85,
              life: 0.26,
              maxLife: 0.26,
              type: 'ring',
            });
          }
        }
      }

      // 4. Wave Spawner Logic
      if (waveToSpawnRef.current > 0) {
        spawnTimerRef.current -= dt;
        if (spawnTimerRef.current <= 0) {
          const isBossSpawn =
            !isTitle &&
            waveRef.current % 3 === 0 &&
            waveToSpawnRef.current === waveTotalRef.current;

          spawnEnemy(width, height, waveRef.current, isBossSpawn);
          waveToSpawnRef.current -= 1;

          const baseInterval = isTitle
            ? 0.9
            : Math.max(0.24, 1.05 - waveRef.current * 0.065);
          spawnTimerRef.current = baseInterval;
        }
      } else if (enemiesRef.current.length === 0) {
        // Wave Purified! Magnetize all remaining Soul-Orbs on map
        for (const orb of soulOrbsRef.current) {
          orb.magnetized = true;
        }
        if (isTitle) {
          startWave(1, true);
        } else {
          p.hp = Math.min(p.maxHp, p.hp + 12);
          startWave(waveRef.current + 1, false);
        }
      }

      // 5. Update Projectiles & Collisions with Skeletons
      const activeProjectiles: Projectile[] = [];
      for (const proj of projectilesRef.current) {
        proj.trail.push({ x: proj.x, y: proj.y });
        if (proj.trail.length > 6) proj.trail.shift();

        proj.x += proj.vx * dt;
        proj.y += proj.vy * dt;
        proj.life -= dt;

        if (
          proj.life <= 0 ||
          proj.x < 0 ||
          proj.x > width ||
          proj.y < 0 ||
          proj.y > height
        ) {
          continue;
        }

        // Also allow player projectiles to destroy enemy dark orbs!
        for (let i = enemyProjectilesRef.current.length - 1; i >= 0; i--) {
          const ep = enemyProjectilesRef.current[i];
          if (Math.hypot(proj.x - ep.x, proj.y - ep.y) < proj.radius + ep.radius + 4) {
            enemyProjectilesRef.current.splice(i, 1);
            particlesRef.current.push({
              x: ep.x,
              y: ep.y,
              vx: 0,
              vy: 0,
              size: 4,
              endRadius: 24,
              color: '#9D4EDD',
              alpha: 0.8,
              life: 0.2,
              maxLife: 0.2,
              type: 'ring',
            });
          }
        }

        let consumed = false;
        for (const enemy of enemiesRef.current) {
          if (proj.hitEnemyIds.has(enemy.id)) continue;
          const dist = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);

          if (dist <= proj.radius + enemy.radius) {
            proj.hitEnemyIds.add(enemy.id);
            enemy.hp -= proj.damage;
            enemy.hitFlashTimer = 0.08;

            // Slight knockback
            const kAngle = Math.atan2(proj.vy, proj.vx);
            const kForce = enemy.isBoss ? 3 : 11;
            enemy.x += Math.cos(kAngle) * kForce;
            enemy.y += Math.sin(kAngle) * kForce;

            if (!isTitle) {
              soundEngine.playHit(proj.splashRadius > 0);
              addFloatingText(
                enemy.x,
                enemy.y - enemy.radius,
                `${proj.damage}`,
                proj.isCrit ? '#FFB800' : proj.color,
                13,
                proj.isCrit
              );
            }

            // Solar Splash Explosion (Citrouille Magique or Solar Lens)
            if (proj.splashRadius > 0) {
              particlesRef.current.push({
                x: proj.x,
                y: proj.y,
                vx: 0,
                vy: 0,
                size: 8,
                endRadius: proj.splashRadius,
                color: '#FFB800',
                alpha: 0.85,
                life: 0.28,
                maxLife: 0.28,
                type: 'ring',
              });

              const splashDmg = Math.round(proj.damage * 0.55);
              for (const other of enemiesRef.current) {
                if (other.id === enemy.id) continue;
                const sd = Math.hypot(other.x - proj.x, other.y - proj.y);
                if (sd <= proj.splashRadius + other.radius) {
                  other.hp -= splashDmg;
                  other.hitFlashTimer = 0.06;
                  other.burnTimer = 2.0;
                  other.burnDps = Math.max(other.burnDps, proj.damage * 0.22);
                }
              }
            }

            // Impact Sparks
            for (let s = 0; s < 5; s++) {
              const sa = Math.random() * Math.PI * 2;
              const ss = 35 + Math.random() * 80;
              particlesRef.current.push({
                x: proj.x,
                y: proj.y,
                vx: Math.cos(sa) * ss,
                vy: Math.sin(sa) * ss,
                size: 2.5,
                color: proj.color,
                alpha: 0.9,
                life: 0.22,
                maxLife: 0.22,
                type: 'spark',
              });
            }

            // Check Ricochet or Pierce
            if (proj.ricochetLeft > 0) {
              proj.ricochetLeft -= 1;
              // Find closest unhit enemy to bounce toward
              let bounceTarget: Enemy | null = null;
              let minBD = 260;
              for (const cand of enemiesRef.current) {
                if (proj.hitEnemyIds.has(cand.id)) continue;
                const bd = Math.hypot(cand.x - proj.x, cand.y - proj.y);
                if (bd < minBD) {
                  minBD = bd;
                  bounceTarget = cand;
                }
              }
              if (bounceTarget) {
                const ba = Math.atan2(bounceTarget.y - proj.y, bounceTarget.x - proj.x);
                proj.vx = Math.cos(ba) * p.projectileSpeed;
                proj.vy = Math.sin(ba) * p.projectileSpeed;
              } else if (proj.pierceLeft > 1) {
                proj.pierceLeft -= 1;
              } else {
                consumed = true;
              }
            } else if (proj.pierceLeft > 1) {
              proj.pierceLeft -= 1;
            } else {
              consumed = true;
            }

            if (consumed) break;
          }
        }

        if (!consumed) {
          activeProjectiles.push(proj);
        }
      }
      projectilesRef.current = activeProjectiles;

      // 6. Update Orbiting Guardian Orbs contact damage
      if (p.guardianOrbsCount > 0) {
        const orbitDist = 66;
        for (let i = 0; i < p.guardianOrbsCount; i++) {
          const angle = p.orbitAngle + (i / p.guardianOrbsCount) * Math.PI * 2;
          const ox = p.x + Math.cos(angle) * orbitDist;
          const oy = p.y + Math.sin(angle) * orbitDist;

          for (const enemy of enemiesRef.current) {
            if (enemy.hitFlashTimer > 0) continue;
            const d = Math.hypot(enemy.x - ox, enemy.y - oy);
            if (d <= enemy.radius + 11) {
              const orbDmg = Math.round(p.damage * 0.65);
              enemy.hp -= orbDmg;
              enemy.hitFlashTimer = 0.14;
              addFloatingText(enemy.x, enemy.y - 12, `${orbDmg}`, '#FFB800', 12);
            }
          }
        }
      }

      // 7. Update Skeletons Movement, Burn DoT, Necromancer Attacks & Player Collision
      const survivingEnemies: Enemy[] = [];
      let activeBoss: Enemy | null = null;

      for (const enemy of enemiesRef.current) {
        if (enemy.burnTimer > 0) {
          enemy.burnTimer -= dt;
          enemy.hp -= enemy.burnDps * dt;
        }

        if (enemy.hp <= 0) {
          updateEnemyDeath(enemy);
          continue;
        }

        if (enemy.isBoss) {
          activeBoss = enemy;
        }

        if (enemy.hitFlashTimer > 0) {
          enemy.hitFlashTimer = Math.max(0, enemy.hitFlashTimer - dt);
        }

        enemy.walkPhase += dt * (enemy.speed * 0.11);

        const dx = p.x - enemy.x;
        const dy = p.y - enemy.y;
        const distToPlayer = Math.hypot(dx, dy) || 1;
        const dirX = dx / distToPlayer;
        const dirY = dy / distToPlayer;

        if (enemy.type === 'wraith') {
          // Spectral Wraith weaves in a sinusoidal pattern
          const perpX = -dirY;
          const perpY = dirX;
          const waveOffset = Math.sin(nowSec * 4.5 + enemy.id) * 0.55;
          enemy.vx = (dirX + perpX * waveOffset) * enemy.speed;
          enemy.vy = (dirY + perpY * waveOffset) * enemy.speed;
        } else if (enemy.type === 'necromancer' && distToPlayer < 250 && distToPlayer > 130) {
          // Necromancer pauses at mid-range to conjure violet dark orbs
          enemy.vx = dirX * enemy.speed * 0.25;
          enemy.vy = dirY * enemy.speed * 0.25;
          enemy.shootTimer -= dt;
          if (enemy.shootTimer <= 0 && !isTitle) {
            enemy.shootTimer = 2.8;
            enemyProjectilesRef.current.push({
              id: nextEntityIdRef.current++,
              x: enemy.x,
              y: enemy.y,
              vx: dirX * 195,
              vy: dirY * 195,
              radius: 6,
              damage: enemy.damage,
              life: 3.2,
            });
          }
        } else {
          enemy.vx = dirX * enemy.speed;
          enemy.vy = dirY * enemy.speed;
        }

        enemy.x += enemy.vx * dt;
        enemy.y += enemy.vy * dt;

        // Soft separation between skeletons so they form organic swarms
        for (const other of enemiesRef.current) {
          if (other.id === enemy.id) continue;
          const sdx = enemy.x - other.x;
          const sdy = enemy.y - other.y;
          const sdist = Math.hypot(sdx, sdy);
          const minSep = enemy.radius + other.radius;
          if (sdist > 0 && sdist < minSep) {
            const push = (minSep - sdist) * 0.35;
            enemy.x += (sdx / sdist) * push;
            enemy.y += (sdy / sdist) * push;
          }
        }

        // Check Contact Damage with Player
        if (!isTitle && distToPlayer <= enemy.radius + 14) {
          if (p.invulnerableTimer <= 0) {
            p.hp -= enemy.damage;
            p.invulnerableTimer = 0.55;
            soundEngine.playPlayerHurt();
            addFloatingText(p.x, p.y - 22, `-${enemy.damage} PV`, '#EF476F', 15, true);

            // Push skeleton back slightly on contact
            enemy.x -= dirX * 28;
            enemy.y -= dirY * 28;

            if (p.hp <= 0) {
              p.hp = 0;
              phaseRef.current = 'gameover';
              setGamePhase('gameover');
              const finalScore = scoreRef.current;
              const finalWave = waveRef.current;
              setBestScore((prev) => {
                if (finalScore > prev) {
                  setIsNewRecord(true);
                  try {
                    localStorage.setItem('cimetiere_best_score', String(finalScore));
                  } catch {}
                  return finalScore;
                }
                return prev;
              });
              setBestWave((prev) => {
                const nw = Math.max(prev, finalWave);
                try {
                  localStorage.setItem('cimetiere_best_wave', String(nw));
                } catch {}
                return nw;
              });
            }
          }
        }

        survivingEnemies.push(enemy);
      }
      enemiesRef.current = survivingEnemies;

      // 8. Update Enemy Necrotic Projectiles
      const activeEnemyProj: EnemyProjectile[] = [];
      for (const ep of enemyProjectilesRef.current) {
        ep.x += ep.vx * dt;
        ep.y += ep.vy * dt;
        ep.life -= dt;
        if (ep.life <= 0) continue;

        const dPlayer = Math.hypot(ep.x - p.x, ep.y - p.y);
        if (!isTitle && dPlayer <= ep.radius + 13) {
          if (p.invulnerableTimer <= 0) {
            p.hp -= ep.damage;
            p.invulnerableTimer = 0.5;
            soundEngine.playPlayerHurt();
            addFloatingText(p.x, p.y - 22, `-${ep.damage} PV`, '#EF476F', 15, true);
            if (p.hp <= 0) {
              p.hp = 0;
              phaseRef.current = 'gameover';
              setGamePhase('gameover');
            }
          }
          continue;
        }
        activeEnemyProj.push(ep);
      }
      enemyProjectilesRef.current = activeEnemyProj;

      // 9. Update Soul-Orbs (Magnetic Vacuum & XP Level Up)
      const remainingOrbs: SoulOrb[] = [];
      for (const orb of soulOrbsRef.current) {
        orb.age += dt;
        const dx = p.x - orb.x;
        const dy = p.y - orb.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= p.pickupRadius) {
          orb.magnetized = true;
        }

        if (orb.magnetized) {
          const pullSpeed = 420 + Math.min(350, orb.age * 160);
          orb.vx = (dx / (dist || 1)) * pullSpeed;
          orb.vy = (dy / (dist || 1)) * pullSpeed;
          orb.x += orb.vx * dt;
          orb.y += orb.vy * dt;
        } else {
          orb.vx *= 0.9;
          orb.vy *= 0.9;
          orb.x += orb.vx * dt;
          orb.y += orb.vy * dt;
        }

        if (dist <= 18) {
          if (!isTitle) {
            soundEngine.playOrbPickup();
            const gainedXp = Math.round(orb.xp * p.xpMultiplier);
            p.xp += gainedXp;
            scoreRef.current += gainedXp;

            if (p.xp >= p.xpToNext) {
              p.xp -= p.xpToNext;
              p.level += 1;
              p.xpToNext = Math.round(p.xpToNext * 1.32 + 15);
              triggerLevelUpModal();
            }
          }
          continue;
        }

        remainingOrbs.push(orb);
      }
      soulOrbsRef.current = remainingOrbs;

      // 10. Update Particles & Floating Texts
      particlesRef.current = particlesRef.current.filter((pt) => {
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.life -= dt;
        return pt.life > 0;
      });

      floatingTextsRef.current = floatingTextsRef.current.filter((ft) => {
        ft.y += ft.vy * dt;
        ft.life -= dt;
        return ft.life > 0;
      });

      // 11. Sync HUD Snapshot State periodically
      hudSyncTimer += dt;
      if (hudSyncTimer >= 0.065) {
        hudSyncTimer = 0;
        setHudPlayer({ ...p });
        setHudStats({
          wave: waveRef.current,
          waveProgress: waveTotalRef.current - (waveToSpawnRef.current + enemiesRef.current.length),
          waveTotalEnemies: waveTotalRef.current,
          waveRemainingEnemies: waveToSpawnRef.current + enemiesRef.current.length,
          kills: killsRef.current,
          score: scoreRef.current,
          elapsedSeconds: elapsedRef.current,
          level: p.level,
          bossActive: activeBoss ? { ...activeBoss } : null,
        });
      }
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const nowSec = now / 1000;

      stepSimulation(dt, nowSec);

      renderGraveyardScene({
        ctx,
        width: canvas.width,
        height: canvas.height,
        time: nowSec,
        heroId: heroIdRef.current,
        player: playerRef.current,
        enemies: enemiesRef.current,
        projectiles: projectilesRef.current,
        enemyProjectiles: enemyProjectilesRef.current,
        soulOrbs: soulOrbsRef.current,
        particles: particlesRef.current,
        floatingTexts: floatingTextsRef.current,
        tombstones: tombstonesRef.current,
        fireflies: firefliesRef.current,
        mousePos: mousePosRef.current,
        aimMode: aimModeRef.current,
        isTitleScreen: phaseRef.current === 'title',
      });

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [spawnEnemy, startWave, triggerLevelUpModal]);

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.setMuted(next);
  };

  const handleToggleAimMode = () => {
    setAimMode((prev) => (prev === 'cursor' ? 'auto' : 'cursor'));
  };

  return (
    <main
      className="relative w-screen h-screen overflow-hidden bg-[#080B14] select-none"
      onMouseMove={(e) => {
        mousePosRef.current = { x: e.clientX, y: e.clientY };
      }}
      onMouseDown={(e) => {
        if (e.button === 2) {
          e.preventDefault();
          triggerNova();
        } else {
          mouseDownRef.current = true;
        }
      }}
      onMouseUp={() => {
        mouseDownRef.current = false;
      }}
      onContextMenu={(e) => {
        e.preventDefault();
      }}
      onTouchMove={(e) => {
        if (e.touches[0]) {
          mousePosRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
          };
        }
      }}
    >
      {/* Full-Viewport Interactive Graveyard Canvas */}
      <canvas
        ref={canvasRef}
        className={`block w-full h-full ${
          gamePhase === 'playing' && aimMode === 'cursor' ? 'cursor-none' : 'cursor-default'
        }`}
      />

      {/* 1. Title Screen Overlay (Translucent over live graveyard canvas) */}
      {gamePhase === 'title' && (
        <TitleOverlay
          selectedHero={selectedHero}
          onSelectHero={(hero) => setSelectedHero(hero)}
          aimMode={aimMode}
          onToggleAimMode={(mode) => setAimMode(mode)}
          onStartGame={() => startNewRun(selectedHero)}
          bestScore={bestScore}
          bestWave={bestWave}
        />
      )}

      {/* 2. Active Gameplay Peripheral HUD */}
      {gamePhase !== 'title' && (
        <GameHud
          heroId={selectedHero}
          player={hudPlayer}
          stats={hudStats}
          relicLevels={relicLevels}
          aimMode={aimMode}
          onToggleAimMode={handleToggleAimMode}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onPause={() => {
            phaseRef.current = 'paused';
            setGamePhase('paused');
          }}
          onTriggerNova={triggerNova}
          waveBanner={waveBanner}
        />
      )}

      {/* 3. Level-Up 3-Choice Relic Modal */}
      {gamePhase === 'levelup' && (
        <LevelUpModal
          level={hudPlayer.level}
          choices={levelUpChoices}
          relicLevels={relicLevels}
          onSelectRelic={handleSelectRelic}
        />
      )}

      {/* 4. Pause Modal */}
      {gamePhase === 'paused' && (
        <PauseModal
          heroId={selectedHero}
          stats={hudStats}
          onResume={() => {
            phaseRef.current = 'playing';
            setGamePhase('playing');
          }}
          onRestart={() => startNewRun(selectedHero)}
          onReturnTitle={() => {
            phaseRef.current = 'title';
            setGamePhase('title');
            startWave(1, true);
          }}
        />
      )}

      {/* 5. Game Over Summary Modal */}
      {gamePhase === 'gameover' && (
        <GameOverModal
          heroId={selectedHero}
          stats={hudStats}
          relicLevels={relicLevels}
          isNewRecord={isNewRecord}
          onReplay={() => startNewRun(selectedHero)}
          onReturnTitle={() => {
            phaseRef.current = 'title';
            setGamePhase('title');
            startWave(1, true);
          }}
        />
      )}

      {/* Bouton Infos technique */}
      <button
        onClick={() => setShowInfo(true)}
        className="fixed top-2.5 right-2.5 z-[100] flex items-center gap-1 rounded-lg border border-slate-700/60 bg-slate-900/80 px-2 py-1 text-xs text-amber-200 shadow-md backdrop-blur hover:bg-slate-800 transition cursor-pointer select-none"
        title="Comment ce jeu a été fait"
        aria-label="Infos sur le jeu"
      >
        <span>ℹ️</span>
        <span className="hidden sm:inline">Infos</span>
      </button>
      <InfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} />
    </main>
  );
}

export default App;
