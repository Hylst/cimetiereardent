import React from 'react';
import { HeroId, RelicId } from '../types/game';

export const HeroAvatarSvg: React.FC<{ heroId: HeroId; className?: string }> = ({
  heroId,
  className = 'w-14 h-14',
}) => {
  if (heroId === 'mage') {
    return (
      <svg viewBox="0 0 64 64" fill="none" className={className}>
        {/* Outer Arcane Halo */}
        <circle cx="32" cy="32" r="28" stroke="#38F9D7" strokeOpacity="0.28" strokeWidth="1.5" strokeDasharray="4 4" />
        <circle cx="32" cy="32" r="22" fill="#0F172A" stroke="#38F9D7" strokeOpacity="0.5" strokeWidth="1.5" />
        {/* Mage Hood & Cloak */}
        <path
          d="M16 48C16 38 22 33 32 33C42 33 48 38 48 48"
          fill="#1E293B"
          stroke="#38F9D7"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M32 11L19 29C19 36 25 40 32 40C39 40 45 36 45 29L32 11Z"
          fill="#0F172A"
          stroke="#38F9D7"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Glowing Eyes */}
        <circle cx="27.5" cy="29" r="2.2" fill="#38F9D7" />
        <circle cx="36.5" cy="29" r="2.2" fill="#38F9D7" />
        {/* Floating Astral Staff Crystal */}
        <polygon points="50,14 54,20 50,26 46,20" fill="#38F9D7" />
        <line x1="50" y1="26" x2="47" y2="48" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" fill="none" className={className}>
      {/* Solar Halo */}
      <circle cx="32" cy="32" r="28" stroke="#FFB800" strokeOpacity="0.32" strokeWidth="1.5" strokeDasharray="5 3" />
      <circle cx="32" cy="32" r="22" fill="#1C140D" stroke="#FFB800" strokeOpacity="0.5" strokeWidth="1.5" />
      {/* Enchanted Vine Stem */}
      <path
        d="M32 17C32 12 36 9 39 11C37 14 35 15 34 18"
        stroke="#06D6A0"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Pumpkin Body */}
      <ellipse cx="32" cy="34" rx="17" ry="14" fill="#D97706" stroke="#FFB800" strokeWidth="2" />
      <ellipse cx="32" cy="34" rx="10" ry="14" fill="#EA580C" stroke="#FFB800" strokeWidth="1.4" />
      {/* Glowing Carved Eyes & Grin */}
      <polygon points="23,30 27,25 29,31" fill="#FEF08A" />
      <polygon points="41,30 37,25 35,31" fill="#FEF08A" />
      <path
        d="M22 37L26 40L29 38L32 41L35 38L38 40L42 37L39 43L32 44L25 43Z"
        fill="#FEF08A"
      />
    </svg>
  );
};

export const RelicSvgIcon: React.FC<{ relicId: RelicId; className?: string }> = ({
  relicId,
  className = 'w-9 h-9',
}) => {
  switch (relicId) {
    case 'split_prism':
      return (
        <svg viewBox="0 0 40 40" fill="none" className={className}>
          <polygon points="20,6 33,31 7,31" stroke="#38F9D7" strokeWidth="2.2" fill="rgba(56,249,215,0.14)" />
          <line x1="20" y1="18" x2="35" y2="10" stroke="#38F9D7" strokeWidth="2" strokeLinecap="round" />
          <line x1="20" y1="18" x2="36" y2="20" stroke="#FFB800" strokeWidth="2" strokeLinecap="round" />
          <line x1="20" y1="18" x2="35" y2="29" stroke="#9D4EDD" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'solar_lens':
      return (
        <svg viewBox="0 0 40 40" fill="none" className={className}>
          <circle cx="20" cy="20" r="9" fill="rgba(255,184,0,0.25)" stroke="#FFB800" strokeWidth="2.2" />
          <circle cx="20" cy="20" r="4" fill="#FFB800" />
          <path
            d="M20 4V8M20 32V36M4 20H8M32 20H36M8.7 8.7L11.5 11.5M28.5 28.5L31.3 31.3M31.3 8.7L28.5 11.5M11.5 28.5L8.7 31.3"
            stroke="#FFB800"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'celestial_cadence':
      return (
        <svg viewBox="0 0 40 40" fill="none" className={className}>
          <path d="M8 26L18 10L22 18L32 8" stroke="#38F9D7" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 32L22 16L26 24L35 14" stroke="#38F9D7" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
          <circle cx="32" cy="8" r="3" fill="#38F9D7" />
        </svg>
      );
    case 'piercing_ray':
      return (
        <svg viewBox="0 0 40 40" fill="none" className={className}>
          <line x1="5" y1="35" x2="34" y2="6" stroke="#38F9D7" strokeWidth="2.6" strokeLinecap="round" />
          <polygon points="36,4 26,8 32,14" fill="#38F9D7" />
          <circle cx="19" cy="21" r="6" stroke="#F3F6FA" strokeOpacity="0.6" strokeWidth="1.6" strokeDasharray="3 2" />
        </svg>
      );
    case 'guardian_orbs':
      return (
        <svg viewBox="0 0 40 40" fill="none" className={className}>
          <ellipse cx="20" cy="20" rx="15" ry="8" transform="rotate(-25 20 20)" stroke="#FFB800" strokeWidth="1.8" strokeDasharray="4 3" />
          <circle cx="20" cy="20" r="4.5" fill="#38F9D7" />
          <circle cx="32" cy="14" r="4" fill="#FFB800" />
          <circle cx="8" cy="26" r="4" fill="#FFB800" />
        </svg>
      );
    case 'ricochet_shards':
      return (
        <svg viewBox="0 0 40 40" fill="none" className={className}>
          <polyline points="6,28 17,11 25,27 35,12" stroke="#9D4EDD" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="17" cy="11" r="3" fill="#38F9D7" />
          <circle cx="25" cy="27" r="3" fill="#FFB800" />
          <circle cx="35" cy="12" r="3" fill="#38F9D7" />
        </svg>
      );
    case 'astral_lightning':
      return (
        <svg viewBox="0 0 40 40" fill="none" className={className}>
          <polygon
            points="23,4 10,22 20,22 16,36 31,17 21,17"
            fill="rgba(56,249,215,0.22)"
            stroke="#38F9D7"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'soul_magnet':
      return (
        <svg viewBox="0 0 40 40" fill="none" className={className}>
          <path
            d="M12 14V22C12 26.4 15.6 30 20 30C24.4 30 28 26.4 28 22V14"
            stroke="#38F9D7"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <circle cx="20" cy="11" r="3.5" fill="#FFB800" />
          <circle cx="12" cy="10" r="2" fill="#38F9D7" />
          <circle cx="28" cy="10" r="2" fill="#38F9D7" />
        </svg>
      );
    case 'mist_boots':
      return (
        <svg viewBox="0 0 40 40" fill="none" className={className}>
          <path
            d="M14 9H23L21 22L31 26C32.5 26.6 33 28.5 32 30H11V22L14 9Z"
            fill="rgba(157,78,221,0.22)"
            stroke="#9D4EDD"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path d="M6 16H11M4 22H9" stroke="#38F9D7" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'blessed_sanctuary':
      return (
        <svg viewBox="0 0 40 40" fill="none" className={className}>
          <path
            d="M12 10H28L26 21C25 25 20 27 20 27C20 27 15 25 14 21L12 10Z"
            fill="rgba(255,184,0,0.2)"
            stroke="#FFB800"
            strokeWidth="2.2"
          />
          <line x1="20" y1="27" x2="20" y2="34" stroke="#FFB800" strokeWidth="2.2" />
          <line x1="14" y1="34" x2="26" y2="34" stroke="#FFB800" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M20 13V21M16 17H24" stroke="#06D6A0" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
  }
};
