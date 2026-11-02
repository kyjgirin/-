import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Volume2,
  VolumeX,
  RotateCcw,
  Zap,
  Brain,
  MessageCircle,
  HelpCircle,
  X,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { ChatMessage, ChatPersona, ChatPersonaId, TaskComplexity } from '../types';
import { CHAT_PERSONAS } from '../data/defaultStories';

interface StoryCompanionChatProps {
  isOpen: boolean;
  onClose: () => void;
  currentStoryTitle?: string;
  currentPageNumber?: number;
  currentPageText?: string;
}

export const StoryCompanionChat: React.FC<StoryCompanionChatProps> = ({
  isOpen,
  onClose,
  currentStoryTitle,
  currentPageNumber,
  currentPageText,
}) => {
  const [selectedPersonaId, setSelectedPersonaId] = useState<ChatPersonaId>('owl');
  const [taskComplexity, setTaskComplexity] = useState<TaskComplexity>('general');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const initialPersona = CHAT_PERSONAS[0];
    return [
      {
        id: 'msg-0',
        role: 'model',
        text: initialPersona.greeting,
        timestamp: Date.now(),
        modelUsed: 'gemini-3.8-flash',
      },
    ];
  });
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activePersona: ChatPersona =
    CHAT_PERSONAS.find((p) => p.id === selectedPersonaId) || CHAT_PERSONAS[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // When persona changes, add a sweet introduction message
  const handlePersonaChange = (newPersonaId: ChatPersonaId) => {
    if (newPersonaId === selectedPersonaId) return;
    setSelectedPersonaId(newPersonaId);
    const newPersona = CHAT_PERSONAS.find((p) => p.id === newPersonaId) || CHAT_PERSONAS[0];
    setMessages((prev) => [
      ...prev,
      {
        id: `persona-switch-${Date.now()}`,
        role: 'model',
        text: newPersona.greeting,
        timestamp: Date.now(),
        modelUsed:
          taskComplexity === 'complex'
            ? 'gemini-4-argon'
            : taskComplexity === 'fast'
            ? 'gemini-3.1-flash-lite'
            : 'gemini-3.8-flash',
      },
    ]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: Date.now(),
    };

    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setInputPrompt('');
    setIsLoading(true);

    try {
      // Package conversation history for multi-turn server endpoint
      const payloadMessages = updatedHistory.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          taskType: taskComplexity, // 'general' | 'complex' | 'fast'
          persona: selectedPersonaId,
          storyContext: {
            title: currentStoryTitle,
            pageNumber: currentPageNumber,
            pageText: currentPageText,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get companion response');
      }

      const botMessage: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: data.reply,
        timestamp: Date.now(),
        modelUsed: data.modelUsed,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: "I'm fluttering my wings trying to think! Could you ask that again, little friend?",
        timestamp: Date.now(),
        modelUsed: 'gemini-3.8-flash',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Speak companion message aloud using gemini-3.8-flash-tts
  const handleSpeakMessage = async (msg: ChatMessage) => {
    if (speakingMessageId === msg.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setSpeakingMessageId(null);
      return;
    }

    try {
      setSpeakingMessageId(msg.id);
      const voiceMap: Record<ChatPersonaId, string> = {
        owl: 'Zephyr',
        dragon: 'Puck',
        fairy: 'Kore',
        character: 'Fenrir',
      };

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: msg.text,
          voiceName: voiceMap[selectedPersonaId] || 'Kore',
          style: `Enthusiastic and kind children's voice representing ${activePersona.name}`,
        }),
      });

      const data = await response.json();
      if (data.audioUrl) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        const audio = new Audio(data.audioUrl);
        audioRef.current = audio;
        audio.onended = () => setSpeakingMessageId(null);
        audio.onerror = () => setSpeakingMessageId(null);
        await audio.play();
      } else {
        // Fallback to browser synthesis
        if ('speechSynthesis' in window) {
          const u = new SpeechSynthesisUtterance(msg.text);
          u.onend = () => setSpeakingMessageId(null);
          window.speechSynthesis.speak(u);
        } else {
          setSpeakingMessageId(null);
        }
      }
    } catch (e) {
      console.error('Companion speak error:', e);
      setSpeakingMessageId(null);
    }
  };

  const handleResetChat = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setSpeakingMessageId(null);
    setMessages([
      {
        id: `reset-${Date.now()}`,
        role: 'model',
        text: activePersona.greeting,
        timestamp: Date.now(),
        modelUsed: 'gemini-3.8-flash',
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-amber-50/95 backdrop-blur-md shadow-2xl border-l-4 border-amber-300 flex flex-col transition-all duration-300">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-white shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur border border-white/40 flex items-center justify-center text-2xl shadow-inner">
            {activePersona.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-fun text-xl font-bold tracking-wide leading-tight">
                {activePersona.name}
              </h3>
            </div>
            <p className="text-xs text-amber-100 font-medium">{activePersona.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleResetChat}
            title="Start new conversation"
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Persona Tabs */}
      <div className="bg-amber-100/70 p-2 border-b border-amber-200 flex items-center gap-1 overflow-x-auto">
        {CHAT_PERSONAS.map((persona) => {
          const isSelected = selectedPersonaId === persona.id;
          return (
            <button
              key={persona.id}
              onClick={() => handlePersonaChange(persona.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-amber-500 text-white shadow-sm scale-[1.02]'
                  : 'bg-white/80 hover:bg-white text-slate-700 border border-amber-200'
              }`}
            >
              <span>{persona.avatar}</span>
              <span>{persona.name.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Model & Task Selector (Required: gemini-4-argon complex, gemini-3.8-flash general, gemini-3.1-flash-lite fast) */}
      <div className="px-4 py-2 bg-amber-50 border-b border-amber-200/80 flex items-center justify-between text-xs">
        <span className="font-bold text-slate-600 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Gemini Intelligence:
        </span>
        <div className="inline-flex rounded-xl bg-white p-1 border border-amber-200 shadow-xs">
          {(
            [
              {
                id: 'general',
                label: 'General',
                model: 'gemini-3.8-flash',
                icon: MessageCircle,
                tip: 'Default friendly buddy',
              },
              {
                id: 'complex',
                label: 'Deep Argon',
                model: 'gemini-4-argon',
                icon: Brain,
                tip: 'Complex reasoning & morals',
              },
              {
                id: 'fast',
                label: 'Fast Lite',
                model: 'gemini-3.1-flash-lite',
                icon: Zap,
                tip: 'Instant quick sparks',
              },
            ] as const
          ).map((m) => {
            const Icon = m.icon;
            const isSelected = taskComplexity === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setTaskComplexity(m.id)}
                title={`${m.model}: ${m.tip}`}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Story Context Notice */}
      {currentStoryTitle && (
        <div className="px-4 py-1.5 bg-amber-100/50 border-b border-amber-200/60 text-[11px] text-amber-900 flex items-center justify-between">
          <span className="truncate">
            📖 Reading: <strong>{currentStoryTitle}</strong> (Page {currentPageNumber || 1})
          </span>
          <span className="text-[10px] font-semibold text-amber-700 bg-amber-200/70 px-1.5 py-0.5 rounded">
            Context Active
          </span>
        </div>
      )}

      {/* Scrollable Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isModel = msg.role === 'model';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isModel ? 'justify-start' : 'justify-end'}`}
            >
              {isModel && (
                <div className="w-9 h-9 rounded-2xl bg-amber-400 text-white flex items-center justify-center text-lg shadow-sm flex-shrink-0 mt-0.5 border border-amber-300">
                  {activePersona.avatar}
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm relative group ${
                  isModel
                    ? 'bg-white text-slate-800 border border-amber-200/80 rounded-tl-sm'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-tr-sm font-medium'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>

                {/* Footer for Model Bubble */}
                {isModel && (
                  <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono text-[10px]">
                      {msg.modelUsed || 'gemini-3.8-flash'}
                    </span>
                    <button
                      onClick={() => handleSpeakMessage(msg)}
                      title="Read aloud using gemini-3.8-flash-tts"
                      className="flex items-center gap-1 text-amber-600 hover:text-amber-800 font-bold transition-all cursor-pointer p-0.5 rounded"
                    >
                      {speakingMessageId === msg.id ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Listen</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {!isModel && (
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-400 text-white flex items-center justify-center text-base shadow-sm flex-shrink-0 mt-0.5 font-bold">
                  🧒
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-400 text-white flex items-center justify-center text-lg shadow-sm flex-shrink-0">
              {activePersona.avatar}
            </div>
            <div className="bg-white border border-amber-200 rounded-2xl px-4 py-3 text-sm rounded-tl-sm shadow-sm flex items-center gap-2 text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
              <span className="font-medium text-xs">
                {activePersona.name} is thinking with{' '}
                <span className="font-mono font-bold text-amber-700">
                  {taskComplexity === 'complex'
                    ? 'gemini-4-argon'
                    : taskComplexity === 'fast'
                    ? 'gemini-3.1-flash-lite'
                    : 'gemini-3.8-flash'}
                </span>
                ...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Kid Suggested Questions */}
      <div className="px-3 pt-2 pb-1 bg-amber-100/60 border-t border-amber-200">
        <p className="text-[11px] font-bold text-amber-800 mb-1 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-amber-600" /> Quick Questions:
        </p>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {activePersona.suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              disabled={isLoading}
              className="px-2.5 py-1 bg-white hover:bg-amber-50 active:scale-95 text-[11px] font-semibold text-slate-700 rounded-xl border border-amber-200 whitespace-nowrap shadow-2xs transition-all cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="p-3 bg-white border-t border-amber-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isLoading}
            placeholder={`Ask ${activePersona.name.split(' ')[0]} anything...`}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 border-2 border-amber-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 text-sm outline-none text-slate-800 font-medium transition-all"
          />
          <button
            type="submit"
            disabled={isLoading || !inputPrompt.trim()}
            className="w-11 h-11 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-white flex items-center justify-center shadow-md shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
