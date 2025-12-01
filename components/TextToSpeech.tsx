
import React, { useState, useRef } from 'react';
import { Volume2, Play, Loader2, StopCircle, Mic } from 'lucide-react';
import { generateSpeech } from '../services/geminiService';
import { VOICES } from '../types';

const TextToSpeech: React.FC = () => {
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioSource, setAudioSource] = useState<AudioBufferSourceNode | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  const stopAudio = () => {
    if (audioSource) {
      try {
        audioSource.stop();
      } catch (e) {
        // Ignore if already stopped
      }
      setAudioSource(null);
    }
    setIsPlaying(false);
  };

  const playAudio = async (base64Data: string) => {
    stopAudio();
    
    try {
      // Create context if needed
      const ctx = audioContext || new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      if (!audioContext) setAudioContext(ctx);

      // Decode
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const audioBuffer = await ctx.decodeAudioData(bytes.buffer);
      
      // Play
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setIsPlaying(false);
      
      setAudioSource(source);
      setIsPlaying(true);
      source.start(0);

    } catch (e) {
      console.error("Playback failed", e);
      setIsPlaying(false);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) return;
    
    setIsGenerating(true);
    try {
      const base64Audio = await generateSpeech(text, selectedVoice);
      await playAudio(base64Audio);
    } catch (e) {
      console.error("TTS Error", e);
      alert("Failed to generate speech");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700">
      <div className="bg-slate-800 p-4 border-b border-slate-700 flex items-center space-x-3">
        <div className="p-2 bg-emerald-500/20 rounded-lg">
          <Volume2 className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="font-semibold text-lg">Text to Speech</h2>
          <p className="text-xs text-slate-400">Powered by gemini-2.5-flash-preview-tts</p>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
             <label className="text-sm font-medium text-slate-300">Text to Speak</label>
             <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to convert to speech..."
              className="w-full h-64 bg-slate-800 text-slate-100 rounded-xl p-4 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
             />
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Select Voice</label>
              <div className="grid grid-cols-1 gap-2">
                {VOICES.map((voice) => (
                  <button
                    key={voice.name}
                    onClick={() => setSelectedVoice(voice.name)}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      selectedVoice === voice.name
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-100'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                    }`}
                  >
                    <span className="font-medium">{voice.name}</span>
                    <span className="text-xs opacity-70">{voice.gender} • {voice.style}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={isPlaying ? stopAudio : handleGenerate}
              disabled={isGenerating || !text.trim()}
              className={`w-full py-4 rounded-xl font-medium shadow-lg flex items-center justify-center space-x-2 transition-all ${
                isPlaying 
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-500/20'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : isPlaying ? (
                 <>
                  <StopCircle className="w-5 h-5" />
                  <span>Stop Playback</span>
                 </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Generate & Play</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextToSpeech;
