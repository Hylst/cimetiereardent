import React from 'react';
import { AimMode, HeroId } from '../types/game';
import { HEROES } from '../data/relics';
import { HeroAvatarSvg } from './RelicIcon';
import { Sparkles, Crosshair, Shield, Zap } from 'lucide-react';

interface TitleOverlayProps {
  selectedHero: HeroId;
  onSelectHero: (hero: HeroId) => void;
  aimMode: AimMode;
  onToggleAimMode: (mode: AimMode) => void;
  onStartGame: () => void;
  bestScore: number;
  bestWave: number;
}

export const TitleOverlay: React.FC<TitleOverlayProps> = ({
  selectedHero,
  onSelectHero,
  aimMode,
  onToggleAimMode,
  onStartGame,
  bestScore,
  bestWave,
}) => {
  const heroIds: HeroId[] = ['mage', 'pumpkin'];

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center p-4 pointer-events-auto">
      <div className="glass-panel max-w-3xl w-full rounded-2xl p-6 md:p-8 border border-[#38F9D7]/30 relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-40 rounded-full blur-3xl pointer-events-none"
          style={{
            background:
              selectedHero === 'mage'
                ? 'radial-gradient(circle, rgba(56,249,215,0.25) 0%, rgba(0,0,0,0) 70%)'
                : 'radial-gradient(circle, rgba(255,184,0,0.28) 0%, rgba(0,0,0,0) 70%)',
          }}
        />

        {/* Header */}
        <div className="text-center mb-6 relative">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#121829]/90 border border-[#38F9D7]/30 text-xs uppercase tracking-[0.16em] text-[#38F9D7] mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Survie Arcane &bull; Bastion Bioluminescent</span>
          </div>
          <h1
            className={`font-display text-3xl sm:text-5xl font-bold tracking-wider uppercase ${
              selectedHero === 'mage' ? 'text-glow-cyan text-[#F3F6FA]' : 'text-glow-gold text-[#FFFBEB]'
            }`}
          >
            Le Cimetière Lumineux
          </h1>
          <p className="text-sm sm:text-base text-[#94A3B8] max-w-xl mx-auto mt-2">
            Au cœur des tombes ancestrales, incarnez un gardien de lumière et repoussez les légions
            squelettiques grâce à vos projectiles enchantés.
          </p>

          {bestScore > 0 && (
            <div className="inline-flex items-center gap-4 mt-3 px-4 py-1 rounded-lg bg-[#080B14]/70 border border-slate-800 text-xs font-mono-tabular text-[#94A3B8]">
              <span>
                Meilleure Vague : <strong className="text-[#38F9D7]">{bestWave}</strong>
              </span>
              <span>&bull;</span>
              <span>
                Record : <strong className="text-[#FFB800]">{bestScore.toLocaleString('fr-FR')} pts</strong>
              </span>
            </div>
          )}
        </div>

        {/* Hero Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {heroIds.map((id) => {
            const hero = HEROES[id];
            const isSelected = selectedHero === id;
            const isMage = id === 'mage';

            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelectHero(id)}
                className={`group text-left rounded-xl p-4 transition-all duration-200 border relative overflow-hidden cursor-pointer ${
                  isSelected
                    ? isMage
                      ? 'bg-[#121C32]/95 border-[#38F9D7] shadow-[0_0_25px_-4px_rgba(56,249,215,0.35)] scale-[1.01]'
                      : 'bg-[#22190F]/95 border-[#FFB800] shadow-[0_0_25px_-4px_rgba(255,184,0,0.38)] scale-[1.01]'
                    : 'bg-[#0C111E]/75 border-slate-800/80 hover:border-slate-600 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="shrink-0">
                    <HeroAvatarSvg heroId={id} className="w-16 h-16" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: hero.primaryColor }}
                      >
                        {hero.title}
                      </span>
                      {isSelected && (
                        <span
                          className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: isMage ? 'rgba(56,249,215,0.16)' : 'rgba(255,184,0,0.18)',
                            color: hero.primaryColor,
                          }}
                        >
                          Choisi
                        </span>
                      )}
                    </div>
                    <h2 className="font-display text-lg font-bold text-[#F3F6FA] mt-0.5">
                      {hero.name}
                    </h2>
                    <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
                      <strong className="text-[#F3F6FA]">{hero.weaponName} :</strong> {hero.weaponDesc}
                    </p>
                  </div>
                </div>

                {/* Passive & Stat Pills */}
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="text-[#94A3B8]">
                    Don : <strong style={{ color: hero.primaryColor }}>{hero.passiveName}</strong>
                  </span>
                  <div className="flex items-center gap-2 font-mono-tabular text-xs">
                    <span className="px-2 py-0.5 rounded bg-[#080B14]/80 text-[#F3F6FA]">
                      PV {hero.baseStats.maxHp}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded bg-[#080B14]/80"
                      style={{ color: hero.primaryColor }}
                    >
                      {isMage ? 'Tir Perforant' : 'Impact Explosif'}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Mode & Controls Strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#080B14]/75 border border-slate-800/90 rounded-xl px-4 py-3 mb-6 text-xs text-[#94A3B8]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#38F9D7]" />
              <span>
                <strong className="text-[#F3F6FA]">ZQSD / Flèches</strong> : Déplacement ou Bastion au Sanctuaire
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#FFB800]" />
              <span>
                <strong className="text-[#F3F6FA]">Espace / Clic Droit</strong> : Nova Solaire
              </span>
            </span>
          </div>

          {/* Aim Mode Selector */}
          <div className="flex items-center gap-1.5 shrink-0 bg-[#121829] p-1 rounded-lg border border-slate-700/70">
            <button
              type="button"
              onClick={() => onToggleAimMode('cursor')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                aimMode === 'cursor'
                  ? 'bg-[#38F9D7]/20 text-[#38F9D7] border border-[#38F9D7]/40'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              Visée Curseur
            </button>
            <button
              type="button"
              onClick={() => onToggleAimMode('auto')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                aimMode === 'auto'
                  ? 'bg-[#FFB800]/20 text-[#FFB800] border border-[#FFB800]/40'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Visée Auto
            </button>
          </div>
        </div>

        {/* Primary Launch CTA */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onStartGame}
            className="w-full sm:w-auto min-w-[270px] py-3.5 px-8 rounded-xl font-display font-bold text-base uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-lg hover:scale-[1.02] active:scale-[0.99]"
            style={{
              background:
                selectedHero === 'mage'
                  ? 'linear-gradient(135deg, #38F9D7 0%, #00B4D8 100%)'
                  : 'linear-gradient(135deg, #FFB800 0%, #FF6B00 100%)',
              color: '#080B14',
              boxShadow:
                selectedHero === 'mage'
                  ? '0 0 30px rgba(56, 249, 215, 0.45)'
                  : '0 0 30px rgba(255, 184, 0, 0.45)',
            }}
          >
            Lancer le Rituel
          </button>
        </div>
      </div>
    </div>
  );
};
