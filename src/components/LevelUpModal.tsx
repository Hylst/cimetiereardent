import React, { useEffect } from 'react';
import { RelicDefinition, RelicId } from '../types/game';
import { RelicSvgIcon } from './RelicIcon';
import { Sparkles } from 'lucide-react';

interface LevelUpModalProps {
  level: number;
  choices: RelicDefinition[];
  relicLevels: Record<RelicId, number>;
  onSelectRelic: (relicId: RelicId) => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  level,
  choices,
  relicLevels,
  onSelectRelic,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1' && choices[0]) onSelectRelic(choices[0].id);
      if (e.key === '2' && choices[1]) onSelectRelic(choices[1].id);
      if (e.key === '3' && choices[2]) onSelectRelic(choices[2].id);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [choices, onSelectRelic]);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#080B14]/65 backdrop-blur-sm pointer-events-auto">
      <div className="max-w-4xl w-full">
        {/* Level-Up Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFB800]/15 border border-[#FFB800]/40 text-xs font-mono-tabular uppercase tracking-widest text-[#FFB800] mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Niveau {level} Atteint</span>
          </div>
          <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#F3F6FA] text-glow-gold uppercase tracking-wider">
            Choisissez une Bénédiction de Lumière
          </h2>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Cliquez sur une relique ou appuyez sur <span className="font-mono-tabular text-[#38F9D7]">[1] [2] [3]</span> pour imprégner votre arme.
          </p>
        </div>

        {/* 3-Card Horizontal Grid (24px gap) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {choices.map((relic, index) => {
            const currentLv = relicLevels[relic.id] || 0;
            const isGold = relic.accent === 'gold';
            const isViolet = relic.accent === 'violet';

            const borderColor = isGold
              ? 'border-[#FFB800]/45 hover:border-[#FFB800]'
              : isViolet
              ? 'border-[#9D4EDD]/45 hover:border-[#9D4EDD]'
              : 'border-[#38F9D7]/45 hover:border-[#38F9D7]';

            const accentColor = isGold ? '#FFB800' : isViolet ? '#9D4EDD' : '#38F9D7';

            return (
              <button
                key={relic.id}
                type="button"
                onClick={() => onSelectRelic(relic.id)}
                className={`group glass-panel rounded-2xl p-6 text-left flex flex-col justify-between transition-all duration-200 hover:-translate-y-1.5 hover:scale-[1.02] cursor-pointer border ${borderColor}`}
                style={{
                  boxShadow: `0 14px 36px -10px rgba(0, 0, 0, 0.8), 0 0 24px -6px ${
                    isGold
                      ? 'rgba(255, 184, 0, 0.22)'
                      : isViolet
                      ? 'rgba(157, 78, 221, 0.22)'
                      : 'rgba(56, 249, 215, 0.22)'
                  }`,
                }}
              >
                <div>
                  {/* 1. Custom SVG Icon + Rarity/Level Pill */}
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center border transition-transform duration-200 group-hover:scale-110"
                      style={{
                        backgroundColor: 'rgba(8, 11, 20, 0.75)',
                        borderColor: `${accentColor}55`,
                      }}
                    >
                      <RelicSvgIcon relicId={relic.id} className="w-9 h-9" />
                    </div>

                    <div className="text-right">
                      <span
                        className="inline-block text-[10px] font-mono-tabular uppercase tracking-wider px-2.5 py-0.5 rounded-full border"
                        style={{
                          color: accentColor,
                          borderColor: `${accentColor}44`,
                          backgroundColor: `${accentColor}15`,
                        }}
                      >
                        {currentLv === 0 ? 'Nouveau' : `Niv. ${currentLv} → ${currentLv + 1}`}
                      </span>
                      <div className="text-[11px] font-mono-tabular text-[#64748B] mt-1">
                        Touche [{index + 1}]
                      </div>
                    </div>
                  </div>

                  {/* 2. Relic Title */}
                  <h3 className="font-display text-lg font-bold text-[#F3F6FA] group-hover:text-white mb-2">
                    {relic.name}
                  </h3>

                  {/* 3. 1-Sentence Effect Description */}
                  <p className="text-sm text-[#94A3B8] leading-relaxed">
                    {relic.description}
                  </p>
                </div>

                <div
                  className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-medium"
                  style={{ color: accentColor }}
                >
                  <span>{relic.rarity}</span>
                  <span className="opacity-80 group-hover:translate-x-1 transition-transform">
                    Choisir &rarr;
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
