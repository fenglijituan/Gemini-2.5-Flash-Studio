
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
    type: 'image' | 'audio'; 
  };
  isThinking?: boolean;
}

export interface ImageGenerationResult {
  url: string;
  prompt: string;
  size: ImageSize;
}

export interface Persona {
  id: string;
  name: string;
  icon: string;
  systemInstruction: string;
  description: string;
}

export const PERSONAS: Persona[] = [
  {
    id: 'default',
    name: 'Helpful Assistant',
    icon: 'Bot',
    description: 'Versatile and balanced',
    systemInstruction: "You are a helpful and versatile AI assistant powered by Gemini 2.5 Flash. You provide clear, concise, and accurate answers. Use formatting like Markdown to make your responses easy to read."
  },
  {
    id: 'coder',
    name: 'Coding Guru',
    icon: 'Terminal',
    description: 'Expert in software engineering',
    systemInstruction: "You are an expert Senior Software Engineer. You write clean, efficient, and well-documented code. You prefer TypeScript and React. Always explain your code choices."
  },
  {
    id: 'creative',
    name: 'Storyteller',
    icon: 'Feather',
    description: 'Imaginative and descriptive',
    systemInstruction: "You are a creative writer and storyteller. You use vivid imagery, metaphors, and engaging narratives. Your tone is expressive and captivating."
  },
  {
    id: 'analyst',
    name: 'Data Analyst',
    icon: 'BarChart',
    description: 'Logical and data-driven',
    systemInstruction: "You are a data analyst. You prefer structured data, tables, and logical reasoning. You break down complex problems into step-by-step analysis."
  }
];

export const VOICES = [
  { name: 'Puck', gender: 'Male', style: 'Energetic' },
  { name: 'Charon', gender: 'Male', style: 'Deep' },
  { name: 'Kore', gender: 'Female', style: 'Balanced' },
  { name: 'Fenrir', gender: 'Male', style: 'Authoritative' },
  { name: 'Zephyr', gender: 'Female', style: 'Calm' },
];