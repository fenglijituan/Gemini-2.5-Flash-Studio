
import { GoogleGenAI, Chat, GenerateContentResponse, Modality } from "@google/genai";
import { ImageSize } from "../types";

// Helper to get a fresh AI instance with the latest key
const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const createChatSession = (systemInstruction: string): Chat => {
  const ai = getAIClient();
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
      thinkingConfig: {
         thinkingBudget: 1024 // Efficient thinking budget
      }
    },
  });
};

export const generateImage = async (prompt: string): Promise<string> => {
  const ai = getAIClient();
  
  // Using gemini-2.5-flash-image (Nano Banana)
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: prompt }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1" 
      }
    }
  });

  // Extract image from response
  // The structure is candidates[0].content.parts
  const parts = response.candidates?.[0]?.content?.parts;
  
  if (!parts) {
    throw new Error("No content generated");
  }

  for (const part of parts) {
    if (part.inlineData && part.inlineData.data) {
       return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image data found in response");
};

export const generateSpeech = async (text: string, voiceName: string): Promise<string> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  
  if (!base64Audio) {
    throw new Error("No audio generated");
  }

  return base64Audio;
};