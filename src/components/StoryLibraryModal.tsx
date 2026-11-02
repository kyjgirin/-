import React from 'react';
import { BookOpen, Star, Trash2, X, Sparkles, ArrowRight } from 'lucide-react';
import { Story } from '../types';

interface StoryLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  stories: Story[];
  currentStoryId: string;
  onSelectStory: (storyId: string) => void;
  onDeleteCustomStory?: (storyId: string) => void;
  onOpenCreateStory: () => void;
}

export const StoryLibraryModal: React.FC<StoryLibraryModalProps> = ({
  isOpen,
  onClose,
  stories,
  currentStoryId,
  onSelectStory,
  onDeleteCustomStory,
  onOpenCreateStory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border-4 border-amber-300 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 p-5 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl shadow-inner border border-white/30">
              📚
            </div>
            <div>
              <h3 className="text-2xl font-bold font-fun tracking-wide">
                Storybook Library
              </h3>
              <p className="text-xs text-amber-100 font-medium">
                Choose a magical tale to read aloud and illustrate
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {stories.length} Books Available
            </p>
            <button
              onClick={() => {
                onClose();
                onOpenCreateStory();
              }}
              className="text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Create New Book</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stories.map((story) => {
              const isCurrent = story.id === currentStoryId;
              const firstImage = story.pages[0]?.imageUrl || story.coverImage;

              return (
                <div
                  key={story.id}
                  className={`p-4 rounded-3xl border-2 transition-all flex flex-col justify-between relative group ${
                    isCurrent
                      ? 'border-amber-400 bg-amber-50/70 shadow-md ring-2 ring-amber-300'
                      : 'border-slate-200 bg-white hover:border-amber-300 hover:shadow-sm'
                  }`}
                >
                  <div>
                    {/* Story Preview Image */}
                    <div className="w-full h-36 rounded-2xl overflow-hidden mb-3 bg-amber-100 relative">
                      {firstImage ? (
                        <img
                          src={firstImage}
                          alt={story.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">
                          📖
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-slate-900/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {story.pages.length} Pages
                      </div>
                      {story.isCustom && (
                        <div className="absolute top-2 right-2 bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> Custom
                        </div>
                      )}
                    </div>

                    <h4 className="font-fun text-lg font-bold text-slate-800 line-clamp-1 mb-1">
                      {story.title}
                    </h4>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                      {story.synopsis}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Ages {story.targetAge}
                    </span>

                    <div className="flex items-center gap-2">
                      {story.isCustom && onDeleteCustomStory && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCustomStory(story.id);
                          }}
                          title="Delete custom book"
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          onSelectStory(story.id);
                          onClose();
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          isCurrent
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                        }`}
                      >
                        <span>{isCurrent ? 'Reading Now' : 'Read Book'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
