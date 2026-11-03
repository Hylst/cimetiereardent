import React from 'react';
import { AimMode, HeroId, PlayerState, RelicId, RunStats } from '../types/game';
import { RELIC_MAP } from '../data/relics';
import { RelicSvgIcon } from './RelicIcon';
import {
  Crosshair,
  Heart,
  Pause,
  Skull,
  Sparkles,
  Volume2,
  VolumeX,
  Zap,
  ShieldCheck,
} from 'lucide-react';

interface GameHudProps {
  heroId: HeroId;
  player: PlayerState;
  stats: RunStats;
  relicLevels: Record<RelicId, number>;
  aimMode: AimMode;
  onToggleAimMode: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onTriggerNova: () => void;
  waveBanner: { title: string; subtitle: string } | null;
}

export const GameHud: React.FC<GameHudProps> = ({
  heroId,
  player,
  stats,
  relicLevels,
  aimMode,
  onToggleAimMode,
  isMuted,
  onToggleMute,
  onPause,
  onTriggerNova,
  waveBanner,
}) => {
  const xpRatio = Math.min(100, Math.max(0, (player.xp / player.xpToNext) * 100));
  const hpRatio = Math.min(100, Math.max(0, (player.hp / player.maxHp) * 100));
  const novaReady = player.novaCooldown <= 0;
  const novaRatio = novaReady
    ? 100
    : Math.max(0, (1 - player.novaCooldown / player.novaMaxCooldown) * 100);

  const minutes = Math.floor(stats.elapsedSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(stats.elapsedSeconds % 60)
    .toString()
    .padStart(2, '0');

  const activeRelicIds = (Object.keys(relicLevels) as RelicId[]).filter(
    (id) => relicLevels[id] > 0
  );

  const hpColor =
    hpRatio > 55 ? '#06D6A0' : hpRatio > 28 ? '#FFD166' : '#EF476F';

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between">
      {/* 1. Top-Edge 4px Luminous XP Ribbon */}
      <div className="w-full h-1.5 bg-[#080B14]/90 relative overflow-hidden">
        <div
          className="h-full transition-all duration-150"
          style={{
            width: `${xpRatio}%`,
            background: 'linear-gradient(90deg, #38F9D7 0%, #FFB800 100%)',
            boxShadow: '0 0 12px rgba(56, 249, 215, 0.8)',
          }}
        />
      </div>

      {/* 2. Top Peripheral HUD Row (16px-20px inset padding) */}
      <div className="w-full px-4 sm:px-6 pt-3 flex items-start justify-between gap-3">
        {/* TOP-LEFT CLUSTER: Health Bar, Level, Sanctuary Buff & Relics */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          <div className="glass-panel rounded-xl px-3.5 py-2.5 flex items-center gap-3">
            {/* Level Badge */}
            <div
              className="px-2.5 py-1 rounded-lg font-mono-tabular text-xs font-bold border"
              style={{
                borderColor: heroId === 'mage' ? 'rgba(56,249,215,0.4)' : 'rgba(255,184,0,0.4)',
                backgroundColor: heroId === 'mage' ? 'rgba(56,249,215,0.12)' : 'rgba(255,184,0,0.12)',
                color: heroId === 'mage' ? '#38F9D7' : '#FFB800',
              }}
            >
              Niv. {player.level}
            </div>

            {/* Compact Health Bar (180px width) */}
            <div className="w-[165px] sm:w-[180px]">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="inline-flex items-center gap-1 font-medium text-[#F3F6FA]">
                  <Heart className="w-3.5 h-3.5" style={{ color: hpColor, fill: hpColor }} />
                  Vitalité
                </span>
                <span className="font-mono-tabular text-xs text-[#F3F6FA]">
                  {Math.ceil(player.hp)} / {player.maxHp}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#080B14] overflow-hidden border border-slate-800">
                <div
                  className="h-full transition-all duration-150 rounded-full"
                  style={{
                    width: `${hpRatio}%`,
                    backgroundColor: hpColor,
                    boxShadow: `0 0 8px ${hpColor}`,
                  }}
                />
              </div>
            </div>

            {/* Nova Active Skill Button */}
            <button
              type="button"
              onClick={onTriggerNova}
              title="Déclencher la Nova de Lumière (Espace ou Clic Droit)"
              className={`relative px-2.5 py-1.5 rounded-lg border text-xs font-mono-tabular flex items-center gap-1.5 transition cursor-pointer overflow-hidden ${
                novaReady
                  ? 'border-[#FFB800] bg-[#FFB800]/20 text-[#FFFBEB] hover:bg-[#FFB800]/30 shadow-[0_0_12px_rgba(255,184,0,0.35)]'
                  : 'border-slate-800 bg-[#080B14]/70 text-[#64748B]'
              }`}
            >
              {!novaReady && (
                <div
                  className="absolute bottom-0 left-0 h-0.5 bg-[#FFB800]"
                  style={{ width: `${novaRatio}%` }}
                />
              )}
              <Zap className={`w-3.5 h-3.5 ${novaReady ? 'text-[#FFB800]' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">
                {novaReady ? 'Nova [Espace]' : `${player.novaCooldown.toFixed(1)}s`}
              </span>
            </button>
          </div>

          {/* Sanctuary Status Pill & Collected Relics Strip */}
          <div className="flex flex-wrap items-center gap-1.5 max-w-xs sm:max-w-md">
            {player.inSanctuary && (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#06D6A0]/15 border border-[#06D6A0]/40 text-[11px] font-medium text-[#06D6A0]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Sanctuaire Actif (+Soin &amp; Cadence)</span>
              </div>
            )}

            {activeRelicIds.map((id) => {
              const relic = RELIC_MAP[id];
              const lv = relicLevels[id];
              return (
                <div
                  key={id}
                  title={`${relic.name} (Niv. ${lv})  :  ${relic.description}`}
                  className="glass-panel rounded-lg px-1.5 py-1 flex items-center gap-1 border border-slate-700/70"
                >
                  <RelicSvgIcon relicId={id} className="w-4 h-4" />
                  <span className="font-mono-tabular text-[10px] font-bold text-[#F3F6FA]">
                    {lv}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* TOP-CENTER BANNER: Current Wave & Elapsed Timer */}
        <div className="flex flex-col items-center gap-2">
          <div className="glass-panel rounded-xl px-5 py-2 text-center border border-[#38F9D7]/30">
            <div className="flex items-center gap-3">
              <span className="font-display text-base sm:text-lg font-bold tracking-wider uppercase text-[#F3F6FA] text-glow-cyan">
                Vague {stats.wave}
              </span>
              <span className="text-slate-600">|</span>
              <span className="font-mono-tabular text-sm sm:text-base font-semibold text-[#38F9D7]">
                {minutes}:{seconds}
              </span>
            </div>
            <div className="text-[11px] font-mono-tabular text-[#94A3B8] mt-0.5">
              Squelettes restants : <strong className="text-[#F3F6FA]">{stats.waveRemainingEnemies}</strong>
            </div>
          </div>

          {/* Boss Health Bar if Colosse du Caveau is active */}
          {stats.bossActive && (
            <div className="glass-panel rounded-xl px-4 py-2 w-64 sm:w-80 border border-[#EF476F]/50">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-display font-bold text-[#EF476F] uppercase tracking-wider">
                  {stats.bossActive.name}
                </span>
                <span className="font-mono-tabular text-[11px] text-[#F3F6FA]">
                  {Math.ceil(stats.bossActive.hp)} PV
                </span>
              </div>
              <div className="w-full h-2 bg-[#080B14] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#EF476F] to-[#9D4EDD] transition-all duration-100"
                  style={{
                    width: `${Math.max(0, (stats.bossActive.hp / stats.bossActive.maxHp) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* TOP-RIGHT CLUSTER: Kills, Score, Aim Mode Toggle, Mute & Pause */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="glass-panel rounded-xl px-3.5 py-2 hidden sm:flex items-center gap-3 text-xs font-mono-tabular">
            <div className="flex items-center gap-1.5 text-[#F3F6FA]" title="Squelettes Purifiés">
              <Skull className="w-3.5 h-3.5 text-[#94A3B8]" />
              <span>{stats.kills}</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="text-[#FFB800] font-semibold">
              {stats.score.toLocaleString('fr-FR')} pts
            </div>
          </div>

          {/* Aim Mode Toggle */}
          <button
            type="button"
            onClick={onToggleAimMode}
            title={
              aimMode === 'cursor'
                ? 'Mode actuel : Visée au Curseur (Cliquer pour passer en Visée Auto)'
                : 'Mode actuel : Visée Automatique (Cliquer pour passer en Visée Curseur)'
            }
            className="glass-panel rounded-xl px-3 py-2.5 flex items-center gap-1.5 text-xs font-medium text-[#F3F6FA] hover:border-[#38F9D7] transition cursor-pointer"
          >
            {aimMode === 'cursor' ? (
              <>
                <Crosshair className="w-4 h-4 text-[#38F9D7]" />
                <span className="hidden md:inline">Curseur</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#FFB800]" />
                <span className="hidden md:inline">Auto</span>
              </>
            )}
          </button>

          {/* Audio Mute Button */}
          <button
            type="button"
            onClick={onToggleMute}
            title={isMuted ? 'Activer le son' : 'Couper le son'}
            className="glass-panel rounded-xl p-2.5 text-[#F3F6FA] hover:border-[#38F9D7] transition cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-[#94A3B8]" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#38F9D7]" />
            )}
          </button>

          {/* Pause Button */}
          <button
            type="button"
            onClick={onPause}
            title="Mettre en pause (P ou Échap)"
            className="glass-panel rounded-xl p-2.5 text-[#F3F6FA] hover:border-[#38F9D7] transition cursor-pointer"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center Wave Announcement Banner (fades in/out automatically) */}
      {waveBanner && (
        <div className="self-center my-auto text-center pointer-events-none animate-float">
          <div className="px-6 py-3 rounded-2xl bg-[#080B14]/75 border border-[#38F9D7]/30 backdrop-blur-md">
            <div className="font-display text-2xl sm:text-4xl font-bold uppercase tracking-widest text-[#F3F6FA] text-glow-cyan">
              {waveBanner.title}
            </div>
            <div className="text-xs sm:text-sm font-mono-tabular text-[#FFB800] mt-1">
              {waveBanner.subtitle}
            </div>
          </div>
        </div>
      )}

      {/* Subtle Bottom Hint Bar */}
      <div className="w-full px-6 pb-2.5 flex justify-center pointer-events-none">
        <div className="text-[11px] text-[#64748B] font-mono-tabular bg-[#080B14]/60 px-3 py-0.5 rounded-full border border-slate-800/60">
          ZQSD / Flèches : Se déplacer &bull; Sanctuaire Central : Soin + Cadence &bull; Espace / Clic Droit : Nova Lumineuse
        </div>
      </div>
    </div>
  );
};
