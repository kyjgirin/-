import React from 'react';
import { Sparkles, X, Volume2, Bookmark, Check } from 'lucide-react';

interface WordExplainerModalProps {
  word: string | null;
  sentenceContext?: string;
  explanation: string | null;
  isLoading: boolean;
  onClose: () => void;
  onSpeakWord: (word: string) => void;
}

export const WordExplainerModal: React.FC<WordExplainerModalProps> = ({
  word,
  sentenceContext,
  explanation,
  isLoading,
  onClose,
  onSpeakWord,
}) => {
  if (!word) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border-4 border-amber-300 p-6 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-2xl shadow-inner">
            🦉
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Word Explorer (Fast Gemini 3.1 Lite)
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <h3 className="text-2xl font-bold font-fun text-slate-800 capitalize">
                {word.replace(/[^a-zA-Z]/g, '')}
              </h3>
              <button
                onClick={() => onSpeakWord(word)}
                title="Hear pronunciation"
                className="w-8 h-8 rounded-full bg-amber-400 hover:bg-amber-500 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200/80 mb-4 min-h-[100px] flex items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2 text-amber-700 py-3">
              <div className="w-6 h-6 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold">Barnaby is looking up "{word}"...</p>
            </div>
          ) : (
            <div className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-medium">
              {explanation || "A fun word to know in your magical vocabulary!"}
            </div>
          )}
        </div>

        {sentenceContext && (
          <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200 mb-4 italic">
            In this story: "{sentenceContext}"
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
        >
          Got It! Let's Keep Reading ✨
        </button>
      </div>
    </div>
  );
};
