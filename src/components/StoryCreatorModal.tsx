import React, { useState } from 'react';
import { Sparkles, BookOpen, Wand2, X, AlertCircle, Loader2, Check } from 'lucide-react';
import { Story, ImageResolution } from '../types';

interface StoryCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated: (newStory: Story) => void;
}

const STORY_IDEAS = [
  "A fluffy kitten who secretly captains a pirate ship of mice",
  "A girl whose drawings come to life when she giggles",
  "A lonely star who falls to earth and makes friends with an owl",
  "A young baker whose cupcakes give animals magical powers",
  "A shy robot who learns to dance in the autumn rain",
];

export const StoryCreatorModal: React.FC<StoryCreatorModalProps> = ({
  isOpen,
  onClose,
  onStoryCreated,
}) => {
  const [prompt, setPrompt] = useState('');
  const [ageGroup, setAgeGroup] = useState<'3-5' | '6-8' | '9-12'>('6-8');
  const [theme, setTheme] = useState('Courage & Friendship');
  const [numPages, setNumPages] = useState<number>(4);
  const [complexity, setComplexity] = useState<'standard' | 'complex'>('standard');
  const [initialImageSize, setInitialImageSize] = useState<ImageResolution>('2K');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          ageGroup,
          theme,
          numPages,
          complexity, // 'complex' -> gemini-4-argon, 'standard' -> gemini-3.8-flash
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.story || !data.story.pages) {
        throw new Error(data.error || 'Failed to craft story');
      }

      const generated = data.story;
      const newStory: Story = {
        id: `story-${Date.now()}`,
        title: generated.title || 'My Magical Story',
        synopsis: generated.synopsis || prompt,
        moral: generated.moral,
        author: 'You & Gemini AI',
        targetAge: ageGroup,
        theme,
        isCustom: true,
        pages: generated.pages.map((p: any, index: number) => ({
          pageNumber: index + 1,
          text: p.text,
          imagePrompt: p.imagePrompt,
          readerMood: p.readerMood,
          // Placeholder or initial generated visual
          imageUrl: `https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1000&auto=format&fit=crop&q=80`,
        })),
      };

      onStoryCreated(newStory);
      onClose();
    } catch (err: any) {
      console.error('Error creating story:', err);
      setError(err?.message || 'Could not spin this yarn right now. Try again!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border-4 border-amber-300 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 p-5 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl shadow-inner border border-white/30">
              ✨
            </div>
            <div>
              <h3 className="text-2xl font-bold font-fun tracking-wide">
                Magic Story Maker
              </h3>
              <p className="text-xs text-amber-100 font-medium">
                Invent a brand new illustrated book for bedtime
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border-2 border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Prompt */}
          <div>
            <label className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-1.5">
              <Wand2 className="w-4 h-4 text-amber-500" />
              What is your story about?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              disabled={isLoading}
              placeholder="e.g. A baby sea turtle who dreamed of flying with the seagulls..."
              className="w-full p-3.5 rounded-2xl border-2 border-amber-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 outline-none text-slate-800 font-medium text-sm transition-all"
            />

            {/* Starter Idea chips */}
            <div className="mt-2">
              <span className="text-[11px] font-bold text-slate-500 block mb-1">
                Need an idea? Tap one:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {STORY_IDEAS.map((idea, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(idea)}
                    disabled={isLoading}
                    className="text-xs px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-full border border-amber-200 font-medium transition-all"
                  >
                    💡 {idea}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Age Group & Pages */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Target Age Group:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['3-5', '6-8', '9-12'] as const).map((age) => (
                  <button
                    key={age}
                    type="button"
                    onClick={() => setAgeGroup(age)}
                    disabled={isLoading}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      ageGroup === age
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {age} yrs
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Number of Pages:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[3, 4, 5].map((pages) => (
                  <button
                    key={pages}
                    type="button"
                    onClick={() => setNumPages(pages)}
                    disabled={isLoading}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      numPages === pages
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {pages} Pages
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI Intelligence Mode */}
          <div className="p-3.5 bg-purple-50/70 rounded-2xl border border-purple-200">
            <label className="text-xs font-bold text-purple-900 block mb-1">
              Story Crafting Engine:
            </label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                onClick={() => setComplexity('standard')}
                disabled={isLoading}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  complexity === 'standard'
                    ? 'border-purple-400 bg-white shadow-xs ring-2 ring-purple-300'
                    : 'border-purple-200 bg-purple-100/40 opacity-70'
                }`}
              >
                <div className="font-bold text-xs text-purple-900 flex items-center gap-1">
                  <span>⚡ Standard Author</span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">gemini-3.8-flash</p>
                <p className="text-[11px] text-slate-600 mt-1">Snappy, engaging children's tales</p>
              </button>

              <button
                type="button"
                onClick={() => setComplexity('complex')}
                disabled={isLoading}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  complexity === 'complex'
                    ? 'border-purple-500 bg-white shadow-xs ring-2 ring-purple-300'
                    : 'border-purple-200 bg-purple-100/40 opacity-70'
                }`}
              >
                <div className="font-bold text-xs text-purple-900 flex items-center gap-1">
                  <span>🧠 Epic Argon Craft</span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">gemini-4-argon</p>
                <p className="text-[11px] text-slate-600 mt-1">Intricate plot, rich poetic imagery</p>
              </button>
            </div>
          </div>

          {/* Image Resolution Preference for Illustrations (gemini-3-pro-image-preview) */}
          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-amber-900">
                Default Illustration Quality (`gemini-3-pro-image-preview`):
              </label>
              <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                1K • 2K • 4K
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['1K', '2K', '4K'] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setInitialImageSize(size)}
                  disabled={isLoading}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                    initialImageSize === size
                      ? 'border-amber-500 bg-white shadow-xs text-amber-900 ring-2 ring-amber-300'
                      : 'border-amber-200 bg-white/60 text-slate-600'
                  }`}
                >
                  {size} Quality
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isLoading || !prompt.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 hover:from-purple-600 hover:to-amber-600 active:scale-95 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Spinning Yarn with {complexity === 'complex' ? 'Argon' : 'Flash'}...</span>
              </>
            ) : (
              <>
                <BookOpen className="w-4 h-4" />
                <span>Weave Story Pages ✨</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
