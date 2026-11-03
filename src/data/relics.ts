import { HeroDefinition, HeroId, RelicDefinition, RelicId } from '../types/game';

export const HEROES: Record<HeroId, HeroDefinition> = {
  mage: {
    id: 'mage',
    name: "L'Archimage Astral",
    title: 'Gardien des Étoiles Cyan',
    weaponName: 'Éclats Stellaires',
    weaponDesc: 'Projectiles cristallins ultra-rapides qui transpercent les rangs de squelettes.',
    passiveName: 'Résonance Astrale',
    passiveDesc: '+1 Pénétration de base, cadence véloce et portée magnétique des âmes accrue.',
    primaryColor: '#38F9D7',
    secondaryColor: '#00B4D8',
    glowRgba: 'rgba(56, 249, 215, 0.45)',
    baseStats: {
      maxHp: 100,
      moveSpeed: 215,
      fireRate: 3.4,
      damage: 24,
      projectileSpeed: 640,
      projectileRadius: 6,
      pierce: 2,
      splashRadius: 0,
      pickupRadius: 115,
      critChance: 0.14,
    },
  },
  pumpkin: {
    id: 'pumpkin',
    name: 'La Citrouille Magique',
    title: 'Esprit de la Lanterne Solaire',
    weaponName: 'Braises Solaires',
    weaponDesc: "Orbes d'or incandescent qui explosent à l'impact et embrasent les ossements proches.",
    passiveName: 'Cœur Incandescent',
    passiveDesc: "Déflagration de zone à chaque tir, PV renforcés et régénération accrue au Sanctuaire.",
    primaryColor: '#FFB800',
    secondaryColor: '#FF6B00',
    glowRgba: 'rgba(255, 184, 0, 0.45)',
    baseStats: {
      maxHp: 130,
      moveSpeed: 195,
      fireRate: 2.15,
      damage: 36,
      projectileSpeed: 490,
      projectileRadius: 8.5,
      pierce: 1,
      splashRadius: 68,
      pickupRadius: 95,
      critChance: 0.1,
    },
  },
};

export const RELICS: RelicDefinition[] = [
  {
    id: 'split_prism',
    name: 'Prisme Bifurqué',
    description: 'Tire +1 projectile de lumière supplémentaire en éventail à chaque salve.',
    rarity: 'Légendaire',
    accent: 'cyan',
    maxLevel: 5,
  },
  {
    id: 'solar_lens',
    name: 'Lentille Solaire',
    description: 'Augmente les dégâts lumineux de +25% et élargit le calibre des projectiles.',
    rarity: 'Commune',
    accent: 'gold',
    maxLevel: 6,
  },
  {
    id: 'celestial_cadence',
    name: 'Cadence Céleste',
    description: "Accélère la vitesse d'incantation des tirs de lumière de +22%.",
    rarity: 'Commune',
    accent: 'cyan',
    maxLevel: 6,
  },
  {
    id: 'piercing_ray',
    name: 'Rayon Pénétrant',
    description: 'Vos projectiles traversent +1 squelette supplémentaire et gagnent en vitesse.',
    rarity: 'Rare',
    accent: 'cyan',
    maxLevel: 5,
  },
  {
    id: 'guardian_orbs',
    name: 'Astres Gardiens',
    description: 'Invoque un orbe lumineux en orbite permanente qui calcine les squelettes au contact.',
    rarity: 'Légendaire',
    accent: 'gold',
    maxLevel: 5,
  },
  {
    id: 'ricochet_shards',
    name: 'Éclats Ricochets',
    description: 'Les projectiles rebondissent automatiquement vers +1 squelette proche après impact.',
    rarity: 'Rare',
    accent: 'violet',
    maxLevel: 4,
  },
  {
    id: 'astral_lightning',
    name: 'Foudre du Sanctuaire',
    description: 'Frappe périodiquement les squelettes proches avec un éclair céleste purificateur.',
    rarity: 'Légendaire',
    accent: 'cyan',
    maxLevel: 5,
  },
  {
    id: 'soul_magnet',
    name: "Aimant d'Âmes",
    description: "Élargit le rayon d'attraction des Orbes d'Âme de +45% et augmente l'XP gagnée de +15%.",
    rarity: 'Commune',
    accent: 'cyan',
    maxLevel: 4,
  },
  {
    id: 'mist_boots',
    name: 'Bottes de Brume',
    description: 'Augmente la vitesse de déplacement de +18% et réduit la recharge de la Nova.',
    rarity: 'Commune',
    accent: 'violet',
    maxLevel: 4,
  },
  {
    id: 'blessed_sanctuary',
    name: 'Calice de Lumière',
    description: 'Restaure immédiatement 40 PV, augmente les PV Max de +25 et bénit le Sanctuaire.',
    rarity: 'Rare',
    accent: 'gold',
    maxLevel: 5,
  },
];

export const RELIC_MAP: Record<RelicId, RelicDefinition> = RELICS.reduce(
  (acc, relic) => {
    acc[relic.id] = relic;
    return acc;
  },
  {} as Record<RelicId, RelicDefinition>
);
