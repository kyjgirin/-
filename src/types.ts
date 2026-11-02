export type ImageResolution = '1K' | '2K' | '4K';

export type AspectRatio = '4:3' | '1:1' | '16:9';

export type ArtStyle = 
  | "Children's storybook watercolor with soft whimsical lighting"
  | "3D claymation cartoon with vibrant textures"
  | "Classic vintage fairytale illustration, gouache and pastel"
  | "Colorful paper cut-out collage, playful and layered"
  | "Modern cheerful digital anime picture book";

export interface StoryPage {
  pageNumber: number;
  text: string;
  imagePrompt: string;
  imageUrl?: string;
  imageHistory?: string[];
  readerMood?: string;
  audioUrl?: string;
  audioVoice?: string;
}

export interface Story {
  id: string;
  title: string;
  synopsis: string;
  moral?: string;
  coverImage?: string;
  author: string;
  targetAge: '3-5' | '6-8' | '9-12';
  theme: string;
  pages: StoryPage[];
  isCustom?: boolean;
}

export interface VoiceOption {
  id: string;
  name: string;
  label: string;
  description: string;
  avatar: string;
  gender: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  modelUsed?: string;
  audioPlaying?: boolean;
}

export type ChatPersonaId = 'owl' | 'dragon' | 'fairy' | 'character';

export interface ChatPersona {
  id: ChatPersonaId;
  name: string;
  title: string;
  avatar: string;
  badge: string;
  description: string;
  greeting: string;
  suggestedQuestions: string[];
}

export type TaskComplexity = 'general' | 'complex' | 'fast';
