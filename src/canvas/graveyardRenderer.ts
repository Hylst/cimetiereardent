import {
  AmbientFirefly,
  Enemy,
  EnemyProjectile,
  FloatingText,
  HeroId,
  Particle,
  PlayerState,
  Projectile,
  SoulOrb,
  Tombstone,
} from '../types/game';
import { HEROES } from '../data/relics';

export interface RenderContextData {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  time: number;
  heroId: HeroId;
  player: PlayerState;
  enemies: Enemy[];
  projectiles: Projectile[];
  enemyProjectiles: EnemyProjectile[];
  soulOrbs: SoulOrb[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  tombstones: Tombstone[];
  fireflies: AmbientFirefly[];
  mousePos: { x: number; y: number };
  aimMode: 'cursor' | 'auto';
  isTitleScreen: boolean;
}

export const SANCTUARY_RADIUS = 96;

export function generateTombstones(width: number, height: number): Tombstone[] {
  const stones: Tombstone[] = [];
  const cx = width / 2;
  const cy = height / 2;
  const variants: Tombstone['variant'][] = ['cross', 'arch', 'obelisk', 'slab'];

  // Place tombstones in two atmospheric rings around the central sanctuary, avoiding the 4 cardinal pathways
  const count = Math.min(22, Math.max(12, Math.floor((width * height) / 68000)));

  for (let i = 0; i < count; i++) {
    const baseAngle = (i / count) * Math.PI * 2 + (i % 2 === 0 ? 0.18 : -0.14);
    // Avoid cardinal roads (angles near 0, PI/2, PI, 3PI/2)
    const modAngle = Math.abs(((baseAngle % (Math.PI / 2)) + Math.PI / 2) % (Math.PI / 2));
    const safeAngle =
      modAngle < 0.22
        ? baseAngle + 0.26
        : modAngle > Math.PI / 2 - 0.22
        ? baseAngle - 0.26
        : baseAngle;

    const ringDist = i % 2 === 0 ? Math.min(width, height) * 0.27 : Math.min(width, height) * 0.39;
    const jitterR = ((i * 37) % 36) - 18;
    const dist = Math.max(SANCTUARY_RADIUS + 65, ringDist + jitterR);

    const x = cx + Math.cos(safeAngle) * dist * (width / Math.max(width, height) * 0.92 + 0.25);
    const y = cy + Math.sin(safeAngle) * dist * (height / Math.max(width, height) * 0.88 + 0.2);

    if (x > 75 && x < width - 75 && y > 75 && y < height - 75) {
      stones.push({
        x,
        y,
        width: 28 + (i % 3) * 4,
        height: 36 + (i % 4) * 5,
        variant: variants[i % variants.length],
        rotation: (((i * 19) % 14) - 7) * 0.015,
        hasMoss: i % 2 === 0,
        runeGlow: 0,
      });
    }
  }
  return stones;
}

export function generateFireflies(width: number, height: number, count = 34): AmbientFirefly[] {
  const list: AmbientFirefly[] = [];
  const colors = ['#38F9D7', '#FFB800', '#9D4EDD', '#38F9D7'];
  for (let i = 0; i < count; i++) {
    list.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 18,
      vy: (Math.random() - 0.5) * 18,
      size: 1.5 + Math.random() * 2.2,
      color: colors[i % colors.length],
      phase: Math.random() * Math.PI * 2,
    });
  }
  return list;
}

export function renderGraveyardScene(data: RenderContextData) {
  const {
    ctx,
    width,
    height,
    time,
    heroId,
    player,
    enemies,
    projectiles,
    enemyProjectiles,
    soulOrbs,
    particles,
    floatingTexts,
    tombstones,
    fireflies,
    mousePos,
    aimMode,
    isTitleScreen,
  } = data;

  const cx = width / 2;
  const cy = height / 2;
  const heroDef = HEROES[heroId];

  // 1. Deep Nocturnal Ground Canvas
  ctx.globalCompositeOperation = 'source-over';
  const bgGrad = ctx.createRadialGradient(
    player.x,
    player.y,
    30,
    cx,
    cy,
    Math.max(width, height) * 0.78
  );
  bgGrad.addColorStop(0, '#10172A');
  bgGrad.addColorStop(0.45, '#0B101E');
  bgGrad.addColorStop(1, '#060810');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle Ground Grid / Graveyard Cobble Tiles
  ctx.strokeStyle = 'rgba(30, 41, 69, 0.26)';
  ctx.lineWidth = 1;
  const tileSize = 64;
  ctx.beginPath();
  for (let x = (cx % tileSize); x < width; x += tileSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = (cy % tileSize); y < height; y += tileSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();

  // 2. Cardinal Cobblestone Pathways leading to the Central Sanctuary
  drawCardinalPaths(ctx, cx, cy, width, height);

  // 3. Wrought-Iron Graveyard Fence Perimeter & Spectral Spawn Portals
  drawGraveyardPerimeter(ctx, cx, cy, width, height, time);

  // 4. Central Sanctuary of Light (Le Sanctuaire Runique)
  drawCentralSanctuary(ctx, cx, cy, time, heroDef.primaryColor, player.inSanctuary);

  // 5. Player Lantern Ground Illumination & Pickup Radius Ring
  drawPlayerAura(ctx, player, heroDef.primaryColor, time);

  // 6. Soul Orbs (XP Gems) on the Ground
  for (const orb of soulOrbs) {
    drawSoulOrb(ctx, orb, time);
  }

  // 7. Tombstones with Dynamic Light Proximity Calculation
  for (const stone of tombstones) {
    let glow = 0;
    const distPlayer = Math.hypot(stone.x - player.x, stone.y - player.y);
    if (distPlayer < 210) {
      glow = Math.max(glow, (1 - distPlayer / 210) * 0.75);
    }
    for (const p of projectiles) {
      const dp = Math.hypot(stone.x - p.x, stone.y - p.y);
      if (dp < 110) {
        glow = Math.max(glow, 1 - dp / 110);
      }
    }
    stone.runeGlow = stone.runeGlow * 0.85 + glow * 0.15;
    drawTombstone(ctx, stone, heroDef.primaryColor);
  }

  // 8. Orbiting Guardian Orbs (if Relic unlocked)
  if (player.guardianOrbsCount > 0) {
    drawGuardianOrbs(ctx, player, time);
  }

  // 9. Hero Entity (Archimage Astral or Citrouille Magique)
  drawHeroEntity(ctx, player, heroId, time);

  // 10. Skeleton Hordes & Bosses
  for (const enemy of enemies) {
    drawEnemyEntity(ctx, enemy, time);
  }

  // 11. Enemy Necrotic Projectiles
  for (const ep of enemyProjectiles) {
    drawEnemyProjectile(ctx, ep, time);
  }

  // 12. Additive Bioluminescent Light Pass (Projectiles, Particles, Explosions, Lightning)
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  for (const proj of projectiles) {
    drawLightProjectile(ctx, proj);
  }

  for (const pt of particles) {
    drawParticle(ctx, pt);
  }

  // Ambient drifting bioluminescent fireflies
  for (const fly of fireflies) {
    const pulse = 0.45 + 0.55 * Math.sin(time * 2.5 + fly.phase);
    ctx.fillStyle = fly.color;
    ctx.globalAlpha = pulse * 0.65;
    ctx.beginPath();
    ctx.arc(fly.x, fly.y, fly.size * 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = pulse * 0.9;
    ctx.beginPath();
    ctx.arc(fly.x, fly.y, fly.size * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  // 13. Floating Damage Numbers & Status Text
  for (const ft of floatingTexts) {
    drawFloatingText(ctx, ft);
  }

  // 14. Custom Arcane Reticle when in Cursor Aim Mode during gameplay
  if (!isTitleScreen && aimMode === 'cursor') {
    drawArcaneReticle(ctx, mousePos.x, mousePos.y, heroDef.primaryColor, time);
  }

  // 15. Subtle Nocturnal Vignette around screen edges
  const vignette = ctx.createRadialGradient(
    cx,
    cy,
    Math.min(width, height) * 0.36,
    cx,
    cy,
    Math.max(width, height) * 0.75
  );
  vignette.addColorStop(0, 'rgba(8, 11, 20, 0)');
  vignette.addColorStop(1, 'rgba(4, 6, 12, 0.65)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

function drawCardinalPaths(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  width: number,
  height: number
) {
  ctx.save();
  ctx.fillStyle = 'rgba(18, 24, 41, 0.65)';
  const roadWidth = 54;
  // Horizontal path
  ctx.fillRect(24, cy - roadWidth / 2, width - 48, roadWidth);
  // Vertical path
  ctx.fillRect(cx - roadWidth / 2, 24, roadWidth, height - 48);

  // Dashed stone borders on pathways
  ctx.strokeStyle = 'rgba(56, 249, 215, 0.08)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([12, 10]);
  ctx.strokeRect(24, cy - roadWidth / 2, width - 48, roadWidth);
  ctx.strokeRect(cx - roadWidth / 2, 24, roadWidth, height - 48);
  ctx.restore();
}

function drawGraveyardPerimeter(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  width: number,
  height: number,
  time: number
) {
  ctx.save();
  const pad = 22;
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 3;
  ctx.strokeRect(pad, pad, width - pad * 2, height - pad * 2);

  // Spectral Spawn Portals at North, South, East, West gates
  const portals = [
    { x: cx, y: pad + 8 },
    { x: cx, y: height - pad - 8 },
    { x: pad + 8, y: cy },
    { x: width - pad - 8, y: cy },
  ];

  for (const p of portals) {
    const pulse = 0.7 + 0.3 * Math.sin(time * 3);
    const grad = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, 38 * pulse);
    grad.addColorStop(0, 'rgba(157, 78, 221, 0.55)');
    grad.addColorStop(0.6, 'rgba(157, 78, 221, 0.18)');
    grad.addColorStop(1, 'rgba(157, 78, 221, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 38 * pulse, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCentralSanctuary(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  time: number,
  accentColor: string,
  active: boolean
) {
  ctx.save();
  ctx.translate(cx, cy);

  // Sanctuary Stone Base
  const baseGrad = ctx.createRadialGradient(0, 0, 12, 0, 0, SANCTUARY_RADIUS);
  baseGrad.addColorStop(0, active ? 'rgba(30, 41, 69, 0.92)' : 'rgba(18, 24, 41, 0.85)');
  baseGrad.addColorStop(0.82, 'rgba(14, 20, 36, 0.78)');
  baseGrad.addColorStop(1, 'rgba(8, 11, 20, 0)');
  ctx.fillStyle = baseGrad;
  ctx.beginPath();
  ctx.arc(0, 0, SANCTUARY_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  // Outer Runic Ring
  ctx.strokeStyle = active ? accentColor : 'rgba(148, 163, 184, 0.3)';
  ctx.globalAlpha = active ? 0.55 + 0.2 * Math.sin(time * 4) : 0.35;
  ctx.lineWidth = active ? 2.2 : 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, SANCTUARY_RADIUS - 4, 0, Math.PI * 2);
  ctx.stroke();

  // Rotating Arcane Octagram inside the Sanctuary
  ctx.rotate(time * 0.22);
  ctx.strokeStyle = accentColor;
  ctx.globalAlpha = active ? 0.42 : 0.16;
  ctx.lineWidth = 1.4;
  ctx.strokeRect(-46, -46, 92, 92);
  ctx.rotate(Math.PI / 4);
  ctx.strokeRect(-46, -46, 92, 92);

  // Inner Sanctuary Plinth Circle
  ctx.beginPath();
  ctx.arc(0, 0, 26, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawPlayerAura(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  primaryColor: string,
  time: number
) {
  ctx.save();
  const auraRadius = 155 + Math.sin(time * 3) * 8;
  const grad = ctx.createRadialGradient(player.x, player.y, 8, player.x, player.y, auraRadius);
  if (primaryColor === '#38F9D7') {
    grad.addColorStop(0, 'rgba(56, 249, 215, 0.18)');
    grad.addColorStop(0.5, 'rgba(56, 249, 215, 0.06)');
    grad.addColorStop(1, 'rgba(56, 249, 215, 0)');
  } else {
    grad.addColorStop(0, 'rgba(255, 184, 0, 0.20)');
    grad.addColorStop(0.5, 'rgba(255, 184, 0, 0.07)');
    grad.addColorStop(1, 'rgba(255, 184, 0, 0)');
  }
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(player.x, player.y, auraRadius, 0, Math.PI * 2);
  ctx.fill();

  // Subtle Soul-Orb magnetic pickup ring indicator
  ctx.strokeStyle = primaryColor;
  ctx.globalAlpha = 0.11;
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.pickupRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawTombstone(ctx: CanvasRenderingContext2D, stone: Tombstone, lightColor: string) {
  ctx.save();
  ctx.translate(stone.x, stone.y);
  ctx.rotate(stone.rotation);

  const w = stone.width;
  const h = stone.height;

  // Ground Shadow
  ctx.fillStyle = 'rgba(3, 5, 10, 0.65)';
  ctx.beginPath();
  ctx.ellipse(3, h * 0.38, w * 0.65, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Weathered Slate Body
  ctx.fillStyle = '#141B2D';
  ctx.strokeStyle = stone.runeGlow > 0.05 ? lightColor : '#26334D';
  ctx.lineWidth = 1.6 + stone.runeGlow * 1.4;

  ctx.beginPath();
  if (stone.variant === 'arch' || stone.variant === 'slab') {
    ctx.roundRect(-w / 2, -h / 2, w, h, [w / 2, w / 2, 3, 3]);
  } else if (stone.variant === 'obelisk') {
    ctx.moveTo(0, -h / 2 - 6);
    ctx.lineTo(w / 2, -h / 4);
    ctx.lineTo(w / 2 - 2, h / 2);
    ctx.lineTo(-w / 2 + 2, h / 2);
    ctx.lineTo(-w / 2, -h / 4);
    ctx.closePath();
  } else {
    // Carved Cross
    const cw = w * 0.36;
    ctx.roundRect(-cw / 2, -h / 2, cw, h, 2);
    ctx.roundRect(-w / 2, -h / 4, w, cw * 0.85, 2);
  }
  ctx.fill();
  ctx.stroke();

  // Glowing Carved Rune inside Tombstone when illuminated by passing projectiles
  if (stone.variant !== 'cross') {
    ctx.strokeStyle = stone.runeGlow > 0.08 ? lightColor : '#293752';
    ctx.globalAlpha = 0.35 + stone.runeGlow * 0.65;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.22);
    ctx.lineTo(0, h * 0.16);
    ctx.moveTo(-w * 0.22, -h * 0.08);
    ctx.lineTo(w * 0.22, -h * 0.08);
    ctx.stroke();
  }

  ctx.restore();
}

function drawGuardianOrbs(ctx: CanvasRenderingContext2D, player: PlayerState, time: number) {
  const count = player.guardianOrbsCount;
  const orbitDist = 66;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < count; i++) {
    const angle = player.orbitAngle + (i / count) * Math.PI * 2;
    const ox = player.x + Math.cos(angle) * orbitDist;
    const oy = player.y + Math.sin(angle) * orbitDist;

    const grad = ctx.createRadialGradient(ox, oy, 2, ox, oy, 18);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.4, '#FFB800');
    grad.addColorStop(1, 'rgba(255, 184, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ox, oy, 18, 0, Math.PI * 2);
    ctx.fill();

    // Orbiting star core
    ctx.fillStyle = '#FFFBEB';
    ctx.beginPath();
    ctx.arc(ox, oy, 5 + Math.sin(time * 8 + i) * 1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawHeroEntity(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  heroId: HeroId,
  time: number
) {
  ctx.save();
  ctx.translate(player.x, player.y);

  // Invulnerability blink feedback if recently hurt
  if (player.invulnerableTimer > 0 && Math.floor(time * 20) % 2 === 0) {
    ctx.globalAlpha = 0.5;
  }

  const bob = Math.sin(time * 5.5) * 2.2;

  // Ground Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.beginPath();
  ctx.ellipse(0, 17, 16, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  if (heroId === 'mage') {
    // ARCHIMAGE ASTRAL
    // Outer Runic Halo beneath feet
    ctx.strokeStyle = 'rgba(56, 249, 215, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 4, 21, 0, Math.PI * 2);
    ctx.stroke();

    // Astral Mantle / Robes
    ctx.fillStyle = '#111C35';
    ctx.strokeStyle = '#38F9D7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, bob, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pointed Arcane Hood
    ctx.fillStyle = '#0B1325';
    ctx.beginPath();
    ctx.arc(0, bob - 2, 11.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 249, 215, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Glowing Cyan Eyes oriented slightly toward aimAngle
    const lookX = Math.cos(player.aimAngle) * 3.5;
    const lookY = Math.sin(player.aimAngle) * 3.5;
    ctx.fillStyle = '#38F9D7';
    ctx.shadowColor = '#38F9D7';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(lookX - 3.5, bob - 1 + lookY, 2.2, 0, Math.PI * 2);
    ctx.arc(lookX + 3.5, bob - 1 + lookY, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Aimed Astral Crystal Staff
    const staffX = Math.cos(player.aimAngle) * 21;
    const staffY = Math.sin(player.aimAngle) * 21 + bob * 0.5;
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(Math.cos(player.aimAngle) * 9, Math.sin(player.aimAngle) * 9);
    ctx.lineTo(staffX, staffY);
    ctx.stroke();

    // Glowing Diamond Tip
    ctx.fillStyle = '#38F9D7';
    ctx.beginPath();
    ctx.arc(staffX, staffY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(staffX, staffY, 2.3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // LA CITROUILLE MAGIQUE
    // Solar Ember Ring beneath feet
    ctx.strokeStyle = 'rgba(255, 184, 0, 0.5)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 4, 22, 0, Math.PI * 2);
    ctx.stroke();

    // Leafy Autumn Collar
    ctx.fillStyle = '#065F46';
    ctx.strokeStyle = '#06D6A0';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, bob + 3, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Enchanted Ribbed Pumpkin Head
    ctx.fillStyle = '#D97706';
    ctx.strokeStyle = '#FFB800';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, bob, 15.5, 13.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner Pumpkin Ribs
    ctx.fillStyle = '#EA580C';
    ctx.beginPath();
    ctx.ellipse(0, bob, 9.5, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glowing Carved Eyes & Grin
    const lookX = Math.cos(player.aimAngle) * 2.5;
    const lookY = Math.sin(player.aimAngle) * 2.5;
    ctx.fillStyle = '#FEF08A';
    ctx.shadowColor = '#FFB800';
    ctx.shadowBlur = 10;
    // Left eye triangle
    ctx.beginPath();
    ctx.moveTo(lookX - 7, bob - 1 + lookY);
    ctx.lineTo(lookX - 4, bob - 6 + lookY);
    ctx.lineTo(lookX - 2, bob - 1 + lookY);
    ctx.closePath();
    ctx.fill();
    // Right eye triangle
    ctx.beginPath();
    ctx.moveTo(lookX + 7, bob - 1 + lookY);
    ctx.lineTo(lookX + 4, bob - 6 + lookY);
    ctx.lineTo(lookX + 2, bob - 1 + lookY);
    ctx.closePath();
    ctx.fill();
    // Carved Jack-o'-Lantern Smile
    ctx.beginPath();
    ctx.arc(lookX, bob + 2 + lookY, 6.5, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = '#FEF08A';
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Curly Green Stem on top
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, bob - 12);
    ctx.quadraticCurveTo(3, bob - 19, 7, bob - 16);
    ctx.stroke();

    // Aimed Solar Lantern Orb floating in front
    const orbX = Math.cos(player.aimAngle) * 22;
    const orbY = Math.sin(player.aimAngle) * 22 + bob * 0.5;
    ctx.fillStyle = '#FFB800';
    ctx.beginPath();
    ctx.arc(orbX, orbY, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(orbX, orbY, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawEnemyEntity(ctx: CanvasRenderingContext2D, enemy: Enemy, time: number) {
  ctx.save();
  ctx.translate(enemy.x, enemy.y);

  const isFlashing = enemy.hitFlashTimer > 0;
  const wobble = Math.sin(enemy.walkPhase) * 2.2;
  const r = enemy.radius;

  // Ground Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.85, r * 0.85, r * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();

  // Burning solar aura if afflicted by pumpkin burn
  if (enemy.burnTimer > 0) {
    ctx.fillStyle = 'rgba(255, 184, 0, 0.28)';
    ctx.beginPath();
    ctx.arc(0, 0, r + 5 + Math.sin(time * 15) * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Elite or Boss Necrotic Halo
  if (enemy.isBoss || enemy.isElite) {
    ctx.strokeStyle = enemy.isBoss ? '#EF476F' : '#9D4EDD';
    ctx.lineWidth = enemy.isBoss ? 2.5 : 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, r + 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Ribcage / Shoulders
  ctx.fillStyle = isFlashing ? '#FFFFFF' : enemy.type === 'wraith' ? '#3B1D5E' : '#263044';
  ctx.strokeStyle = isFlashing ? '#FFFFFF' : '#94A3B8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, wobble + 3, r * 0.85, r * 0.62, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Skull Head
  const boneColor = isFlashing
    ? '#FFFFFF'
    : enemy.type === 'wraith'
    ? '#E0AAFF'
    : enemy.type === 'necromancer'
    ? '#C7D2FE'
    : '#E2E8F0';

  ctx.fillStyle = boneColor;
  ctx.strokeStyle = isFlashing ? '#FFFFFF' : '#1E293B';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, wobble - 2, r * 0.72, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Jawbone
  ctx.fillStyle = boneColor;
  ctx.fillRect(-r * 0.34, wobble + r * 0.25, r * 0.68, r * 0.32);

  // Eye Sockets
  const eyeColor = isFlashing
    ? '#38F9D7'
    : enemy.isBoss
    ? '#EF476F'
    : enemy.type === 'wraith' || enemy.type === 'necromancer'
    ? '#9D4EDD'
    : '#1E293B';
  ctx.fillStyle = eyeColor;
  ctx.beginPath();
  ctx.arc(-r * 0.26, wobble - 2, r * 0.17, 0, Math.PI * 2);
  ctx.arc(r * 0.26, wobble - 2, r * 0.17, 0, Math.PI * 2);
  ctx.fill();

  // Archetype Specific Gear
  if (enemy.type === 'warrior' && !isFlashing) {
    // Heavy Tarnished Shield on side
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(-r - 3, wobble - 6, 7, 15, 2);
    ctx.fill();
    ctx.stroke();
  } else if (enemy.type === 'colossus') {
    // Golden Ossuary Crown on Boss Skull
    ctx.fillStyle = isFlashing ? '#FFFFFF' : '#FFB800';
    ctx.beginPath();
    ctx.moveTo(-r * 0.55, wobble - r * 0.55);
    ctx.lineTo(-r * 0.3, wobble - r * 0.95);
    ctx.lineTo(0, wobble - r * 0.65);
    ctx.lineTo(r * 0.3, wobble - r * 0.95);
    ctx.lineTo(r * 0.55, wobble - r * 0.55);
    ctx.closePath();
    ctx.fill();
  }

  // Mini Health Bar if damaged (and not Boss, or also on Boss)
  if (enemy.hp < enemy.maxHp) {
    const bw = Math.max(24, r * 1.8);
    const bh = 4;
    const by = -r - 11;
    ctx.fillStyle = 'rgba(8, 11, 20, 0.85)';
    ctx.fillRect(-bw / 2, by, bw, bh);
    const ratio = Math.max(0, enemy.hp / enemy.maxHp);
    ctx.fillStyle = enemy.isBoss ? '#EF476F' : '#38F9D7';
    ctx.fillRect(-bw / 2, by, bw * ratio, bh);
  }

  ctx.restore();
}

function drawEnemyProjectile(ctx: CanvasRenderingContext2D, ep: EnemyProjectile, time: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const grad = ctx.createRadialGradient(ep.x, ep.y, 1, ep.x, ep.y, ep.radius * 2.4);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.4, '#9D4EDD');
  grad.addColorStop(1, 'rgba(157, 78, 221, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(ep.x, ep.y, ep.radius * 2.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#E0AAFF';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(ep.x, ep.y, ep.radius + Math.sin(time * 12) * 1.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawSoulOrb(ctx: CanvasRenderingContext2D, orb: SoulOrb, time: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const pulse = 1 + 0.18 * Math.sin(time * 6 + orb.pulsePhase);
  const baseRadius = orb.tier === 'large' ? 7.5 : orb.tier === 'medium' ? 5.5 : 4.2;
  const r = baseRadius * pulse;

  const primary = orb.tier === 'large' ? '#FFB800' : orb.tier === 'medium' ? '#38F9D7' : '#00E5FF';

  const grad = ctx.createRadialGradient(orb.x, orb.y, 1, orb.x, orb.y, r * 2.8);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.35, primary);
  grad.addColorStop(1, 'rgba(56, 249, 215, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(orb.x, orb.y, r * 2.8, 0, Math.PI * 2);
  ctx.fill();

  // Diamond Soul Core
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(orb.x, orb.y - r);
  ctx.lineTo(orb.x + r * 0.75, orb.y);
  ctx.lineTo(orb.x, orb.y + r);
  ctx.lineTo(orb.x - r * 0.75, orb.y);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawLightProjectile(ctx: CanvasRenderingContext2D, proj: Projectile) {
  // Luminous Motion Trail
  if (proj.trail.length > 1) {
    ctx.beginPath();
    ctx.moveTo(proj.trail[0].x, proj.trail[0].y);
    for (let i = 1; i < proj.trail.length; i++) {
      ctx.lineTo(proj.trail[i].x, proj.trail[i].y);
    }
    ctx.strokeStyle = proj.color;
    ctx.globalAlpha = 0.42;
    ctx.lineWidth = proj.radius * 1.25;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Outer Bioluminescent Bloom
  const glowR = proj.radius * 3.4;
  const grad = ctx.createRadialGradient(proj.x, proj.y, 1, proj.x, proj.y, glowR);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.35, proj.color);
  grad.addColorStop(0.7, proj.secondaryColor);
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(proj.x, proj.y, glowR, 0, Math.PI * 2);
  ctx.fill();

  // Incandescent Core
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(proj.x, proj.y, proj.radius * 0.75, 0, Math.PI * 2);
  ctx.fill();
}

function drawParticle(ctx: CanvasRenderingContext2D, pt: Particle) {
  const progress = 1 - pt.life / pt.maxLife;
  const alpha = Math.max(0, (1 - progress) * pt.alpha);
  ctx.globalAlpha = alpha;

  if (pt.type === 'ring' && pt.endRadius) {
    const currentR = pt.size + (pt.endRadius - pt.size) * progress;
    ctx.strokeStyle = pt.color;
    ctx.lineWidth = Math.max(1, 3.5 * (1 - progress));
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, currentR, 0, Math.PI * 2);
    ctx.stroke();
  } else if (pt.type === 'lightning' && pt.targetX !== undefined && pt.targetY !== undefined) {
    ctx.strokeStyle = pt.color;
    ctx.lineWidth = 2.8 * (1 - progress);
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
    const midX = (pt.x + pt.targetX) / 2 + (Math.random() - 0.5) * 24;
    const midY = (pt.y + pt.targetY) / 2 + (Math.random() - 0.5) * 24;
    ctx.lineTo(midX, midY);
    ctx.lineTo(pt.targetX, pt.targetY);
    ctx.stroke();
  } else if (pt.type === 'bone') {
    ctx.fillStyle = pt.color;
    ctx.save();
    ctx.translate(pt.x, pt.y);
    ctx.rotate(progress * 6);
    ctx.fillRect(-pt.size, -pt.size * 0.45, pt.size * 2, pt.size * 0.9);
    ctx.restore();
  } else {
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size * (1 - progress * 0.5), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

function drawFloatingText(ctx: CanvasRenderingContext2D, ft: FloatingText) {
  const progress = 1 - ft.life / ft.maxLife;
  const alpha = progress < 0.7 ? 1 : 1 - (progress - 0.7) / 0.3;

  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);
  ctx.font = `700 ${ft.size}px "JetBrains Mono", monospace`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#080B14';
  ctx.fillText(ft.text, ft.x + 1.5, ft.y + 1.5);
  ctx.fillStyle = ft.color;
  ctx.fillText(ft.text, ft.x, ft.y);
  ctx.restore();
}

function drawArcaneReticle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  time: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(time * 1.4);
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 6, Math.sin(a) * 6);
    ctx.lineTo(Math.cos(a) * 15, Math.sin(a) * 15);
    ctx.stroke();
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(0, 0, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
