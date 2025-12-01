import React, { useState } from 'react';
import { Image, Download, Wand2, Loader2, Maximize2 } from 'lucide-react';
import { generateImage } from '../services/geminiService';
import { ImageGenerationResult } from '../types';

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<ImageGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const imageUrl = await generateImage(prompt);
      setResult({
        url: imageUrl,
        prompt,
        // Default size text since selection is no longer available
        size: '1024x1024' as any 
      });
    } catch (err: any) {
      console.error("Image gen error:", err);
      setError(err.message || "Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700">
       {/* Header */}
       <div className="bg-slate-800 p-4 border-b border-slate-700 flex items-center space-x-3">
        <div className="p-2 bg-pink-500/20 rounded-lg">
          <Image className="w-5 h-5 text-pink-400" />
        </div>
        <div>
          <h2 className="font-semibold text-lg">Nano Banana Studio</h2>
          <p className="text-xs text-slate-400">Efficient generation with gemini-2.5-flash-image</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          
          {/* Controls */}
          <div className="lg:col-span-1 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to create..."
                className="w-full h-32 bg-slate-800 text-slate-100 rounded-xl p-4 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl font-medium shadow-lg shadow-purple-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  <span>Generate</span>
                </>
              )}
            </button>

            {error && (
              <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-xl text-red-200 text-sm">
                {error}
              </div>
            )}
            
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 text-xs text-slate-400">
               <p>Using Nano Banana (Gemini 2.5 Flash Image) for fast results.</p>
            </div>
          </div>

          {/* Preview Area */}
          <div className="lg:col-span-2 bg-slate-800/50 rounded-2xl border border-slate-700/50 flex items-center justify-center p-4 min-h-[400px] relative group">
            {result ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                <img 
                  src={result.url} 
                  alt={result.prompt} 
                  className="max-w-full max-h-[600px] rounded-lg shadow-2xl object-contain"
                />
                <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a 
                    href={result.url} 
                    download={`gemini-gen-${Date.now()}.png`}
                    className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm transition-colors"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                  <button className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm transition-colors">
                     <Maximize2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-500">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                  <Image className="w-8 h-8 opacity-50" />
                </div>
                <p className="text-lg font-medium">Ready to create</p>
                <p className="text-sm mt-1">Your image will appear here</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;