import React from 'react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-sm select-none">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-red-500/40 bg-slate-900 shadow-2xl shadow-red-500/10">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 p-4 sm:p-5 text-white">
          <div className="flex items-center gap-2.5">
            <span className="text-xl sm:text-2xl">ℹ️</span>
            <h2 className="text-lg sm:text-xl font-bold tracking-wide">Comment Cimetière Ardent a été fait</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition cursor-pointer"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6 space-y-3.5 text-slate-300 text-xs sm:text-sm leading-relaxed">
          <p>
            <strong className="text-red-400">Stack :</strong> React 19, TypeScript 5.9, Tailwind CSS 4, Vite 7, Lucide Icons, distribution single-file.
          </p>
          <p>
            <strong className="text-red-400">Graphismes :</strong> Canvas 2D nocturne avec dalles pavées, sanctuaires circulaires, cercles de runes enflammées et colosses spectraux animés.
          </p>
          <p>
            <strong className="text-red-400">Musique &amp; sons :</strong> Web Audio API avec générateur d ondes pour pulsations arcaniques, incantations de reliques et explosions de braise.
          </p>
          <p>
            <strong className="text-red-400">Interactions :</strong> Contrôles clavier ZQSD / Flèches, mode ciblage libre au curseur ou ciblage automatique pour mobile, bouton d arcane.
          </p>
          <p>
            <strong className="text-red-400">Architecture :</strong> Rendu scindé (graveyardRenderer), modales de niveau et de pause indépendantes, gestionnaire de reliques (relics.ts) avec modificateurs statistiques empilables.
          </p>
          <p>
            <strong className="text-red-400">Algorithmes notables :</strong> Vagues d assaut à intensité exponentielle, placement des pierres tombales évitant les voies cardinales, calcul de dégâts de zone et dispersion des colosses.
          </p>
        </div>

        <div className="bg-slate-950 p-3 sm:p-4 text-center border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl font-bold text-white bg-red-600 hover:bg-red-500 transition cursor-pointer text-sm shadow-md"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
