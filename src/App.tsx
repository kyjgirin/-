import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BookReader } from './components/BookReader';
import { StoryLibraryModal } from './components/StoryLibraryModal';
import { StoryCreatorModal } from './components/StoryCreatorModal';
import { StoryCompanionChat } from './components/StoryCompanionChat';
import { DEFAULT_STORIES } from './data/defaultStories';
import { Story, StoryPage } from './types';
import { Sparkles, MessageCircle, Volume2, Palette, Brain } from 'lucide-react';

const STORAGE_KEY = 'storywonder_custom_stories';

export default function App() {
  const [stories, setStories] = useState<Story[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return [...DEFAULT_STORIES, ...parsed];
        }
      }
    } catch (e) {
      console.warn('Could not load custom stories from localStorage', e);
    }
    return DEFAULT_STORIES;
  });

  const [currentStoryId, setCurrentStoryId] = useState<string>(DEFAULT_STORIES[0].id);
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState<boolean>(false);
  const [isCompanionChatOpen, setIsCompanionChatOpen] = useState<boolean>(false);

  const currentStory = stories.find((s) => s.id === currentStoryId) || stories[0];

  // Save custom stories when changed
  const saveCustomStories = (allStories: Story[]) => {
    const customOnes = allStories.filter((s) => s.isCustom);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customOnes));
    } catch (e) {
      console.warn('Failed saving to localStorage', e);
    }
  };

  const handleUpdateStoryPage = (pageNumber: number, updatedFields: Partial<StoryPage>) => {
    setStories((prev) => {
      const next = prev.map((story) => {
        if (story.id !== currentStory.id) return story;
        return {
          ...story,
          pages: story.pages.map((page) => {
            if (page.pageNumber !== pageNumber) return page;
            return { ...page, ...updatedFields };
          }),
        };
      });
      saveCustomStories(next);
      return next;
    });
  };

  const handleStoryCreated = (newStory: Story) => {
    setStories((prev) => {
      const next = [newStory, ...prev];
      saveCustomStories(next);
      return next;
    });
    setCurrentStoryId(newStory.id);
  };

  const handleDeleteCustomStory = (storyId: string) => {
    setStories((prev) => {
      const next = prev.filter((s) => s.id !== storyId);
      saveCustomStories(next);
      return next;
    });
    if (currentStoryId === storyId) {
      setCurrentStoryId(DEFAULT_STORIES[0].id);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/40 text-slate-800">
      {/* App Header */}
      <Header
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onOpenCreateStory={() => setIsCreateStoryOpen(true)}
        onOpenCompanionChat={() => setIsCompanionChatOpen(true)}
      />

      {/* Main Book Reader Experience */}
      <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4">
        {currentStory ? (
          <BookReader
            story={currentStory}
            onUpdateStoryPage={handleUpdateStoryPage}
            onOpenCompanionChat={() => setIsCompanionChatOpen(true)}
            onOpenLibrary={() => setIsLibraryOpen(true)}
          />
        ) : (
          <div className="text-center p-12">
            <p className="font-fun text-xl font-bold text-slate-700">No story selected</p>
            <button
              onClick={() => setIsLibraryOpen(true)}
              className="mt-3 px-4 py-2 bg-amber-500 text-white font-bold rounded-xl"
            >
              Open Story Library
            </button>
          </div>
        )}
      </main>

      {/* Floating Story Companion Buddy Launcher */}
      <button
        onClick={() => setIsCompanionChatOpen(true)}
        className="fixed bottom-5 right-5 z-40 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer border-2 border-white/60 group"
      >
        <span className="text-2xl group-hover:rotate-12 transition-transform">🦉</span>
        <div className="hidden sm:block text-left">
          <p className="text-xs font-bold font-fun leading-tight">Chat with Barnaby & Pip</p>
          <p className="text-[10px] text-amber-100 font-medium">Gemini Reading Buddies</p>
        </div>
      </button>

      {/* Modals & Drawers */}
      <StoryLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        stories={stories}
        currentStoryId={currentStory?.id || ''}
        onSelectStory={(id) => setCurrentStoryId(id)}
        onDeleteCustomStory={handleDeleteCustomStory}
        onOpenCreateStory={() => setIsCreateStoryOpen(true)}
      />

      <StoryCreatorModal
        isOpen={isCreateStoryOpen}
        onClose={() => setIsCreateStoryOpen(false)}
        onStoryCreated={handleStoryCreated}
      />

      <StoryCompanionChat
        isOpen={isCompanionChatOpen}
        onClose={() => setIsCompanionChatOpen(false)}
        currentStoryTitle={currentStory?.title}
        currentPageNumber={currentStory?.pages[0]?.pageNumber || 1}
        currentPageText={currentStory?.pages[0]?.text || ''}
      />

      {/* Footer Info & Model Badges */}
      <footer className="bg-white/80 border-t border-amber-200/80 py-3 px-4 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-3 sm:gap-6 font-medium">
          <span className="flex items-center gap-1.5 text-amber-800">
            <Volume2 className="w-3.5 h-3.5 text-amber-600" />
            <span>Voice: <strong className="font-mono text-[11px]">gemini-3.8-flash-tts</strong></span>
          </span>
          <span className="flex items-center gap-1.5 text-orange-800">
            <Palette className="w-3.5 h-3.5 text-orange-600" />
            <span>Illustrator: <strong className="font-mono text-[11px]">gemini-3-pro-image-preview</strong> (1K/2K/4K)</span>
          </span>
          <span className="flex items-center gap-1.5 text-purple-800">
            <Brain className="w-3.5 h-3.5 text-purple-600" />
            <span>Companion Chat: <strong className="font-mono text-[11px]">gemini-3.8-flash & gemini-4-argon</strong></span>
          </span>
        </div>
      </footer>
    </div>
  );
}
