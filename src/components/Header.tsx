import React from 'react';
import { BookOpen, Sparkles, Wand2, MessageCircle, Volume2, Palette } from 'lucide-react';

interface HeaderProps {
  onOpenLibrary: () => void;
  onOpenCreateStory: () => void;
  onOpenCompanionChat: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenLibrary,
  onOpenCreateStory,
  onOpenCompanionChat,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-amber-50/90 backdrop-blur-md border-b-2 border-amber-200/80 px-4 sm:px-8 py-3 transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <div
          onClick={onOpenLibrary}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-400 to-rose-400 p-0.5 shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-xl">
              📖
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-fun text-2xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent tracking-wide">
                StoryWonder
              </span>
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin-slow" />
            </div>
            <p className="text-[11px] font-semibold text-amber-800/80 tracking-wide">
              Kids Read-Aloud & AI Illustrator
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Library Button */}
          <button
            onClick={onOpenLibrary}
            className="px-3 sm:px-4 py-2 rounded-2xl bg-white hover:bg-amber-100 border border-amber-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Story Library</span>
            <span className="sm:hidden">Library</span>
          </button>

          {/* Create Book Button */}
          <button
            onClick={onOpenCreateStory}
            className="px-3 sm:px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-purple-500/20"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Magic Story Maker</span>
            <span className="sm:hidden">New Story</span>
          </button>

          {/* Ask Companion Chatbot */}
          <button
            onClick={onOpenCompanionChat}
            className="px-3 sm:px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-orange-500/20"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Story Buddy 🦉</span>
          </button>
        </div>
      </div>
    </header>
  );
};
