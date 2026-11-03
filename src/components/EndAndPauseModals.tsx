import React from 'react';
import { HeroId, RelicId, RunStats } from '../types/game';
import { HEROES, RELIC_MAP } from '../data/relics';
import { HeroAvatarSvg, RelicSvgIcon } from './RelicIcon';
import { Play, RotateCcw, Skull, Sparkles, Trophy, Users } from 'lucide-react';

interface PauseModalProps {
  heroId: HeroId;
  stats: RunStats;
  onResume: () => void;
  onRestart: () => void;
  onReturnTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  heroId,
  stats,
  onResume,
  onRestart,
  onReturnTitle,
}) => {
  const hero = HEROES[heroId];

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#080B14]/70 backdrop-blur-sm pointer-events-auto">
      <div className="glass-panel max-w-md w-full rounded-2xl p-6 text-center border border-[#38F9D7]/35">
        <div className="flex justify-center mb-3">
          <HeroAvatarSvg heroId={heroId} className="w-16 h-16" />
        </div>
        <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-[#F3F6FA]">
          Rituel en Pause
        </h2>
        <p className="text-xs text-[#94A3B8] mt-1">
          {hero.name} &bull; Vague {stats.wave} &bull; {stats.kills} Squelettes Purifiés
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onResume}
            className="w-full py-3 px-5 rounded-xl font-display font-bold text-sm uppercase tracking-wider bg-[#38F9D7] text-[#080B14] hover:brightness-110 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            Reprendre le Combat
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="w-full py-2.5 px-5 rounded-xl font-medium text-sm bg-[#121829] text-[#F3F6FA] border border-slate-700 hover:border-[#FFB800] transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-[#FFB800]" />
            Recommencer la Partie
          </button>

          <button
            type="button"
            onClick={onReturnTitle}
            className="w-full py-2.5 px-5 rounded-xl font-medium text-sm bg-transparent text-[#94A3B8] hover:text-white transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Users className="w-4 h-4" />
            Changer de Gardien
          </button>
        </div>
      </div>
    </div>
  );
};

interface GameOverModalProps {
  heroId: HeroId;
  stats: RunStats;
  relicLevels: Record<RelicId, number>;
  isNewRecord: boolean;
  onReplay: () => void;
  onReturnTitle: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  heroId,
  stats,
  relicLevels,
  isNewRecord,
  onReplay,
  onReturnTitle,
}) => {
  const hero = HEROES[heroId];
  const minutes = Math.floor(stats.elapsedSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(stats.elapsedSeconds % 60)
    .toString()
    .padStart(2, '0');

  const collectedRelics = (Object.keys(relicLevels) as RelicId[]).filter(
    (id) => relicLevels[id] > 0
  );

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#080B14]/75 backdrop-blur-md pointer-events-auto">
      <div className="glass-panel max-w-lg w-full rounded-2xl p-6 sm:p-8 text-center border border-[#EF476F]/45 relative overflow-hidden">
        {isNewRecord && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFB800]/20 border border-[#FFB800]/50 text-xs font-mono-tabular text-[#FFB800] mb-3">
            <Trophy className="w-3.5 h-3.5" />
            <span>Nouveau Record du Sanctuaire !</span>
          </div>
        )}

        <h2 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-wider text-[#F3F6FA] text-glow-gold">
          La Lumière Vacille
        </h2>
        <p className="text-sm text-[#94A3B8] mt-1">
          {hero.name} a vaillamment défendu le cimetière face aux ténèbres.
        </p>

        {/* Key Run Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          <div className="bg-[#080B14]/80 border border-slate-800 rounded-xl p-3">
            <div className="text-[11px] uppercase tracking-wider text-[#94A3B8]">
              Vagues Survécues
            </div>
            <div className="font-mono-tabular text-2xl font-bold text-[#38F9D7] mt-1">
              {stats.wave}
            </div>
          </div>

          <div className="bg-[#080B14]/80 border border-slate-800 rounded-xl p-3">
            <div className="text-[11px] uppercase tracking-wider text-[#94A3B8]">
              Squelettes Purifiés
            </div>
            <div className="font-mono-tabular text-2xl font-bold text-[#F3F6FA] mt-1 flex items-center justify-center gap-1">
              <Skull className="w-4 h-4 text-[#94A3B8]" />
              {stats.kills}
            </div>
          </div>

          <div className="bg-[#080B14]/80 border border-slate-800 rounded-xl p-3">
            <div className="text-[11px] uppercase tracking-wider text-[#94A3B8]">
              Niveau Atteint
            </div>
            <div className="font-mono-tabular text-2xl font-bold text-[#FFB800] mt-1 flex items-center justify-center gap-1">
              <Sparkles className="w-4 h-4 text-[#FFB800]" />
              {stats.level}
            </div>
          </div>

          <div className="bg-[#080B14]/80 border border-slate-800 rounded-xl p-3">
            <div className="text-[11px] uppercase tracking-wider text-[#94A3B8]">
              Temps Tenu
            </div>
            <div className="font-mono-tabular text-2xl font-bold text-[#06D6A0] mt-1">
              {minutes}:{seconds}
            </div>
          </div>
        </div>

        {/* Score Banner */}
        <div className="bg-[#121829]/90 border border-[#FFB800]/30 rounded-xl py-2.5 px-4 mb-5 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-[#94A3B8]">
            Score Lumineux Final
          </span>
          <span className="font-mono-tabular text-lg font-bold text-[#FFB800]">
            {stats.score.toLocaleString('fr-FR')} pts
          </span>
        </div>

        {/* Relics Acquired */}
        {collectedRelics.length > 0 && (
          <div className="mb-6 text-left">
            <div className="text-xs uppercase tracking-wider text-[#94A3B8] mb-2 text-center">
              Reliques Imprégnées
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {collectedRelics.map((id) => (
                <div
                  key={id}
                  className="bg-[#080B14]/85 border border-slate-700/80 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 text-xs"
                >
                  <RelicSvgIcon relicId={id} className="w-4 h-4" />
                  <span className="text-[#F3F6FA] font-medium">{RELIC_MAP[id].name}</span>
                  <span className="font-mono-tabular text-[#38F9D7] font-bold">
                    Niv.{relicLevels[id]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onReplay}
            className="flex-1 py-3.5 px-6 rounded-xl font-display font-bold text-sm uppercase tracking-wider text-[#080B14] transition hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
            style={{
              background:
                heroId === 'mage'
                  ? 'linear-gradient(135deg, #38F9D7 0%, #00B4D8 100%)'
                  : 'linear-gradient(135deg, #FFB800 0%, #FF6B00 100%)',
              boxShadow: '0 0 24px rgba(56, 249, 215, 0.35)',
            }}
          >
            <RotateCcw className="w-4 h-4" />
            Rejouer
          </button>

          <button
            type="button"
            onClick={onReturnTitle}
            className="py-3.5 px-5 rounded-xl font-medium text-sm bg-[#121829] text-[#F3F6FA] border border-slate-700 hover:border-[#38F9D7] transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Users className="w-4 h-4" />
            Changer de Héros
          </button>
        </div>
      </div>
    </div>
  );
};
