import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Download,
  Settings2,
  Check,
  Loader2,
  MessageCircle,
  HelpCircle,
  Wand2,
  BookOpen,
  Award,
  Layers,
  ZoomIn
} from 'lucide-react';
import { Story, StoryPage, ImageResolution, VoiceOption } from '../types';
import { VOICE_OPTIONS } from '../data/defaultStories';
import { ImageGeneratorModal } from './ImageGeneratorModal';
import { WordExplainerModal } from './WordExplainerModal';

interface BookReaderProps {
  story: Story;
  onUpdateStoryPage: (pageNumber: number, updatedFields: Partial<StoryPage>) => void;
  onOpenCompanionChat: () => void;
  onOpenLibrary: () => void;
}

export const BookReader: React.FC<BookReaderProps> = ({
  story,
  onUpdateStoryPage,
  onOpenCompanionChat,
  onOpenLibrary,
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [autoAdvance, setAutoAdvance] = useState<boolean>(false);
  const [isVoicePickerOpen, setIsVoicePickerOpen] = useState<boolean>(false);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);

  // Image Generation modal & resolution affordance
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
  const [currentImageSize, setCurrentImageSize] = useState<ImageResolution>('2K');
  const [isFullscreenImage, setIsFullscreenImage] = useState<boolean>(false);

  // Word Explainer
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [sentenceContext, setSentenceContext] = useState<string>('');
  const [wordExplanation, setWordExplanation] = useState<string | null>(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wordIntervalRef = useRef<number | null>(null);

  const totalPages = story.pages.length;
  const currentPage = story.pages[currentPageIndex] || story.pages[0];
  const isLastPage = currentPageIndex === totalPages - 1;

  // Reset page when story changes
  useEffect(() => {
    setCurrentPageIndex(0);
    stopAudio();
  }, [story.id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        goToNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        goToPrevPage();
      } else if (e.key === ' ') {
        e.preventDefault();
        handleToggleAudio();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPageIndex, totalPages, isPlayingAudio]);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (wordIntervalRef.current) {
      clearInterval(wordIntervalRef.current);
      wordIntervalRef.current = null;
    }
    setIsPlayingAudio(false);
    setActiveWordIndex(null);
  };

  /**
   * FEATURE: Read Aloud using gemini-3.8-flash-tts
   */
  const handleToggleAudio = async () => {
    if (isPlayingAudio) {
      stopAudio();
      return;
    }

    // Check if current page already has generated audio for the current voice
    if (currentPage.audioUrl && currentPage.audioVoice === selectedVoice) {
      playAudioStream(currentPage.audioUrl);
      return;
    }

    setIsLoadingAudio(true);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentPage.text,
          voiceName: selectedVoice,
          style: `Enthusiastic and clear bedtime story voice. Mood of this page: ${currentPage.readerMood || 'cheerful and warm'}`,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.audioUrl) {
        throw new Error(data.error || 'Failed to synthesize speech');
      }

      // Save audio to page for instant replay
      onUpdateStoryPage(currentPage.pageNumber, {
        audioUrl: data.audioUrl,
        audioVoice: selectedVoice,
      });

      playAudioStream(data.audioUrl);
    } catch (err) {
      console.error('Error fetching TTS:', err);
      // Fallback: Web Speech API if server-side is temporarily unavailable
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(currentPage.text);
        utterance.rate = playbackSpeed;
        utterance.onend = () => {
          setIsPlayingAudio(false);
          setActiveWordIndex(null);
          if (autoAdvance && currentPageIndex < totalPages - 1) {
            goToNextPage();
          }
        };
        setIsPlayingAudio(true);
        window.speechSynthesis.speak(utterance);
      }
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const playAudioStream = (url: string) => {
    stopAudio();
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.playbackRate = playbackSpeed;

    audio.onplay = () => {
      setIsPlayingAudio(true);
      startWordHighlighting();
    };

    audio.onended = () => {
      stopAudio();
      if (autoAdvance && currentPageIndex < totalPages - 1) {
        goToNextPage();
      } else if (isLastPage) {
        triggerConfettiCelebration();
      }
    };

    audio.onerror = (e) => {
      console.error('Audio playback error:', e);
      stopAudio();
    };

    audio.play().catch((err) => {
      console.warn('Audio play was prevented:', err);
      setIsPlayingAudio(false);
    });
  };

  // Simulate sentence/word highlighting as audio plays
  const startWordHighlighting = () => {
    const words = currentPage.text.split(/\s+/);
    let index = 0;
    const intervalMs = Math.max(250, (600 / words.length) * 1000) / playbackSpeed;

    wordIntervalRef.current = window.setInterval(() => {
      if (index < words.length) {
        setActiveWordIndex(index);
        index++;
      } else {
        if (wordIntervalRef.current) {
          clearInterval(wordIntervalRef.current);
          wordIntervalRef.current = null;
        }
      }
    }, intervalMs);
  };

  const goToNextPage = () => {
    if (currentPageIndex < totalPages - 1) {
      stopAudio();
      const nextIndex = currentPageIndex + 1;
      setCurrentPageIndex(nextIndex);
      if (nextIndex === totalPages - 1) {
        triggerConfettiCelebration();
      }
    }
  };

  const goToPrevPage = () => {
    if (currentPageIndex > 0) {
      stopAudio();
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const triggerConfettiCelebration = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#ec4899', '#8b5cf6', '#10b981', '#3b82f6'],
      });
    } catch (e) {
      // ignore
    }
  };

  const handleWordClick = async (rawWord: string) => {
    const word = rawWord.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’]/g, '').trim();
    if (!word) return;

    setSelectedWord(word);
    setSentenceContext(currentPage.text);
    setWordExplanation(null);
    setIsLoadingExplanation(true);

    try {
      const response = await fetch('/api/explain-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word,
          sentenceContext: currentPage.text,
        }),
      });
      const data = await response.json();
      setWordExplanation(data.explanation || 'A wonderful word in our story!');
    } catch (e) {
      setWordExplanation(`"${word}" is an exciting word! It describes something special in our tale.`);
    } finally {
      setIsLoadingExplanation(false);
    }
  };

  const handlePronounceWord = (word: string) => {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(word);
      u.rate = 0.8;
      window.speechSynthesis.speak(u);
    }
  };

  // Callback when a new illustration is generated using gemini-3-pro-image-preview
  const handleImageGenerated = (newImageUrl: string, resolution: ImageResolution) => {
    setCurrentImageSize(resolution);
    const existingHistory = currentPage.imageHistory || (currentPage.imageUrl ? [currentPage.imageUrl] : []);
    const updatedHistory = [newImageUrl, ...existingHistory.filter((url) => url !== newImageUrl)];

    onUpdateStoryPage(currentPage.pageNumber, {
      imageUrl: newImageUrl,
      imageHistory: updatedHistory,
    });

    triggerConfettiCelebration();
  };

  const activeVoiceObj: VoiceOption =
    VOICE_OPTIONS.find((v) => v.id === selectedVoice) || VOICE_OPTIONS[0];

  const wordsArray = currentPage.text.split(' ');

  return (
    <div className="flex-1 flex flex-col max-w-6xl w-full mx-auto p-3 sm:p-6 pb-20">
      {/* Top Reading Navigation Bar */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-3 sm:p-4 shadow-sm border-2 border-amber-200/80 mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-3">
        {/* Book Title & Page Indicator */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenLibrary}
            className="w-10 h-10 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-800 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            title="Browse all storybooks"
          >
            <BookOpen className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-fun text-lg sm:text-xl font-bold text-slate-800 line-clamp-1">
              {story.title}
            </h2>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="text-amber-600 bg-amber-100/70 px-2 py-0.5 rounded-full">
                Page {currentPageIndex + 1} of {totalPages}
              </span>
              <span>•</span>
              <span className="hidden sm:inline">Theme: {story.theme}</span>
            </div>
          </div>
        </div>

        {/* Audio Narration Bar (`gemini-3.8-flash-tts`) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Voice Selector */}
          <div className="relative">
            <button
              onClick={() => setIsVoicePickerOpen(!isVoicePickerOpen)}
              className="px-3 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
              title="Change Voice Storyteller"
            >
              <span className="text-base">{activeVoiceObj.avatar}</span>
              <span className="hidden md:inline">{activeVoiceObj.label.split(' ')[0]}</span>
              <Settings2 className="w-3.5 h-3.5 text-amber-600" />
            </button>

            {isVoicePickerOpen && (
              <div className="absolute top-full mt-2 right-0 w-64 bg-white rounded-2xl shadow-xl border-2 border-amber-200 p-2 z-40 animate-in fade-in zoom-in-95">
                <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wider px-2 py-1">
                  Choose Narrator (Gemini 3.8 Flash TTS)
                </p>
                <div className="space-y-1">
                  {VOICE_OPTIONS.map((voice) => (
                    <button
                      key={voice.id}
                      onClick={() => {
                        setSelectedVoice(voice.id);
                        setIsVoicePickerOpen(false);
                        stopAudio();
                      }}
                      className={`w-full p-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                        selectedVoice === voice.id
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{voice.avatar}</span>
                        <div>
                          <p className="font-bold">{voice.label}</p>
                          <p className="text-[10px] text-slate-500 font-normal">{voice.description}</p>
                        </div>
                      </div>
                      {selectedVoice === voice.id && (
                        <Check className="w-4 h-4 text-amber-600 stroke-[3]" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Speed Controls */}
                <div className="mt-2 pt-2 border-t border-slate-100 px-2 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600">Reading Speed:</span>
                  <div className="flex gap-1">
                    {[0.8, 1.0, 1.2].map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setPlaybackSpeed(s);
                          if (audioRef.current) audioRef.current.playbackRate = s;
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          playbackSpeed === s
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* MAIN READ ALOUD PLAY BUTTON */}
          <button
            onClick={handleToggleAudio}
            disabled={isLoadingAudio}
            className={`px-4 sm:px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 ${
              isPlayingAudio
                ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
                : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white'
            }`}
          >
            {isLoadingAudio ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Summoning Voice...</span>
              </>
            ) : isPlayingAudio ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause Reading</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                <span>Read to Me 🔊</span>
              </>
            )}
          </button>

          {/* Ask Companion Button */}
          <button
            onClick={onOpenCompanionChat}
            className="p-2.5 rounded-2xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            title="Chat with Barnaby the Owl or Pip the Dragon"
          >
            <MessageCircle className="w-4 h-4 text-purple-600" />
            <span className="hidden sm:inline">Ask Buddy 🦉</span>
          </button>
        </div>
      </div>

      {/* Book Spread Container */}
      <div className="bg-white rounded-3xl shadow-xl border-4 border-amber-300 overflow-hidden flex flex-col lg:flex-row flex-1 min-h-[460px]">
        {/* Left Page: Large Magical Illustration (`gemini-3-pro-image-preview`) */}
        <div className="lg:w-1/2 bg-amber-50 relative flex flex-col p-4 sm:p-6 border-b-2 lg:border-b-0 lg:border-r-2 border-amber-200 justify-between group">
          {/* Top Illustration Badges & Controls */}
          <div className="flex items-center justify-between mb-3 z-10">
            {/* Required Affordance: 1K / 2K / 4K Resolution Badges */}
            <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-xl shadow-xs border border-amber-200">
              <span className="text-[11px] font-bold text-slate-500">Resolution:</span>
              {(['1K', '2K', '4K'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    setCurrentImageSize(size);
                    setIsImageModalOpen(true);
                  }}
                  title={`Generate with ${size} resolution using gemini-3-pro-image-preview`}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                    currentImageSize === size
                      ? 'bg-amber-500 text-white shadow-xs scale-105'
                      : 'bg-slate-100 text-slate-600 hover:bg-amber-100'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>

            {/* Fullscreen & Download */}
            <div className="flex items-center gap-1">
              {currentPage.imageUrl && (
                <button
                  onClick={() => setIsFullscreenImage(true)}
                  title="Expand to Fullscreen"
                  className="w-8 h-8 rounded-xl bg-white/90 hover:bg-white text-slate-700 flex items-center justify-center shadow-xs transition-all cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Center Illustration Frame */}
          <div className="relative flex-1 w-full rounded-2xl overflow-hidden bg-amber-100/60 shadow-inner flex items-center justify-center min-h-[260px] sm:min-h-[340px]">
            {currentPage.imageUrl ? (
              <img
                src={currentPage.imageUrl}
                alt={`Page ${currentPage.pageNumber} Illustration`}
                className="w-full h-full object-cover transition-all duration-300 hover:scale-102"
              />
            ) : (
              <div className="p-6 text-center text-amber-800">
                <div className="text-5xl mb-2">🎨</div>
                <p className="font-fun text-lg font-bold">A Canvas Waiting for Magic!</p>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Click the Magic Brush below to paint this page with gemini-3-pro-image-preview.
                </p>
              </div>
            )}

            {/* Reader mood pill */}
            {currentPage.readerMood && (
              <div className="absolute bottom-3 left-3 bg-slate-900/60 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-full">
                Mood: {currentPage.readerMood}
              </div>
            )}
          </div>

          {/* Bottom Illustration Action Bar */}
          <div className="mt-3 pt-3 border-t border-amber-200/80 flex items-center justify-between gap-2">
            {/* Version switcher if multiple illustrations were created */}
            {currentPage.imageHistory && currentPage.imageHistory.length > 1 ? (
              <div className="flex items-center gap-1 text-xs font-bold text-slate-600">
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-[11px]">Artwork versions:</span>
                <div className="flex gap-1 ml-1">
                  {currentPage.imageHistory.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => onUpdateStoryPage(currentPage.pageNumber, { imageUrl: url })}
                      className={`w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center cursor-pointer ${
                        currentPage.imageUrl === url
                          ? 'bg-amber-500 text-white'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <span className="text-[11px] text-slate-500 italic truncate max-w-[200px]">
                Page {currentPage.pageNumber} Art Studio
              </span>
            )}

            {/* MAGIC BRUSH BUTTON: Opens generator modal */}
            <button
              onClick={() => setIsImageModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 hover:from-amber-500 hover:to-rose-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Magic Brush ({currentImageSize})</span>
            </button>
          </div>
        </div>

        {/* Right Page: Big Kid-Friendly Story Text & Word Exploration */}
        <div className="lg:w-1/2 p-6 sm:p-8 flex flex-col justify-between bg-amber-50/20">
          <div>
            {/* Page Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-amber-100">
              <span className="font-fun text-sm font-bold text-amber-700 tracking-wide uppercase">
                Story Page {currentPage.pageNumber}
              </span>
              <span className="text-xs text-slate-400">
                💡 Tap any word to see what it means!
              </span>
            </div>

            {/* Main Story Paragraph with interactive words */}
            <div className="font-reading text-xl sm:text-2xl lg:text-3xl text-slate-800 leading-relaxed sm:leading-loose tracking-wide select-none">
              {wordsArray.map((word, index) => {
                const isHighlight = activeWordIndex === index;
                return (
                  <span
                    key={index}
                    onClick={() => handleWordClick(word)}
                    className={`inline-block mr-2 px-1 py-0.5 rounded-lg transition-all duration-150 cursor-pointer hover:bg-amber-200/80 hover:text-amber-950 active:scale-95 ${
                      isHighlight
                        ? 'bg-amber-300 text-amber-950 font-bold scale-105 shadow-xs ring-2 ring-amber-400'
                        : ''
                    }`}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Story Page Bottom Controls & Navigation */}
          <div className="mt-8 pt-4 border-t-2 border-amber-200/60 flex flex-col gap-3">
            {/* Auto-advance toggle */}
            <div className="flex items-center justify-between text-xs text-slate-500">
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={autoAdvance}
                  onChange={(e) => setAutoAdvance(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                />
                <span>Bedtime Mode: Turn page when reading finishes</span>
              </label>

              {isLastPage && (
                <span className="text-emerald-700 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> Book Complete!
                </span>
              )}
            </div>

            {/* Page Flip Buttons */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={goToPrevPage}
                disabled={currentPageIndex === 0}
                className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-amber-100 disabled:opacity-30 disabled:hover:bg-slate-100 font-fun font-bold text-sm text-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Previous Page</span>
              </button>

              <button
                onClick={goToNextPage}
                disabled={isLastPage}
                className={`flex-1 py-3 px-4 rounded-2xl font-fun font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-98 ${
                  isLastPage
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white'
                }`}
              >
                <span>Next Page</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Final Page Celebration Box */}
      {isLastPage && (
        <div className="mt-6 p-6 rounded-3xl bg-gradient-to-r from-amber-200 via-orange-200 to-pink-200 border-4 border-amber-400 text-center shadow-lg animate-in zoom-in-95">
          <div className="text-4xl mb-2">🎉 🌟 👑</div>
          <h3 className="font-fun text-2xl font-bold text-slate-800">
            Hooray! You Finished "{story.title}"!
          </h3>
          <p className="text-slate-700 font-medium text-sm mt-1 max-w-md mx-auto">
            {story.moral || "What a breathtaking adventure! You did an amazing job reading along!"}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                setCurrentPageIndex(0);
                triggerConfettiCelebration();
              }}
              className="px-5 py-2.5 bg-white hover:bg-amber-50 text-slate-800 font-bold text-xs rounded-xl shadow transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
              <span>Read Again</span>
            </button>
            <button
              onClick={onOpenLibrary}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Explore More Books</span>
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Image Lightbox */}
      {isFullscreenImage && currentPage.imageUrl && (
        <div
          onClick={() => setIsFullscreenImage(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-5xl max-h-[85vh] w-full flex items-center justify-center">
            <img
              src={currentPage.imageUrl}
              alt="Fullscreen Page Illustration"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
          </div>
          <p className="text-amber-200 text-xs font-semibold mt-3">
            Click anywhere to close full screen view ({currentImageSize} Resolution)
          </p>
        </div>
      )}

      {/* Image Generator Modal */}
      <ImageGeneratorModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        pageNumber={currentPage.pageNumber}
        initialPrompt={currentPage.imagePrompt || currentPage.text}
        onImageGenerated={handleImageGenerated}
      />

      {/* Word Explainer Modal (fast gemini-3.1-flash-lite) */}
      <WordExplainerModal
        word={selectedWord}
        sentenceContext={sentenceContext}
        explanation={wordExplanation}
        isLoading={isLoadingExplanation}
        onClose={() => setSelectedWord(null)}
        onSpeakWord={handlePronounceWord}
      />
    </div>
  );
};
