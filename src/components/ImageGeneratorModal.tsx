import React, { useState } from 'react';
import { Sparkles, Palette, Check, AlertCircle, X, Loader2, Wand2, Info } from 'lucide-react';
import { ImageResolution, AspectRatio, ArtStyle } from '../types';

interface ImageGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageNumber: number;
  initialPrompt: string;
  onImageGenerated: (imageUrl: string, resolution: ImageResolution) => void;
}

const ART_STYLES: { label: string; value: ArtStyle; icon: string }[] = [
  {
    label: "Storybook Watercolor",
    value: "Children's storybook watercolor with soft whimsical lighting",
    icon: "🎨",
  },
  {
    label: "3D Claymation",
    value: "3D claymation cartoon with vibrant textures",
    icon: "🧸",
  },
  {
    label: "Fairytale Classic",
    value: "Classic vintage fairytale illustration, gouache and pastel",
    icon: "🏰",
  },
  {
    label: "Paper Cut-out Collage",
    value: "Colorful paper cut-out collage, playful and layered",
    icon: "✂️",
  },
  {
    label: "Vibrant Anime Story",
    value: "Modern cheerful digital anime picture book",
    icon: "✨",
  },
];

const MAGIC_BOOSTERS = [
  "✨ Add magical glowing fairy dust",
  "🌈 Add a soft double rainbow in the sky",
  "🌙 Make it cozy twilight with lantern glow",
  "🌸 Add blooming pastel wildflowers and butterflies",
  "❄️ Add gentle falling snowflakes and sparkles",
  "🎈 Add colorful floating balloons",
];

export const ImageGeneratorModal: React.FC<ImageGeneratorModalProps> = ({
  isOpen,
  onClose,
  pageNumber,
  initialPrompt,
  onImageGenerated,
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [imageSize, setImageSize] = useState<ImageResolution>('2K');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('4:3');
  const [artStyle, setArtStyle] = useState<ArtStyle>(ART_STYLES[0].value);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          imageSize,
          aspectRatio,
          artStyle,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.imageUrl) {
        throw new Error(data.error || 'Failed to generate illustration. Please try again.');
      }

      onImageGenerated(data.imageUrl, imageSize);
      onClose();
    } catch (err: any) {
      console.error('Image generation error:', err);
      setError(err?.message || 'Could not generate illustration right now.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBooster = (booster: string) => {
    const cleanBooster = booster.replace(/^[^\w\s]+/, '').trim();
    if (!prompt.includes(cleanBooster)) {
      setPrompt((prev) => `${prev.trim()}, ${cleanBooster}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-4 border-amber-300 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 p-5 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl shadow-inner border border-white/30">
              🖌️
            </div>
            <div>
              <h3 className="text-2xl font-bold font-fun tracking-wide flex items-center gap-2">
                Magic Illustrator
                <span className="text-xs bg-white/30 px-2.5 py-0.5 rounded-full font-sans uppercase tracking-wider font-semibold">
                  Page {pageNumber}
                </span>
              </h3>
              <p className="text-xs text-amber-100 font-medium">
                Powered by Gemini 3 Pro Image Preview (`gemini-3-pro-image-preview`)
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border-2 border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
              <div>
                <p className="font-semibold">Oops! The magic brush slipped:</p>
                <p className="text-rose-700">{error}</p>
              </div>
            </div>
          )}

          {/* Prompt Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-amber-500" />
                What should we paint on this page?
              </label>
              <span className="text-xs text-slate-400">Describe characters, action, or surroundings</span>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              disabled={isLoading}
              className="w-full p-3.5 rounded-2xl border-2 border-amber-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 outline-none text-slate-800 font-medium text-sm transition-all"
              placeholder="e.g. A cute friendly green dragon wearing a party hat eating strawberries..."
            />

            {/* Quick Magic Boosters */}
            <div className="mt-2.5">
              <p className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quick Sparkle Boosters:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {MAGIC_BOOSTERS.map((booster, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddBooster(booster)}
                    disabled={isLoading}
                    className="text-xs px-2.5 py-1 bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-800 rounded-full border border-amber-200 transition-all font-medium"
                  >
                    {booster}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* REQUIRED AFFORDANCE: User selects Image Size (1K, 2K, 4K) */}
          <div className="p-4 bg-amber-50/70 rounded-2xl border-2 border-amber-200/80">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="text-lg">📐</span>
                Select Illustration Resolution:
              </label>
              <span className="text-xs font-bold text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded-md">
                Affordance: 1K • 2K • 4K
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Choose the fidelity level generated by <code className="bg-white px-1.5 py-0.5 rounded text-amber-900 font-mono text-[11px]">gemini-3-pro-image-preview</code>:
            </p>

            <div className="grid grid-cols-3 gap-2.5">
              {(
                [
                  {
                    size: '1K',
                    label: '1K Resolution',
                    desc: 'Fast & Playful',
                    badge: 'Quick Magic',
                    color: 'border-emerald-300 bg-emerald-50 text-emerald-800',
                  },
                  {
                    size: '2K',
                    label: '2K Resolution',
                    desc: 'Super Crisp Detail',
                    badge: 'Recommended',
                    color: 'border-amber-400 bg-amber-100 text-amber-900',
                  },
                  {
                    size: '4K',
                    label: '4K Resolution',
                    desc: 'Ultra Masterpiece',
                    badge: 'Maximum Clarity',
                    color: 'border-purple-300 bg-purple-50 text-purple-900',
                  },
                ] as const
              ).map((item) => {
                const isSelected = imageSize === item.size;
                return (
                  <button
                    key={item.size}
                    type="button"
                    onClick={() => setImageSize(item.size)}
                    disabled={isLoading}
                    className={`relative p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? `${item.color} shadow-md scale-[1.02] ring-2 ring-amber-400/50`
                        : 'border-slate-200 bg-white hover:border-amber-300 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-base font-fun">{item.size}</span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-semibold">{item.desc}</p>
                    </div>
                    <span className="mt-2 text-[10px] uppercase font-bold tracking-wider opacity-80">
                      {item.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Art Style Selector */}
          <div>
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
              <Palette className="w-4 h-4 text-purple-500" />
              Illustration Art Style:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ART_STYLES.map((style) => {
                const isSelected = artStyle === style.value;
                return (
                  <button
                    key={style.label}
                    type="button"
                    onClick={() => setArtStyle(style.value)}
                    disabled={isLoading}
                    className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'border-purple-400 bg-purple-50 text-purple-900 font-semibold ring-2 ring-purple-200'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-lg">{style.icon}</span>
                    <span className="truncate">{style.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aspect Ratio Selector */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold text-slate-600">Page Layout Shape:</span>
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              {(
                [
                  { value: '4:3', label: 'Storybook 4:3' },
                  { value: '1:1', label: 'Square 1:1' },
                  { value: '16:9', label: 'Wide 16:9' },
                ] as const
              ).map((ratio) => (
                <button
                  key={ratio.value}
                  type="button"
                  onClick={() => setAspectRatio(ratio.value)}
                  disabled={isLoading}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    aspectRatio === ratio.value
                      ? 'bg-white shadow text-amber-700'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {ratio.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-amber-500" />
            <span>Generates directly onto Page {pageNumber} with {imageSize} quality</span>
          </div>

          <div className="flex items-center gap-3">
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
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 active:scale-95 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Painting Page ({imageSize})...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Paint Illustration ({imageSize})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
