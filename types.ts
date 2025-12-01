
export enum AppMode {
  CHAT = 'CHAT',
  IMAGE = 'IMAGE',
  TTS = 'TTS'
}

export enum ImageSize {
  SIZE_1K = '1K',
  SIZE_2K = '2K',
  SIZE_4K = '4K'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  attachment?: {
    data: string;
    mimeType: string;
  };
  isThinking?: boolean;
}

export interface ImageGenerationResult {
  url: string;
  prompt: string;
  size: ImageSize;
}

export const VOICES = [
  { name: 'Puck', gender: 'Male', style: 'Energetic' },
  { name: 'Charon', gender: 'Male', style: 'Deep' },
  { name: 'Kore', gender: 'Female', style: 'Balanced' },
  { name: 'Fenrir', gender: 'Male', style: 'Authoritative' },
  { name: 'Zephyr', gender: 'Female', style: 'Calm' },
];
